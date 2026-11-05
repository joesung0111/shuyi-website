import { lookup, reverse } from 'node:dns/promises';
import { isIP } from 'node:net';

const verificationCache = new Map();
const CACHE_MS = 7 * 24 * 60 * 60 * 1000;
const GOOGLE_HOST = /(?:^|\.)(?:googlebot\.com|google\.com|googleusercontent\.com)$/i;

export function classifyUserAgent(userAgent = '') {
  const ua = String(userAgent).slice(0, 512);
  const lower = ua.toLowerCase();
  if (/googlebot|google-inspectiontool|storebot-google|adsbot-google/.test(lower)) return { category: 'search_engine', engine: 'Google', claimed: true };
  if (/bingbot|msnbot/.test(lower)) return { category: 'search_engine', engine: 'Bing', claimed: true };
  const engines = [['Yandex', /yandex(bot|images|accessibilitybot)/], ['Baidu', /baiduspider/], ['DuckDuckGo', /duckduckbot/], ['Apple', /applebot/], ['Yahoo', /slurp/], ['Seznam', /seznambot/], ['Naver', /yeti\//]];
  const engine = engines.find(([, pattern]) => pattern.test(lower));
  if (engine) return { category: 'search_engine', engine: engine[0], claimed: true };
  if (/playwright|puppeteer|selenium|webdriver|headlesschrome|curl\/|wget\/|python-requests|httpclient|go-http-client|java\/|libwww-perl/i.test(ua)) return { category: 'suspected_automation', engine: null, claimed: false };
  if (/bot|crawler|spider|crawling|scrapy|headlesschrome|phantomjs|lighthouse|pagespeed|monitoring|uptime|preview/i.test(ua)) return { category: 'other_bot', engine: null, claimed: false };
  if (!ua || !/mozilla|opera|curl|wget|python|java|go-http|httpclient/i.test(ua)) return { category: 'unknown', engine: null, claimed: false };
  return { category: 'visitor', engine: null, claimed: false };
}

export function deviceDetails(userAgent = '') {
  const ua = String(userAgent).toLowerCase();
  const device = /ipad|tablet|kindle|silk|playbook/.test(ua) ? 'tablet' : /mobile|iphone|ipod|android/.test(ua) ? 'mobile' : 'desktop';
  const browser = /edg\//.test(ua) ? 'Edge' : /opr\//.test(ua) ? 'Opera' : /firefox\//.test(ua) ? 'Firefox' : /(?:chrome|crios)\//.test(ua) ? 'Chrome' : /safari\//.test(ua) ? 'Safari' : /msie|trident\//.test(ua) ? 'Internet Explorer' : 'Other';
  const os = /windows/.test(ua) ? 'Windows' : /iphone|ipad|ipod/.test(ua) ? 'iOS' : /android/.test(ua) ? 'Android' : /mac os|macintosh/.test(ua) ? 'macOS' : /linux/.test(ua) ? 'Linux' : 'Other';
  return { device, browser, os };
}

export function maskedIp(ip) {
  if (!ip) return '';
  if (ip.includes(':')) return `${ip.split(':').slice(0, 4).join(':')}::`;
  const parts = ip.split('.');
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0` : '';
}

export function sanitizePath(value) {
  try {
    const url = new URL(String(value || '/'), 'https://local.invalid');
    return (url.pathname || '/').slice(0, 1024);
  } catch { return '/'; }
}

export function sanitizeReferer(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value));
    return `${url.origin}${url.pathname}`.slice(0, 1024);
  } catch { return ''; }
}

export function cleanIp(value) {
  if (!value) return '';
  const ip = String(value).trim().replace(/^::ffff:/i, '');
  return isIP(ip) ? ip : '';
}

export function classifyRequest(req, trustedProxy) {
  const ua = String(req.headers['user-agent'] || '').slice(0, 512);
  const bot = classifyUserAgent(ua);
  const peer = cleanIp(req.socket?.remoteAddress);
  const ip = trustedProxy(peer) ? cleanIp(req.headers['cf-connecting-ip']) || peer : peer;
  const details = deviceDetails(ua);
  const kind = req.url?.startsWith('/api/') ? 'api' : /\.(?:css|js|mjs|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|mp4|webm|pdf)(?:\?|$)/i.test(req.url || '') ? 'static' : 'page';
  return { ip, ua, bot, details, kind, referer: sanitizeReferer(req.headers.referer), path: sanitizePath(req.url), country: trustedProxy(peer) ? String(req.headers['cf-ipcountry'] || '').slice(0, 2).toUpperCase() : '' };
}

async function verifyByDns(ip, engine) {
  const key = `${engine}:${ip}`;
  const cached = verificationCache.get(key);
  if (cached && cached.until > Date.now()) return cached.verified;
  let verified = false;
  try {
    const names = await reverse(ip);
    const allowed = engine === 'Google' ? GOOGLE_HOST : /(?:^|\.)search\.msn\.com$/i;
    for (const name of names) {
      if (!allowed.test(name)) continue;
      const addresses = await lookup(name, { all: true });
      if (addresses.some((entry) => cleanIp(entry.address) === cleanIp(ip))) { verified = true; break; }
    }
  } catch { /* DNS failure leaves the claim unverified. */ }
  verificationCache.set(key, { verified, until: Date.now() + CACHE_MS });
  return verified;
}

export async function verifyClaimedCrawler(ip, engine) {
  if (!ip || !engine || !['Google', 'Bing'].includes(engine)) return false;
  return verifyByDns(ip, engine);
}
