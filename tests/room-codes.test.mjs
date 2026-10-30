import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { workshop } from './helpers.mjs';

test('six-letter codes resolve safely, stay stable across reset, and stop working after deletion or expiry', async t => {
  const w = await workshop(t); await w.login();
  const { sid, session } = await w.session('rehearsal', 'transport-v1');
  assert.match(session.joinCode, /^[A-Z]{6}$/);
  const code = session.joinCode;
  const resolved = await w.call('rooms/resolve', { code: code.slice(0, 3).toLowerCase() + ' ' + code.slice(3).toLowerCase() });
  assert.equal(resolved.status, 200); assert.equal(resolved.id, sid);
  for (const key of ['roles', 'credentials', 'actions', 'posts', 'targets']) assert.equal(resolved[key], undefined);
  for (const bad of ['', 'ABC', '123456', 'ABCDEFZ', null, {}]) assert.equal((await w.call('rooms/resolve', { code: bad })).status, 400);
  assert.equal((await w.call('rooms/resolve', { code: 'IIIIII' })).status, 404);
  assert.equal((await w.call('host/sessions')).status, 401);
  assert.equal((await w.call('projector', undefined, { sid })).joinCode, code);
  const team = await w.claim(sid);
  await w.action(sid, 'debate');
  assert.equal((await w.call('rooms/resolve', { code })).id, sid);
  const before = await w.state(sid);
  const reset = await w.call('host/reset', { version: before.version, confirmLabel: before.label, expiresAt: Date.now() + 86400000 }, { sid, host: true });
  assert.equal(reset.session.joinCode, code);
  assert.equal((await w.call('me', undefined, { sid, token: team.token })).status, 401);
  assert.equal((await w.state(sid)).joinCode, code);
  await w.server.store.update(sid, state => { state.phase = 'ended'; });
  assert.equal((await w.call('rooms/resolve', { code })).status, 410);
  await w.call('host/delete', { confirmLabel: before.label }, { sid, host: true });
  assert.equal((await w.call('rooms/resolve', { code })).status, 404);
  const other = await w.session();
  await w.server.store.transaction(client => client.query('UPDATE open_circle_sessions SET expires_at=$2 WHERE id=$1', [other.sid, Date.now() - 1]));
  assert.equal((await w.call('rooms/resolve', { code: other.session.joinCode })).status, 404);
});

test('room-code allocation is unique, idempotent and backfills older rooms without changing their contents', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'open-circle-codes-'));
  t.after(async () => { assert.equal(path.dirname(directory), path.resolve(tmpdir())); assert.ok(path.basename(directory).startsWith('open-circle-codes-')); await rm(directory, { recursive: true, force: true }); });
  const w = await workshop(t, { dataDir: directory }); await w.login();
  const rooms = await Promise.all(Array.from({ length: 8 }, () => w.session('rehearsal', 'transport-v1')));
  assert.equal(new Set(rooms.map(r => r.session.joinCode)).size, 8);
  const room = rooms[0], old = rooms[1], team = await w.claim(old.sid);
  const retry = await w.call('host/sessions', { id: room.sid, label: 'Should not replace', kind: 'rehearsal', expiresAt: Date.now() + 3600000 }, { host: true });
  assert.equal(retry.status, 200); assert.equal(retry.session.joinCode, room.session.joinCode); assert.equal(retry.session.label, room.session.label);
  await w.server.store.transaction(async client => {
    await client.query('DELETE FROM open_circle_room_codes WHERE session_id=$1', [old.sid]);
    await client.query("UPDATE open_circle_sessions SET state=state-'joinCode' WHERE id=$1", [old.sid]);
  });
  await w.stop();
  const reopened = await workshop(t, { dataDir: directory }); await reopened.login();
  const restored = await reopened.state(old.sid);
  assert.match(restored.joinCode, /^[A-Z]{6}$/); assert.equal(restored.participants, 1);
  assert.equal((await reopened.call('me', undefined, { sid: old.sid, token: team.token })).participant.id, team.participant.id);
  assert.equal((await reopened.state(room.sid)).joinCode, room.session.joinCode);
  assert.equal((await reopened.call('rooms/resolve', { code: restored.joinCode })).id, old.sid);
  await reopened.stop();
});
