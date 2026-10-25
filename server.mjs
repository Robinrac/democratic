import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { isProfileTheme, createAppearancePicker } from './dist/profile-themes.js';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };
const firstNames = ['Sam', 'Robin', 'Noor', 'Charlie', 'Alex', 'Kim', 'Jamie', 'Elliot', 'Sasha', 'Lou', 'Mika', 'Ari', 'Billie', 'Jules', 'Remi', 'Rio', 'Dani', 'Ellis', 'Frankie', 'Taylor'];
const lastNames = ['Lind', 'Berg', 'Dahl', 'Lund', 'Holm', 'Strand', 'Vik', 'Sol', 'West', 'Frost'];

function reply(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}
async function readJSON(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw Object.assign(new Error('Send JSON data.'), { status: 415 });
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 8192) throw Object.assign(new Error('This request is too large.'), { status: 413 });
  }
  try { return JSON.parse(body); }
  catch { throw Object.assign(new Error('Invalid request.'), { status: 400 }); }
}
function publicPost({ requestId, ...post }) { return post; }

// One temporary workshop per process. No participant data is written to disk.
export function createWorkshopServer({ hostPassword = process.env.HOST_PASSWORD || 'password' } = {}) {
  const sessions = new Map();
  const nextAppearance = createAppearancePicker();
  const hosts = new Map();
  const attempts = new Map();
  const posts = [];
  const names = firstNames.flatMap(first => lastNames.map(last => first + ' ' + last));
  for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const hostToken = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('nyc_host='))?.slice(9);
      const hostAuthorized = (hosts.get(hostToken) || 0) > Date.now();
      if (url.pathname.startsWith('/api/')) {
        if (req.method === 'POST' && req.headers.origin && !['http://' + req.headers.host, 'https://' + req.headers.host].includes(req.headers.origin)) return reply(res, 403, { error: 'Open the workshop directly to continue.' });
        if (url.pathname === '/api/host/login' && req.method === 'POST') {
          const data = await readJSON(req);
          const now = Date.now();
          for (const [address, record] of attempts) if (record.until <= now) attempts.delete(address);
          for (const [secret, expiry] of hosts) if (expiry <= now) hosts.delete(secret);
          const address = req.socket.remoteAddress;
          const record = attempts.get(address) || { count: 0, until: now + 60000 };
          if (record.count >= 5) return reply(res, 429, { error: 'Too many attempts. Wait one minute and try again.' });
          if (typeof data?.password !== 'string' || data.password !== hostPassword) {
            record.count++; attempts.set(address, record);
            return reply(res, 401, { error: 'Incorrect password. Try again.' });
          }
          attempts.delete(address);
          if (hostToken) hosts.delete(hostToken);
          const secret = randomUUID();
          hosts.set(secret, now + 8 * 60 * 60 * 1000);
          res.setHeader('Set-Cookie', 'nyc_host=' + secret + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800' + (req.socket.encrypted ? '; Secure' : ''));
          return reply(res, 200, { ok: true });
        }
        if (url.pathname === '/api/host/session' && req.method === 'GET') return reply(res, hostAuthorized ? 200 : 401, hostAuthorized ? { ok: true } : { error: 'Host sign-in required.' });
        if (url.pathname === '/api/host/logout' && req.method === 'POST') {
          hosts.delete(hostToken);
          res.setHeader('Set-Cookie', 'nyc_host=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
          return reply(res, 200, { ok: true });
        }
        const token = req.headers.authorization?.replace(/^Bearer /, '');
        const participant = sessions.get(token);
        if (url.pathname === '/api/join' && req.method === 'POST') {
          await readJSON(req);
          if (participant) return reply(res, 200, { token, participant });
          if (sessions.size >= 1000) return reply(res, 429, { error: 'This workshop is full.' });
          const number = sessions.size;
          const name = names[number % names.length] + (number >= names.length ? ' ' + (Math.floor(number / names.length) + 1) : '');
          const identity = { id: randomUUID(), name, ...nextAppearance(), bio: 'Here to share ideas, listen and explore.', joinedAt: new Date().toISOString() };
          const secret = randomUUID();
          sessions.set(secret, identity);
          return reply(res, 201, { token: secret, participant: identity });
        }
        if (url.pathname === '/api/me' && req.method === 'GET') return reply(res, participant ? 200 : 401, participant ? { participant } : { error: 'Join the workshop to continue.' });
        if (url.pathname === '/api/feed' && req.method === 'GET') return reply(res, 200, { posts: posts.slice(-200).reverse().map(publicPost), participants: sessions.size, profiles: [...sessions.values()] });
        if (url.pathname === '/api/profile' && req.method === 'GET') {
          const profile = [...sessions.values()].find(person => person.id === url.searchParams.get('id'));
          if (!profile) return reply(res, 404, { error: 'This profile is no longer available.' });
          const authored = posts.filter(post => post.author.id === profile.id);
          return reply(res, 200, { profile, postCount: authored.length, posts: authored.slice(-200).reverse().map(publicPost) });
        }
        if (url.pathname === '/api/profile' && req.method === 'POST') {
          if (!participant) return reply(res, 401, { error: 'Your workshop session has ended. Join again to edit your profile.' });
          const data = await readJSON(req);
          if (!data || typeof data.bio !== 'string' || data.bio.trim().length > 160 || !isProfileTheme(data.color) || !isProfileTheme(data.cover)) return reply(res, 400, { error: 'Use a bio of up to 160 characters and choose one of the available styles.' });
          Object.assign(participant, { bio: data.bio.trim(), color: data.color, cover: data.cover });
          return reply(res, 200, { participant });
        }
        if (url.pathname === '/api/posts' && req.method === 'POST') {
          if (!participant) return reply(res, 401, { error: 'Your workshop session has ended. Join again to post.' });
          const data = await readJSON(req);
          if (!data || typeof data.text !== 'string' || !data.text.trim() || data.text.trim().length > 500) return reply(res, 400, { error: 'Write a post between 1 and 500 characters.' });
          if (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9-]{10,80}$/.test(data.requestId)) return reply(res, 400, { error: 'Missing post identifier. Please refresh and try again.' });
          const previous = posts.find(post => post.author.id === participant.id && post.requestId === data.requestId);
          if (previous) return reply(res, 200, { post: publicPost(previous) });
          if (posts.length >= 5000) return reply(res, 429, { error: 'This workshop has reached its post limit.' });
          const post = { id: randomUUID(), text: data.text.trim(), author: participant, createdAt: new Date().toISOString(), requestId: data.requestId };
          posts.push(post);
          return reply(res, 201, { post: publicPost(post) });
        }
        return reply(res, 404, { error: 'Not found.' });
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
      if (url.searchParams.has('presenter') && !hostAuthorized) {
        const login = await readFile(new URL('./host-login.html', import.meta.url));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
        return res.end(req.method === 'HEAD' ? undefined : login);
      }
      const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      const relative = path.relative(root, file);
      if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403); return res.end(); }
      let data;
      try { data = await readFile(file); } catch { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) { if (!res.headersSent) reply(res, error.status || 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' }); }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || (process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1');
  const server = createWorkshopServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, host, () => {
    console.log('Workshop: http://localhost:' + port);
    if (host === '0.0.0.0') for (const list of Object.values(os.networkInterfaces())) for (const item of list || []) if (item.family === 'IPv4' && !item.internal) console.log('Same network: http://' + item.address + ':' + port);
  });
}
