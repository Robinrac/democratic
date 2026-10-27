import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { openStore } from './storage/store.mjs';
import { roleCards } from './workshop/roles.mjs';
import { hash, fail, makeSession, issueCodes, summary, feed, hostView, release, join, me, participantWrite } from './workshop/model.mjs';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8' };
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" };
function reply(res, status, body) { res.writeHead(status, { ...headers, 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); }
async function readJSON(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'Send JSON data.');
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 8192) fail(413, 'This request is too large.'); chunks.push(chunk); }
  let data; try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(400, 'Invalid request.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(400, 'Send a JSON object.');
  return data;
}
const equal = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export async function createWorkshopServer({ hostPassword = process.env.HOST_PASSWORD, store, databaseUrl = process.env.DATABASE_URL, dataDir = process.env.DATA_DIR, production = process.env.NODE_ENV === 'production', publicOrigin = process.env.PUBLIC_ORIGIN } = {}) {
  if (!hostPassword || hostPassword.length < 16) throw new Error('Set HOST_PASSWORD to a unique secret of at least 16 characters.');
  if (production && ((!databaseUrl && !store) || !publicOrigin?.startsWith('https://'))) throw new Error('Production requires DATABASE_URL and an HTTPS PUBLIC_ORIGIN.');
  const ownStore = !store;
  store ||= await openStore({ databaseUrl, ...(dataDir ? { dataDir } : {}) });
  const sign = value => createHmac('sha256', hostPassword).update('open-circle-host:' + value).digest('hex');
  function authorized(cookie) {
    if (!cookie) return false;
    const [expiry, nonce, signature] = cookie.split('.');
    return Number(expiry) > Date.now() && Number(expiry) < Date.now() + 9 * 3600000 && !!nonce && !!signature && equal(sign(expiry + '.' + nonce), signature);
  }
  const attempts = new Map();
  function limit(req, category, max) {
    const now = Date.now();
    for (const [key, record] of attempts) if (record.until <= now) attempts.delete(key);
    const key = category + ':' + req.socket.remoteAddress;
    const record = attempts.get(key) || { count: 0, until: now + 60000 };
    record.count++; attempts.set(key, record);
    if (record.count > max) fail(429, 'Too many attempts. Wait one minute and try again.');
  }
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const hostToken = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('nyc_host='))?.slice(9);
      const hostAuthorized = authorized(hostToken) && !(await store.isRevoked(hash(hostToken)));
      const token = req.headers.authorization?.replace(/^Bearer /, '');
      const sid = url.searchParams.get('s');
      if (url.pathname.startsWith('/api/')) {
        if (!['GET', 'POST'].includes(req.method)) fail(405, 'Method not allowed.');
        if (req.method === 'POST') {
          const allowed = publicOrigin || 'http://' + req.headers.host;
          if (req.headers['sec-fetch-site'] === 'cross-site' || req.headers.origin && req.headers.origin !== allowed) fail(403, 'Open the workshop directly to continue.');
        }
        const route = url.pathname.slice(5);
        if (route === 'health' && req.method === 'GET') { await store.health(); return reply(res, 200, { ok: true }); }
        if (route === 'host/login' && req.method === 'POST') {
          limit(req, 'login', 5);
          const data = await readJSON(req);
          if (typeof data.password !== 'string' || !equal(data.password, hostPassword)) fail(401, 'Incorrect password. Try again.');
          const value = (Date.now() + 8 * 3600000) + '.' + randomBytes(24).toString('hex');
          if (authorized(hostToken)) await store.revoke(hash(hostToken), Number(hostToken.split('.')[0]));
          res.setHeader('Set-Cookie', `nyc_host=${value}.${sign(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${production ? '; Secure' : ''}`);
          return reply(res, 200, { ok: true });
        }
        if (route.startsWith('host/')) {
          if (!hostAuthorized) fail(401, 'Host sign-in required.');
          if (route === 'host/session' && req.method === 'GET') return reply(res, 200, { ok: true });
          if (route === 'host/logout' && req.method === 'POST') {
            await store.revoke(hash(hostToken), Number(hostToken.split('.')[0]));
            res.setHeader('Set-Cookie', 'nyc_host=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' + (production ? '; Secure' : ''));
            return reply(res, 200, { ok: true });
          }
          if (route === 'host/sessions') {
            if (req.method === 'GET') return reply(res, 200, { sessions: (await store.list()).map(summary) });
            const data = await readJSON(req), created = makeSession(data);
            const inserted = await store.create(created.state);
            return reply(res, inserted ? 201 : 200, { session: summary(inserted ? created.state : await store.read(data.id)), codes: inserted ? created.codes : [], retried: !inserted });
          }
          if (!sid) fail(400, 'Choose a workshop session.');
          if (route === 'host/state' && req.method === 'GET') {
            const state = await store.read(sid); if (!state) fail(410, 'Session expired or cleared.');
            return reply(res, 200, hostView(state, url.searchParams.getAll('include')));
          }
          if (route === 'host/export' && req.method === 'GET') {
            const state = await store.read(sid); if (!state) fail(410, 'Session expired or cleared.');
            const { credentials, roles, ...content } = state;
            return reply(res, 200, { ...content, roles: roles.map(({ codeHash, ...role }) => role) });
          }
          if (req.method !== 'POST') fail(404, 'Not found.');
          const data = await readJSON(req);
          if (route === 'host/delete') {
            const state = await store.read(sid); if (!state) return reply(res, 200, { ok: true });
            if (data.confirmLabel !== state.label) fail(400, 'Type the session label to clear its data.');
            await store.delete(sid); return reply(res, 200, { ok: true });
          }
          const result = await store.update(sid, state => {
            if (route === 'host/action') return release(state, data);
            if (data.version !== state.version) fail(409, 'The session changed. Refresh before trying again.');
            if (route === 'host/pause') {
              if (typeof data.paused !== 'boolean' || state.phase === 'ended') fail(400, 'Choose pause or resume for an active session.');
              state.paused = data.paused; state.version++; return summary(state);
            }
            if (route === 'host/codes') {
              if (!['opening', 'debate'].includes(state.phase)) fail(409, 'Team claiming has closed.');
              const codes = issueCodes(state); state.version++; return { codes };
            }
            if (route === 'host/moderate') {
              const post = state.posts.find(p => p.id === data.postId && p.origin === 'team');
              if (!post) fail(400, 'Only participant-authored content can be hidden.');
              post.hidden = true; state.version++; return { ok: true };
            }
            if (route === 'host/reset') {
              if (state.kind !== 'rehearsal' || data.confirmLabel !== state.label) fail(403, 'Only a rehearsal can be reset; type its exact label.');
              const fresh = makeSession({ id: sid, label: state.label, kind: state.kind, expiresAt: data.expiresAt });
              fresh.state.version = state.version + 1;
              Object.assign(state, fresh.state); return { session: summary(state), codes: fresh.codes };
            }
            fail(404, 'Not found.');
          });
          return reply(res, 200, result);
        }
        if (!sid) fail(400, 'Open the session link supplied by your host.');
        if (req.method === 'GET') {
          const state = await store.read(sid); if (!state) fail(410, 'Session expired or cleared. Ask the host for the current link.');
          if (route === 'feed') return reply(res, 200, feed(state));
          if (route === 'projector') return reply(res, 200, { ...summary(state), question: feed(state).question });
          if (route === 'me') return reply(res, 200, me(state, token));
          if (route === 'profile') {
            const result = feed(state), profile = result.profiles.find(p => p.id === url.searchParams.get('id'));
            if (!profile) fail(404, 'This profile is unavailable.');
            const posts = result.posts.filter(p => p.author.id === profile.id);
            return reply(res, 200, { profile, posts, postCount: posts.length });
          }
          fail(404, 'Not found.');
        }
        if (route === 'join') limit(req, 'join', 30); else limit(req, 'writes', 180);
        const data = await readJSON(req);
        const result = await store.update(sid, state => route === 'join' ? join(state, data, token) : participantWrite(state, token, route, data));
        return reply(res, 200, result);
      }
      if (!['GET', 'HEAD'].includes(req.method)) fail(405, 'Method not allowed.');
      const privatePage = url.pathname === '/host' || url.searchParams.has('host');
      let file;
      if (privatePage && !hostAuthorized) file = fileURLToPath(new URL('./host-login.html', import.meta.url));
      else if (privatePage) file = fileURLToPath(new URL('./host.html', import.meta.url));
      else if (url.pathname === '/host.js') {
        if (!hostAuthorized) fail(401, 'Host sign-in required.');
        file = fileURLToPath(new URL('./host.js', import.meta.url));
      } else if (/^\/portraits\/[1-7]\.png$/.test(url.pathname)) {
        const card = roleCards[Number(url.pathname.split('/')[2][0]) - 1];
        file = fileURLToPath(new URL('./assets/role-portraits/' + card.portraitFile, import.meta.url));
      } else {
        const allowed = ['/', '/index.html', '/app.js', '/open-circle.js', '/open-circle.css', '/host-login.js', '/styles.css', '/profile-themes.js', '/vendor/qrcode.js', '/vendor/MUNIA-LICENSE.txt'];
        if (!allowed.includes(url.pathname)) fail(404, 'Not found.');
        file = path.join(root, url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
      }
      const data = await readFile(file);
      res.writeHead(200, { ...headers, 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      if (!res.headersSent) reply(res, error.status || 503, { error: error.status ? error.message : 'Storage is unavailable. Nothing was confirmed. Keep this page open and retry; refresh the host state before releasing again.' });
    }
  });
  server.store = store;
  server.shutdown = async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); if (ownStore) await store.close(); };
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const port = Number(process.env.PORT || 4173);
    const host = process.env.HOST || (process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1');
    const server = await createWorkshopServer();
    server.on('error', error => { console.error(error.message); void server.shutdown(); process.exitCode = 1; });
    server.listen(port, host, () => {
      console.log('Open Circle host: http://localhost:' + port + '/host');
      if (host === '0.0.0.0') for (const list of Object.values(os.networkInterfaces())) for (const item of list || []) if (item.family === 'IPv4' && !item.internal) console.log('Same network host: http://' + item.address + ':' + port + '/host');
    });
    let closing = false;
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { if (closing) return; closing = true; await server.shutdown(); process.exit(0); });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
