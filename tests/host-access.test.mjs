import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createWorkshopServer } from '../server.mjs';

async function start(t) {
  const server = createWorkshopServer({ hostPassword: 'password' });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  return 'http://127.0.0.1:' + server.address().port;
}
const login = (base, password, extra = {}) => fetch(base + '/api/host/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify({ password })
});

test('direct host URLs and forged sessions cannot bypass sign-in; participant app stays public', async t => {
  const base = await start(t);
  for (const route of ['/?presenter=1', '/index.html?presenter=1']) {
    const response = await fetch(base + route, { headers: { Cookie: 'nyc_host=forged' } });
    assert.match(await response.text(), /host-login-form/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.equal((await fetch(base + '/api/host/session')).status, 401);
  assert.equal((await login(base, 'wrong')).status, 401);
  assert.equal((await login(base, null)).status, 401);
  assert.match(await (await fetch(base + '/')).text(), /id="app"/);
  assert.equal((await fetch(base + '/api/feed')).status, 200);
});

test('correct password opens host page; locking and restarting revoke that access', async t => {
  const base = await start(t);
  const response = await login(base, 'password');
  assert.equal(response.status, 200);
  const header = response.headers.get('set-cookie');
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Strict/);
  const cookie = header.split(';')[0];
  const headers = { Cookie: cookie };
  assert.equal((await fetch(base + '/api/host/session', { headers })).status, 200);
  const page = await (await fetch(base + '/?presenter=1', { headers })).text();
  assert.doesNotMatch(page, /host-login-form/);
  assert.match(page, /id="app"/);
  const other = await start(t);
  assert.equal((await fetch(other + '/api/host/session', { headers })).status, 401);
  assert.equal((await fetch(base + '/api/host/logout', { method: 'POST', headers })).status, 200);
  assert.equal((await fetch(base + '/api/host/session', { headers })).status, 401);
  assert.match(await (await fetch(base + '/?presenter=1', { headers })).text(), /host-login-form/);
});

test('unrelated origins and repeated wrong password attempts are rejected', async t => {
  const base = await start(t);
  assert.equal((await login(base, 'password', { Origin:'https://unrelated.example' })).status, 403);
  for (let n = 0; n < 5; n++) assert.equal((await login(base, 'wrong')).status, 401);
  assert.equal((await login(base, 'wrong')).status, 429);
});
