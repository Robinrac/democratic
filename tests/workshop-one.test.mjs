import { associations, identifyAssociation } from '../workshop/types.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { workshop, secret } from './helpers.mjs';

async function createRoom(w, extra = {}) {
  const result = await w.call('host/sessions', { id: randomUUID(), label: 'Association rehearsal', kind: 'rehearsal', workshopType: 'workshop-1', expiresAt: Date.now() + 86400000, ...extra }, { host: true });
  assert.equal(result.status, 201);
  return result.session.id;
}

test('Workshop 1 isolates six read-only associations and rejects forum features and incident actions', async t => {
  const w = await workshop(t); await w.login(); const sid = await createRoom(w);
  const roster = await w.state(sid);
  assert.equal(roster.workshopType, 'workshop-1'); assert.equal(roster.capacity, 6);
  assert.deepEqual(roster.actions.map(a => a.id), ['activate-voting', 'close-voting', 'end']);
  assert.equal(roster.roles.length, 6);
  const first = secret(), second = secret();
  for (const name of ['', '1', 'Unknown organization', 'Youth', 'The', null]) assert.equal((await w.call('join', { name }, { sid, token: first })).status, 400);
  const joined = await w.call('join', { name: associations[1 - 1].name }, { sid, token: first });
  assert.equal(joined.status, 200); assert.equal(joined.scope, 'reader');
  assert.equal(joined.association.name, 'The Creative & Cultural Collective');
  assert.equal((await w.call('join', { name: associations[1 - 1].name }, { sid, token: second })).status, 409);
  assert.equal((await w.call('join', { name: associations[2 - 1].name }, { sid, token: second })).status, 200);
  assert.deepEqual((await w.call('join', { name: associations[1 - 1].name }, { sid, token: first })).association, joined.association);
  assert.equal((await w.state(sid)).participants, 2);
  const feed = await w.call('feed', undefined, { sid, token: first });
  assert.deepEqual(feed.profiles, []); assert.deepEqual(feed.posts, []); assert.deepEqual(feed.threads, []);
  assert.equal(feed.news.articles.length, 8);
  assert.equal(feed.news.articles[0].id, 'arts-home');
  assert.doesNotMatch(JSON.stringify(feed), /"audiences"|"framing"|"voting"|coordinators/);
  const projector = await w.call('projector', undefined, { sid });
  assert.equal(projector.workshopType, 'workshop-1'); assert.equal(projector.capacity, 6);
  assert.equal(projector.roles, undefined); assert.doesNotMatch(projector.question, /usernames/);
  assert.equal((await w.call('feed', undefined, { sid, token: null })).status, 401);
  assert.equal((await w.call('profile?id=1', undefined, { sid, token: first })).status, 404);
  const preview = await w.call('join-preview', { name: 'Rural' }, { sid });
  assert.equal(preview.status, 'matched');
  assert.deepEqual(preview.association, associations[1]);
  assert.doesNotMatch(JSON.stringify(preview), /claimed|ballot|credentials|Creative/);
  assert.equal((await w.call('join-preview', { name: 'Youth' }, { sid })).association, null);
  for (const association of associations) {
    const image = await fetch(w.base + association.banner);
    assert.equal(image.status, 200); assert.equal(image.headers.get('content-type'), 'image/png');
    assert.deepEqual([...new Uint8Array(await image.arrayBuffer()).slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }
  assert.equal((await fetch(w.base + '/association-banners/7.png')).status, 404);
  for (const route of ['posts', 'corrections', 'responses', 'profile', 'viewer', 'flags']) {
    assert.equal((await w.call(route, { text: 'Cannot publish', stance: 'usernames', requestId: randomUUID() }, { sid, token: first })).status, 403);
  }
  assert.equal((await w.call('receipt?id=' + randomUUID(), undefined, { sid, token: first })).status, 403);
  for (const action of ['debate', 'exposure', 'forgery', 'reactions', 'reflection', 'reveal']) assert.equal((await w.action(sid, action)).status, 409);
  const { sid: other } = await w.session();
  assert.equal((await w.call('me', undefined, { sid: other, token: first })).status, 401);
  assert.equal((await w.state(other)).capacity, 7);
  const requestId = randomUUID();
  assert.equal((await w.action(sid, 'end', { requestId })).status, 200);
  assert.equal((await w.action(sid, 'end', { requestId })).status, 200);
  assert.equal((await w.call('join', { name: associations[3 - 1].name }, { sid, token: secret() })).status, 409);
  assert.equal((await w.call('me', undefined, { sid, token: first })).status, 200);
  const ended = await w.state(sid);
  assert.equal((await w.call('host/reset', { version: ended.version, confirmLabel: ended.label, expiresAt: Date.now() + 86400000 }, { sid, host: true })).status, 200);
  const reset = await w.state(sid);
  assert.equal(reset.workshopType, 'workshop-1'); assert.equal(reset.capacity, 6); assert.equal(reset.participants, 0);
  assert.equal((await w.call('me', undefined, { sid, token: first })).status, 401);
});

test('legacy sessions stay Workshop 2 and unsupported workshop selections fail', async t => {
  const w = await workshop(t); await w.login();
  const list = await w.call('host/sessions', undefined, { host: true });
  assert.deepEqual(list.workshops.map(w => w.id), ['workshop-2', 'workshop-1']);
  for (const workshopType of ['other', null, 1]) {
    assert.equal((await w.call('host/sessions', { id: randomUUID(), label: 'Invalid', kind: 'live', workshopType, expiresAt: Date.now() + 86400000 }, { host: true })).status, 400);
  }
  const { sid } = await w.session();
  await w.server.store.update(sid, state => { delete state.workshopType; });
  const legacy = await w.state(sid);
  assert.equal(legacy.workshopType, 'workshop-2'); assert.match(legacy.workshopTitle, /^Hacked:/);
  assert.equal(legacy.capacity, 7);
  await w.claim(sid);
  assert.equal((await w.action(sid, 'debate')).status, 200);
  const state = await w.state(sid);
  const reset = await w.call('host/reset', { version: state.version, confirmLabel: state.label, expiresAt: Date.now() + 86400000 }, { sid, host: true });
  assert.equal(reset.session.workshopType, 'workshop-2'); assert.equal(reset.session.capacity, 7);
});

test('Workshop 1 type and private team access survive a storage restart', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'workshop-one-'));
  try {
    const first = await workshop(t, { dataDir }); await first.login();
    const sid = await createRoom(first), token = secret();
    assert.equal((await first.call('join', { name: associations[6 - 1].name }, { sid, token })).status, 200);
    await first.stop();
    const second = await workshop(t, { dataDir });
    try {
      const room = await second.call('projector', undefined, { sid });
      assert.equal(room.workshopType, 'workshop-1'); assert.equal(room.participants, 1);
      assert.equal((await second.call('me', undefined, { sid, token })).association.card, 6);
      assert.deepEqual((await second.call('feed', undefined, { sid, token })).profiles, []);
    } finally { await second.stop(); }
  } finally { await rm(dataDir, { recursive: true, force: true }); }
});

test('organization matching accepts paper names and unique words without guessing ambiguous names', () => {
  for (const association of associations) {
    assert.equal(identifyAssociation(association.name).association.card, association.card);
    assert.equal(identifyAssociation(association.name.toUpperCase().replace('THE ', '').replace('&', 'and')).association.card, association.card);
  }
  assert.equal(identifyAssociation('creative and cult').association.card, 1);
  assert.equal(identifyAssociation('climate').association.card, 6);
  for (const name of ['Youth', 'The', 'and', 'cr', 'Creative unrelated', '']) assert.equal(identifyAssociation(name).association, null);
});
