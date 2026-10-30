import { associations } from '../workshop/types.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { workshop, secret } from './helpers.mjs';
import { hostVoting } from '../workshop/voting.mjs';

async function room(w) {
  await w.login();
  const result = await w.call('host/sessions', { id: randomUUID(), label: 'Weighted vote', kind: 'rehearsal', workshopType: 'workshop-1', expiresAt: Date.now() + 86400000 }, { host: true });
  assert.equal(result.status, 201); return result.session.id;
}
async function claim(w, sid, card) {
  const token = secret(); assert.equal((await w.call('join', { name: associations[card - 1].name }, { sid, token })).status, 200); return token;
}
async function cast(w, sid, token, choice, extra = {}) {
  const me = await w.call('me', undefined, { sid, token });
  return w.call('votes', { requestId: randomUUID(), votingId: me.voting.id, choice, ...extra }, { sid, token });
}

test('membership weights drive the host lead, blank participation stays separate and votes stay private', async t => {
  const w = await workshop(t), sid = await room(w);
  const tokens = [];
  for (let card = 1; card <= 6; card++) tokens.push(await claim(w, sid, card));
  assert.deepEqual((await w.state(sid)).voting.rows.map(row => row.mandate), [180, 240, 350, 210, 300, 160]);
  assert.equal((await cast(w, sid, tokens[0], 'for')).status, 409);
  assert.equal((await w.action(sid, 'activate-voting')).status, 200);
  assert.equal((await w.action(sid, 'activate-voting')).status, 409);
  assert.equal((await cast(w, sid, tokens[0], 'invalid')).status, 400);
  assert.equal((await cast(w, sid, tokens[0], 'for', { votingId: randomUUID() })).status, 409);
  assert.equal((await w.call('votes', {}, { sid })).status, 401);
  const choices = ['for', 'blank', 'against', 'blank', 'blank', 'for'];
  for (let i = 0; i < tokens.length; i++) {
    const result = await cast(w, sid, tokens[i], choices[i], { weight: 99999, card: 3 });
    assert.equal(result.status, 200);
    assert.equal(result.ballot.weight, [180, 240, 350, 210, 300, 160][i]);
  }
  const state = await w.state(sid);
  assert.deepEqual(state.voting.totals, { for: 340, against: 350, blank: 750 });
  assert.equal(state.voting.leader, 'against'); // One larger association outweighs two smaller ones.
  assert.equal(state.voting.totalMandate, 1440); assert.equal(state.voting.castMandate, 1440);
  assert.equal(state.voting.uncastMandate, 0); assert.equal(state.voting.votedOrganizations, 6);
  assert.deepEqual(state.voting.rows.map(row => row.choice), choices);
  const own = await w.call('me', undefined, { sid, token: tokens[0] });
  assert.equal(own.voting.ballot.choice, 'for'); assert.equal(own.voting.rows, undefined);
  for (const route of ['feed', 'projector']) {
    const view = await w.call(route, undefined, { sid, token: tokens[0] });
    assert.equal(view.voting, undefined); assert.doesNotMatch(JSON.stringify(view), /castAt|ballots|mandate|leader/);
  }
  const { sid: w2 } = await w.session(); const person = await w.claim(w2);
  assert.equal((await w.call('votes', { choice: 'for' }, { sid: w2, token: person.token })).status, 404);
});

test('exact-once ballots survive retries, concurrent sends, pause, close, reset and legacy rooms', async t => {
  const w = await workshop(t), sid = await room(w), token = await claim(w, sid, 1);
  await w.server.store.update(sid, state => { delete state.voting; });
  assert.equal((await w.state(sid)).voting.status, 'inactive');
  await w.action(sid, 'activate-voting');
  const active = await w.state(sid), requestId = randomUUID();
  await w.call('host/pause', { version: active.version, paused: true }, { sid, host: true });
  assert.equal((await cast(w, sid, token, 'for')).status, 409);
  const paused = await w.state(sid);
  await w.call('host/pause', { version: paused.version, paused: false }, { sid, host: true });
  const results = await Promise.all([cast(w, sid, token, 'for', { requestId }), cast(w, sid, token, 'for', { requestId })]);
  assert.deepEqual(results.map(result => result.status), [200, 200]);
  assert.equal((await w.state(sid)).voting.totals.for, 180);
  assert.equal((await cast(w, sid, token, 'against', { requestId })).status, 409);
  assert.equal((await cast(w, sid, token, 'for')).status, 409);
  const second = await claim(w, sid, 2);
  const competing = await Promise.all([cast(w, sid, second, 'against'), cast(w, sid, second, 'blank')]);
  assert.deepEqual(competing.map(result => result.status).sort(), [200, 409]);
  const late = await claim(w, sid, 3);
  assert.equal((await w.action(sid, 'close-voting')).status, 200);
  assert.equal((await cast(w, sid, late, 'for')).status, 409);
  assert.equal((await cast(w, sid, token, 'for', { requestId })).status, 200);
  assert.equal((await w.action(sid, 'activate-voting')).status, 409);
  await w.action(sid, 'end');
  assert.equal((await cast(w, sid, token, 'for', { requestId })).status, 200);
  const ended = await w.state(sid);
  await w.call('host/reset', { version: ended.version, confirmLabel: ended.label, expiresAt: Date.now() + 86400000 }, { sid, host: true });
  assert.equal((await w.state(sid)).voting.castMandate, 0);
  assert.equal((await w.state(sid)).voting.status, 'inactive');
  assert.equal((await w.call('me', undefined, { sid, token })).status, 401);
});

test('host shows no lead for blanks alone and an explicit tie for equal weighted sides', () => {
  const state = { roles: [1, 2, 3, 4, 5, 6].map(card => ({ id: String(card), card, claimed: true })), voting: { id: 'round', status: 'open', ballots: {} } };
  state.voting.ballots['2'] = { choice: 'blank', weight: 240 };
  assert.equal(hostVoting(state).leader, 'none'); assert.equal(hostVoting(state).castMandate, 240);
  // Sports + climate (350 + 160) equals gaming + students (210 + 300).
  state.voting.ballots['3'] = { choice: 'for', weight: 350 };
  state.voting.ballots['6'] = { choice: 'for', weight: 160 };
  state.voting.ballots['4'] = { choice: 'against', weight: 210 };
  state.voting.ballots['5'] = { choice: 'against', weight: 300 };
  assert.equal(hostVoting(state).leader, 'tie');
});

test('ballots and activation survive a database restart; ending closes voting', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'weighted-vote-'));
  try {
    const first = await workshop(t, { dataDir }), sid = await room(first), token = await claim(first, sid, 4);
    await first.action(sid, 'activate-voting');
    await cast(first, sid, token, 'blank');
    await first.call('host/action', await adjustment(first, sid, 4, 'vote-exclude'), { sid, host: true });
    await first.stop();
    const second = await workshop(t, { dataDir });
    try {
      await second.login();
      const restored = await second.state(sid);
      assert.equal(restored.voting.status, 'open'); assert.equal(restored.voting.totals.blank, 0); assert.equal(restored.voting.excludedMandate, 210); assert.equal(restored.voting.history.length, 1);
      assert.equal((await second.call('me', undefined, { sid, token })).voting.ballot.choice, 'blank');
      await second.action(sid, 'end');
      assert.equal((await second.state(sid)).voting.status, 'closed');
    } finally { await second.stop(); }
  } finally { await rm(dataDir, { recursive: true, force: true }); }
});

async function adjustment(w, sid, card, action, extra = {}) {
  const state = await w.state(sid), row = state.voting.rows.find(row => row.card === card);
  return { action, card, votingId: state.voting.id, ballotRequestId: row.ballotRequestId, requestId: randomUUID(), version: state.version, ...extra };
}
test('hosts can exclude, restore and delete ballots without stale retries reviving or changing them', async t => {
  const w = await workshop(t), sid = await room(w), first = await claim(w, sid, 1), sports = await claim(w, sid, 3), rural = await claim(w, sid, 2);
  await w.action(sid, 'activate-voting');
  const original = randomUUID();
  await cast(w, sid, first, 'for', { requestId: original }); await cast(w, sid, sports, 'against'); await cast(w, sid, rural, 'blank');
  const exclude = await adjustment(w, sid, 3, 'vote-exclude');
  assert.equal((await w.call('host/action', exclude, { sid, token: first })).status, 401);
  assert.equal((await w.call('votes', { ...exclude, choice: 'for' }, { sid, token: first })).status, 409);
  assert.equal((await w.call('host/action', exclude, { sid, host: true })).status, 200);
  assert.equal((await w.call('host/action', exclude, { sid, host: true })).status, 200);
  let state = await w.state(sid);
  assert.deepEqual(state.voting.totals, { for: 180, against: 0, blank: 240 });
  assert.equal(state.voting.leader, 'for'); assert.equal(state.voting.castMandate, 770); assert.equal(state.voting.countedMandate, 420);
  assert.equal(state.voting.excludedMandate, 350); assert.equal(state.voting.history.length, 1);
  assert.equal((await w.call('me', undefined, { sid, token: sports })).voting.ballot.counted, false);
  assert.equal((await w.call('me', undefined, { sid, token: first })).voting.history, undefined);
  assert.equal((await w.call('host/action', { ...exclude, card: 1 }, { sid, host: true })).status, 409);
  const count = await adjustment(w, sid, 3, 'vote-count');
  assert.equal((await w.call('host/action', count, { sid, host: true })).status, 200);
  assert.equal((await w.state(sid)).voting.leader, 'against');
  const remove = await adjustment(w, sid, 1, 'vote-delete');
  assert.equal((await w.call('host/action', { ...remove, version: remove.version - 1 }, { sid, host: true })).status, 409);
  assert.equal((await w.call('host/action', remove, { sid, host: true })).status, 200);
  const deleted = (await w.call('me', undefined, { sid, token: first })).voting;
  assert.equal(deleted.ballot, null); assert.equal(deleted.deleted, true);
  assert.deepEqual(deleted.deletedRequestIds, [original]);
  assert.equal((await cast(w, sid, first, 'for', { requestId: original })).status, 409);
  const replacement = await cast(w, sid, first, 'against'); assert.equal(replacement.status, 200);
  // Lost host responses may be retried after a new ballot without deleting it.
  assert.equal((await w.call('host/action', remove, { sid, host: true })).status, 200);
  state = await w.state(sid);
  assert.equal(state.voting.totals.against, 530); assert.equal(state.voting.history.length, 3);
  assert.equal((await w.call('host/action', { ...remove, requestId: randomUUID(), version: state.version }, { sid, host: true })).status, 409);
  const blankExclude = await adjustment(w, sid, 2, 'vote-exclude');
  await w.call('host/action', blankExclude, { sid, host: true });
  assert.equal((await w.state(sid)).voting.totals.blank, 0);
  await w.action(sid, 'close-voting'); await w.action(sid, 'end');
  assert.equal((await w.call('host/action', await adjustment(w, sid, 1, 'vote-delete'), { sid, host: true })).status, 200);
  assert.equal((await cast(w, sid, first, 'for')).status, 409);
  const exported = await w.call('host/export', undefined, { sid, host: true });
  assert.equal(exported.voting.history.length, 5);
  assert.equal(exported.voting.history[2].choice, 'for');
  const { sid: other } = await w.session();
  const legacy = await w.state(other);
  assert.equal((await w.call('host/action', { ...remove, version: legacy.version, requestId: randomUUID() }, { sid: other, host: true })).status, 409);
});
