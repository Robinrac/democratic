import { readFile, mkdir, open, unlink, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { randomInt } from 'node:crypto';

export async function openStore({ databaseUrl, dataDir = path.join(os.homedir(), '.democratic', 'open-circle') } = {}) {
  let db, lock;
  if (databaseUrl) db = new pg.Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 5000, statement_timeout: 10000, idleTimeoutMillis: 30000 });
  else {
    if (dataDir !== ':memory:') {
      await mkdir(dataDir, { recursive: true });
      const sourceRoot = await realpath(fileURLToPath(new URL('../', import.meta.url)));
      const relative = path.relative(sourceRoot, await realpath(dataDir));
      if (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)) throw new Error('DATA_DIR must be outside the source repository. Choose a private data folder.');
      // PGlite is single-process. Refuse a second writer instead of corrupting files.
      lock = path.join(dataDir, '.writer-lock');
      const handle = await open(lock, 'wx').catch(() => { throw new Error('Local database is already open (or has a stale .writer-lock). See the rehearsal guide.'); });
      await handle.writeFile(String(process.pid)); await handle.close();
    }
    db = new PGlite(dataDir === ':memory:' ? undefined : dataDir);
  }
  // An idle provider connection may disappear during maintenance. Failed requests
  // still surface through the route; an idle pool error must not crash the process.
  if (databaseUrl) db.on('error', () => {});
  const transaction = databaseUrl ? async fn => {
    const client = await db.connect();
    try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  } : fn => db.transaction(fn);
  const close = async () => { if (databaseUrl) await db.end(); else await db.close(); if (lock) await unlink(lock); };
  async function assignCode(client, id) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let attempt = 0; attempt < 100; attempt++) {
      const existing = (await client.query('SELECT code FROM open_circle_room_codes WHERE session_id=$1', [id])).rows[0];
      if (existing) return existing.code;
      const code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('');
      const result = await client.query('INSERT INTO open_circle_room_codes(session_id, code) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING code', [id, code]);
      if (result.rows.length) return result.rows[0].code;
    }
    throw new Error('Could not allocate a room code. Try creating the room again.');
  }
  try {
    const sql = (await Promise.all(['001-sessions.sql', '002-room-codes.sql'].map(file => readFile(new URL('./migrations/' + file, import.meta.url), 'utf8')))).join('\n');
    await transaction(async client => {
      for (const statement of sql.split(';').filter(s => s.trim())) await client.query(statement);
      const rooms = await client.query('SELECT id FROM open_circle_sessions WHERE expires_at > $1 ORDER BY id', [Date.now()]);
      for (const room of rooms.rows) await assignCode(client, room.id);
    });
  } catch (error) { await close(); throw error; }
  return {
    transaction, close,
    async isRevoked(tokenHash) { return (await db.query('SELECT 1 FROM open_circle_revocations WHERE token_hash=$1', [tokenHash])).rows.length > 0; },
    async revoke(tokenHash, expiresAt) {
      await db.query('DELETE FROM open_circle_revocations WHERE expires_at <= $1', [Date.now()]);
      await db.query('INSERT INTO open_circle_revocations VALUES ($1,$2) ON CONFLICT DO NOTHING', [tokenHash, expiresAt]);
    },
    async health() { await db.query('SELECT 1'); },
    async list() {
      await db.query('DELETE FROM open_circle_sessions WHERE expires_at <= $1', [Date.now()]);
      return (await db.query('SELECT s.state, c.code FROM open_circle_sessions s JOIN open_circle_room_codes c ON c.session_id=s.id ORDER BY s.id')).rows.map(r => ({ ...r.state, joinCode: r.code }));
    },
    async create(state) {
      return transaction(async client => {
        const result = await client.query('INSERT INTO open_circle_sessions(id, expires_at, state) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id', [state.id, state.expiresAt, JSON.stringify(state)]);
        state.joinCode = await assignCode(client, state.id);
        return result.rows.length > 0;
      });
    },
    async read(id) {
      await db.query('DELETE FROM open_circle_sessions WHERE id=$1 AND expires_at <= $2', [id, Date.now()]);
      const row = (await db.query('SELECT s.state, c.code FROM open_circle_sessions s JOIN open_circle_room_codes c ON c.session_id=s.id WHERE s.id=$1', [id])).rows[0];
      return row ? { ...row.state, joinCode: row.code } : undefined;
    },
    async resolveCode(code) {
      const row = (await db.query('SELECT s.id FROM open_circle_room_codes c JOIN open_circle_sessions s ON s.id=c.session_id WHERE c.code=$1 AND s.expires_at > $2', [code, Date.now()])).rows[0];
      return row?.id;
    },
    async update(id, fn) {
      return transaction(async client => {
        const row = (await client.query('SELECT state, expires_at, (SELECT code FROM open_circle_room_codes WHERE session_id=$1) AS code FROM open_circle_sessions WHERE id=$1 FOR UPDATE', [id])).rows[0];
        const state = row?.state;
        if (!state || Number(row.expires_at) <= Date.now() || state.expiresAt <= Date.now()) throw Object.assign(new Error('Session expired or cleared. Ask the host for the current link.'), { status: 410 });
        state.joinCode = row.code;
        const result = await fn(state);
        await client.query('UPDATE open_circle_sessions SET state=$2, expires_at=$3 WHERE id=$1', [id, JSON.stringify(state), state.expiresAt]);
        return result;
      });
    },
    async delete(id) { await db.query('DELETE FROM open_circle_sessions WHERE id=$1', [id]); }
  };
}
