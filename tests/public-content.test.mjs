import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
const code = await readFile(new URL('../content.js', import.meta.url), 'utf8');
for (const mode of ['unavailable', 'invalid', 'success']) {
  test(`public content preserves SSR until a valid published response: ${mode}`, async () => {
    let resolve;
    const pending = new Promise(r => { resolve = r; });
    const window = {}; const events = [];
    runInNewContext(code, { window, fetch: () => pending, document: { dispatchEvent: e => events.push(e.type) }, CustomEvent: class { constructor(type) { this.type = type; } }, Error, Array });
    assert.equal(window.SHU_YI_CONTENT, undefined);
    resolve({ ok: mode !== 'unavailable', json: async () => [{ slug: 'fixture', status: mode === 'invalid' ? 'draft' : 'published' }] });
    await window.SHU_YI_CONTENT_READY;
    if (mode === 'success') { assert.equal(window.SHU_YI_CONTENT[0].status, 'published'); assert.deepEqual(events, ['shuyi-content-ready']); }
    else { assert.equal(window.SHU_YI_CONTENT, undefined); assert.equal(events.length, 0); }
  });
}
