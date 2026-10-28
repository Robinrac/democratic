import { once } from 'node:events';
import { randomBytes, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createWorkshopServer } from '../server.mjs';
import { roleCards } from '../workshop/roles.mjs';
export const paperProfile = (index = 0) => ({ name: roleCards[index].fullName, town: roleCards[index].town, bio: '', color: 0, cover: 0 });
export const password = 'test-only-host-password-very-long';
export const secret = () => randomBytes(32).toString('hex');
export async function workshop(t, options = {}) {
  const server = await createWorkshopServer({ hostPassword: password, dataDir: ':memory:', databaseUrl: null, production: false, publicOrigin: null, ...options });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  let stopped = false;
  const stop = async () => { if (!stopped) { stopped = true; await server.shutdown(); } };
  t.after(stop);
  const base = 'http://127.0.0.1:' + server.address().port;
  let cookie = '';
  const readers = new Map();
  async function call(route, body, { sid, token, host = false, origin, extra = {} } = {}) {
    // Read as the first joined team unless a test explicitly requests anonymous access.
    if (token === undefined && (route === 'feed' || route.startsWith('profile?'))) token = readers.get(sid);
    const url = new URL('/api/' + route, base); if (sid) url.searchParams.set('s', sid);
    const response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(host ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}), ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, headers: response.headers, ...await response.json() };
  }
  async function login() { const result = await call('host/login', { password }); assert.equal(result.status, 200); cookie = result.headers.get('set-cookie').split(';')[0]; return cookie; }
  async function session(kind = 'rehearsal', scenario = 'legacy') {
    const result = await call('host/sessions', { id: randomUUID(), label: kind + ' test', kind, scenario, expiresAt: Date.now() + 86400000 }, { host: true });
    assert.equal(result.status, 201); return { sid: result.session.id, session: result.session };
  }
  async function state(sid, include = []) { return call('host/state' + (include.length ? '?' + include.map(v => 'include=' + v).join('&') : ''), undefined, { host: true, sid }); }
  async function action(sid, action, extra = {}) {
    const s = await state(sid);
    return call('host/action', { action, version: s.version, requestId: randomUUID(), ...extra }, { host: true, sid });
  }
  async function claim(sid, index = 0) { const token = secret(); const result = await call('join', paperProfile(index), { sid, token }); assert.equal(result.status, 200); if (!readers.has(sid)) readers.set(sid, token); return { ...result, token }; }
  return { server, base, stop, call, login, session, state, action, claim, get cookie() { return cookie; }, set cookie(value) { cookie = value; } };
}
