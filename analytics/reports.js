import { createRequestLog, queryError } from './request-log.js';
const date = (value, fallback, offsetMinutes = 0, inclusiveEnd = false) => {
  if (!value) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) throw queryError('請選擇有效日期。');
  const [year, month, day] = String(value).split('-').map(Number);
  const base = Date.UTC(year, month - 1, day);
  if (new Date(base).toISOString().slice(0, 10) !== value) throw queryError('請選擇有效日期。');
  return new Date(base + (inclusiveEnd ? 86400000 : 0) + offsetMinutes * 60000).toISOString();
};
const boundedPage = (value) => Math.max(1, Math.min(100000, Number.parseInt(value, 10) || 1));
const boundedLimit = (value) => Math.max(10, Math.min(100, Number.parseInt(value, 10) || 50));

export function createAnalyticsReports(db) {
  const range = (params) => {
    const toDate = new Date();
    const fallbackTo = new Date(toDate.getTime() + 86400000).toISOString();
    const tzOffset = Math.max(-840, Math.min(840, Number.parseInt(params.get('tzOffset'), 10) || 0));
    let from = date(params.get('from'), new Date(Date.now() - 7 * 86400000).toISOString(), tzOffset);
    let to = date(params.get('to'), fallbackTo, tzOffset, true);
    const localDateTime = (value) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(value || ''));
      if (!value) return null;
      if (!match || Number(match[4]) > 23 || Number(match[5]) > 59) throw queryError('請選擇有效時間。');
      return new Date(date(value.slice(0, 10), '', tzOffset)).getTime() + Number(match[4]) * 3600000 + Number(match[5]) * 60000;
    };
    const fromTime = localDateTime(params.get('fromTime'));
    const toTime = localDateTime(params.get('toTime'));
    if (fromTime !== null) from = new Date(fromTime).toISOString();
    if (toTime !== null) to = new Date(toTime + 60000).toISOString();
    if (new Date(to) <= new Date(from)) throw queryError('結束時間必須晚於起始時間。');
    return { from, to, modifier: `${tzOffset <= 0 ? '+' : '-'}${Math.abs(tzOffset)} minutes` };
  };
  const requestLog = createRequestLog(db, range);
  const timeFormat = (from, to) => (new Date(to).getTime() - new Date(from).getTime() <= 2 * 86400000 ? '%Y-%m-%dT%H:00' : '%Y-%m-%d');

  function overview(params) {
    const { from, to } = range(params);
    const req = db.prepare('SELECT COUNT(*) requests, SUM(status BETWEEN 400 AND 599) errors, SUM(is_admin) admin_requests, SUM(bot_category=\'search_engine\') crawlers, SUM(bot_category=\'other_bot\') other_bots FROM analytics_requests WHERE occurred_at>=? AND occurred_at<?').get(from, to) || {};
    const views = db.prepare('SELECT COUNT(*) pageviews, COUNT(DISTINCT visitor_id) visitors, COUNT(DISTINCT session_id) sessions, AVG(duration_seconds) avg_duration FROM analytics_pageviews WHERE entered_at>=? AND entered_at<? AND session_id IN (SELECT session_id FROM analytics_sessions WHERE is_admin=0)').get(from, to) || {};
    return { ...req, ...views, avg_duration: Math.round(views.avg_duration || 0) };
  }
  function trend(params) {
    const { from, to, modifier } = range(params);
    if (new Date(to) - new Date(from) > 366 * 86400000) throw queryError('趨勢查詢最多 366 天，請縮小日期區間。');
    const format = timeFormat(from, to);
    const views = db.prepare(`SELECT strftime('${format}',datetime(entered_at,'${modifier}')) bucket,COUNT(DISTINCT visitor_id) visitors,COUNT(*) pageviews FROM analytics_pageviews WHERE entered_at>=? AND entered_at<? AND session_id IN (SELECT session_id FROM analytics_sessions WHERE is_admin=0) GROUP BY bucket ORDER BY bucket`).all(from, to);
    const requests = db.prepare(`SELECT strftime('${format}',datetime(occurred_at,'${modifier}')) bucket,COUNT(*) requests,SUM(bot_category='search_engine') crawlers,SUM(is_admin) admin_requests FROM analytics_requests WHERE occurred_at>=? AND occurred_at<? GROUP BY bucket ORDER BY bucket`).all(from, to);
    const byBucket = new Map(requests.map((row) => [row.bucket, row]));
    const buckets = new Map(views.map((row) => [row.bucket, { ...row, requests: byBucket.get(row.bucket)?.requests || 0, crawlers: byBucket.get(row.bucket)?.crawlers || 0, admin_requests: byBucket.get(row.bucket)?.admin_requests || 0 }]));
    for (const [key, row] of byBucket) if (!buckets.has(key)) buckets.set(key, { bucket: key, visitors: 0, pageviews: 0, requests: row.requests, crawlers: row.crawlers, admin_requests: row.admin_requests });
    const step = format.includes('T') ? 3600000 : 86400000;
    const offsetMs = Number.parseInt(modifier.replace(' minutes', ''), 10) * 60000;
    for (let time = Math.floor((new Date(from).getTime() + offsetMs) / step) * step; time < new Date(to).getTime() + offsetMs; time += step) {
      const bucket = new Date(time).toISOString().slice(0, format.includes('T') ? 16 : 10);
      if (!buckets.has(bucket)) buckets.set(bucket, { bucket, visitors: 0, pageviews: 0, requests: 0, crawlers: 0, admin_requests: 0 });
    }
    return [...buckets.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
  }
  function visitors(params) {
    const { from, to } = range(params);
    const search = String(params.get('q') || '').slice(0, 100);
    const offset = (boundedPage(params.get('page')) - 1) * boundedLimit(params.get('limit'));
    const query = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    return db.prepare(`WITH ranged_sessions AS (SELECT * FROM analytics_sessions WHERE started_at<? AND last_seen>=?)
      SELECT v.visitor_id,v.first_seen,COALESCE(MAX(p.entered_at),MAX(s.started_at)) last_seen,
      MAX(s.is_admin) is_admin,
      (SELECT rs.ip_source FROM ranged_sessions rs WHERE rs.visitor_id=v.visitor_id ORDER BY rs.last_seen DESC LIMIT 1) ip_source,
      (SELECT rs.ip FROM ranged_sessions rs WHERE rs.visitor_id=v.visitor_id ORDER BY rs.last_seen DESC LIMIT 1) ip,
      (SELECT rs.country FROM ranged_sessions rs WHERE rs.visitor_id=v.visitor_id ORDER BY rs.last_seen DESC LIMIT 1) country,
      (SELECT rs.device FROM ranged_sessions rs WHERE rs.visitor_id=v.visitor_id ORDER BY rs.last_seen DESC LIMIT 1) device,
      (SELECT rs.browser FROM ranged_sessions rs WHERE rs.visitor_id=v.visitor_id ORDER BY rs.last_seen DESC LIMIT 1) browser,
      (SELECT rs.bot_category FROM ranged_sessions rs WHERE rs.visitor_id=v.visitor_id ORDER BY rs.last_seen DESC LIMIT 1) bot_category,
      (SELECT rs.bot_engine FROM ranged_sessions rs WHERE rs.visitor_id=v.visitor_id ORDER BY rs.last_seen DESC LIMIT 1) bot_engine,
      (SELECT rs.crawler_claimed FROM ranged_sessions rs WHERE rs.visitor_id=v.visitor_id ORDER BY rs.last_seen DESC LIMIT 1) crawler_claimed,
      (SELECT rs.referrer FROM ranged_sessions rs WHERE rs.visitor_id=v.visitor_id ORDER BY rs.last_seen DESC LIMIT 1) referrer,
      COUNT(DISTINCT s.session_id) sessions,COUNT(DISTINCT p.id) pageviews,
      (SELECT rs.session_id FROM ranged_sessions rs WHERE rs.visitor_id=v.visitor_id ORDER BY rs.last_seen DESC LIMIT 1) latest_session
      FROM analytics_visitors v JOIN ranged_sessions s ON s.visitor_id=v.visitor_id
      LEFT JOIN analytics_pageviews p ON p.session_id=s.session_id AND p.entered_at>=? AND p.entered_at<?
      WHERE (?='' OR v.visitor_id LIKE ? ESCAPE '\\' OR s.ip LIKE ? ESCAPE '\\' OR EXISTS(SELECT 1 FROM analytics_pageviews pp WHERE pp.session_id=s.session_id AND pp.page_path LIKE ? ESCAPE '\\'))
      GROUP BY v.visitor_id ORDER BY last_seen DESC LIMIT ? OFFSET ?`).all(to, from, from, to, search, query, query, query, boundedLimit(params.get('limit')), offset);
  }
  function session(sessionId) {
    const summary = db.prepare('SELECT s.*,v.first_seen,v.last_seen visitor_last_seen FROM analytics_sessions s JOIN analytics_visitors v USING(visitor_id) WHERE session_id=?').get(sessionId);
    if (!summary) return null;
    const pages = db.prepare('SELECT * FROM analytics_pageviews WHERE session_id=? ORDER BY entered_at,id').all(sessionId);
    const events = db.prepare('SELECT * FROM analytics_events WHERE session_id=? ORDER BY occurred_at,id').all(sessionId);
    return { ...summary, pages, events };
  }
  function requests(params) {
    const { from, to, modifier } = range(params);
    const filters = ['occurred_at>=?', 'occurred_at<?'];
    const values = [from, to];
    const add = (sql, value) => { if (value !== null && value !== '') { filters.push(sql); values.push(value); } };
    add('ip LIKE ?', params.get('ip') ? `%${String(params.get('ip')).slice(0, 64)}%` : '');
    add('path LIKE ?', params.get('path') ? `%${String(params.get('path')).slice(0, 200)}%` : '');
    add('status=?', /^\d{3}$/.test(params.get('status') || '') ? Number(params.get('status')) : '');
    const botType = params.get('bot');
    if (botType === 'admin') add('is_admin=?', 1);
    if (botType === 'visitor') add('is_admin=?', 0);
    if (['visitor', 'search_engine', 'other_bot', 'suspected_automation', 'unknown'].includes(botType)) add('bot_category=?', botType);
    if (['Google', 'Bing'].includes(params.get('engine'))) add('bot_engine=?', params.get('engine'));
    const offset = (boundedPage(params.get('page')) - 1) * boundedLimit(params.get('limit'));
    return db.prepare(`SELECT * FROM analytics_requests WHERE ${filters.join(' AND ')} ORDER BY occurred_at DESC,id DESC LIMIT ? OFFSET ?`).all(...values, boundedLimit(params.get('limit')), offset);
  }
  function crawlers(params) {
    const { from, to, modifier } = range(params);
    return {
      daily: db.prepare(`SELECT date(datetime(occurred_at,'${modifier}')) day,bot_engine engine,COUNT(*) requests,SUM(crawler_verified) verified,SUM(status BETWEEN 400 AND 599) errors FROM analytics_requests WHERE occurred_at>=? AND occurred_at<? AND bot_category='search_engine' GROUP BY day,bot_engine ORDER BY day,bot_engine`).all(from, to),
      pages: db.prepare("SELECT bot_engine engine,path,COUNT(*) requests,SUM(status=404) not_found,SUM(status>=500) server_errors,MAX(occurred_at) last_seen FROM analytics_requests WHERE occurred_at>=? AND occurred_at<? AND bot_category='search_engine' GROUP BY bot_engine,path ORDER BY requests DESC LIMIT 100").all(from, to),
      recent: db.prepare("SELECT bot_engine engine,MAX(occurred_at) last_crawl,SUM(crawler_verified) verified,COUNT(*) requests FROM analytics_requests WHERE occurred_at>=? AND occurred_at<? AND bot_category='search_engine' GROUP BY bot_engine").all(from, to)
    };
  }
  function events(params) {
    const { from, to } = range(params);
    return db.prepare('SELECT event_name,COUNT(*) count,COUNT(DISTINCT e.session_id) sessions FROM analytics_events e JOIN analytics_sessions s ON e.session_id=s.session_id WHERE occurred_at>=? AND occurred_at<? AND s.is_admin=0 GROUP BY event_name ORDER BY count DESC').all(from, to);
  }
  function eventDetails(params) {
    const { from, to } = range(params);
    if (new Date(to) - new Date(from) > 366 * 86400000) throw queryError('事件查詢最多 366 天。');
    const name = params.get('event') || '';
    if (!/^[a-z][a-z0-9_]{1,47}$/.test(name)) throw queryError('無效的事件名稱。');
    return {
      pages: db.prepare(`SELECT COALESCE(p.page_path,s.entry_path) page_path,COUNT(*) count,COUNT(DISTINCT e.session_id) sessions FROM analytics_events e JOIN analytics_sessions s ON s.session_id=e.session_id LEFT JOIN analytics_pageviews p ON p.id=e.pageview_id AND p.session_id=e.session_id WHERE e.occurred_at>=? AND e.occurred_at<? AND e.event_name=? AND s.is_admin=0 GROUP BY COALESCE(p.page_path,s.entry_path) ORDER BY count DESC,page_path LIMIT 20`).all(from, to, name),
      recent: db.prepare(`SELECT e.occurred_at,e.session_id,e.target,COALESCE(p.page_path,s.entry_path) page_path FROM analytics_events e JOIN analytics_sessions s ON s.session_id=e.session_id LEFT JOIN analytics_pageviews p ON p.id=e.pageview_id AND p.session_id=e.session_id WHERE e.occurred_at>=? AND e.occurred_at<? AND e.event_name=? AND s.is_admin=0 ORDER BY e.occurred_at DESC,e.id DESC LIMIT 25`).all(from, to, name)
    };
  }
  return { overview, trend, visitors, session, requests, crawlers, events, eventDetails, requestPage: requestLog.page, prepareExport: requestLog.prepareExport };
}
