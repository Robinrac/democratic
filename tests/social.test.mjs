import { profileStats } from '../dist/forum-activity.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { workshop, secret, paperProfile } from './helpers.mjs';
import { socialText } from '../workshop/social.mjs';
import { transportCards } from '../workshop/transport.mjs';

test('mention and hashtag parsing uses complete public handles and unique case-folded topics', () => {
  const roles = [{ id: 'a', username: 'quiet-cedar', claimed: true }, { id: 'b', username: 'bright-river', claimed: false }];
  assert.deepEqual(socialText('Hello @QUIET-CEDAR, @quiet-cedar! #FareCap #farecap #Öppet', roles), { mentions: ['a'], hashtags: ['farecap', 'öppet'] });
  assert.deepEqual(socialText('mail@quiet-cedar é@quiet-cedar @quiet-cedar-extra @bright-river #'+ 'a'.repeat(33), roles), { mentions: [], hashtags: [] });
});

test('unknown and partial names fail clearly, and profile release revokes only that team before the incident', async t => {
  const w = await workshop(t); await w.login(); const { sid } = await w.session('rehearsal', 'transport-v1');
  for (const name of ['Not on the list', 'Mats B', 'Mats Solheim']) {
    const preview = await w.call('join-preview', { name }, { sid }); assert.equal(preview.username, null); assert.match(preview.error, /Name not recognised/);
    const result = await w.call('join', { ...paperProfile(6), name }, { sid, token: secret() }); assert.equal(result.status, 400); assert.match(result.error, /Name not recognised/);
  }
  const a = await w.claim(sid, 0), b = await w.claim(sid, 1);
  assert.equal((await w.call('join-preview', { name: 'Eydis' }, { sid })).claimed, true);
  await w.action(sid, 'debate');
  const top = await w.call('posts', { text: 'First #AffordableJourneys', stance: 'lower-fares', requestId: randomUUID() }, { sid, token: a.token });
  await w.call('posts', { text: 'Question @lava-lundi', replyTo: top.post.id, requestId: randomUUID() }, { sid, token: b.token });
  await w.call('posts', { text: 'Independent #ServiceFirst', stance: 'keep-fares', requestId: randomUUID() }, { sid, token: b.token });
  const before = await w.state(sid), body = { roleId: a.participant.id, confirmName: a.privateDetails.name, version: before.version };
  assert.equal((await w.call('host/clear-profile', body, { sid, token: b.token })).status, 401);
  assert.equal((await w.call('host/clear-profile', { ...body, confirmName: 'wrong' }, { sid, host: true })).status, 400);
  assert.equal((await w.call('host/clear-profile', body, { sid, host: true })).removedPosts, 2);
  assert.equal((await w.call('me', undefined, { sid, token: a.token })).status, 401);
  assert.equal((await w.call('me', undefined, { sid, token: b.token })).status, 200);
  const replacement = await w.claim(sid, 0); assert.equal(replacement.participant.id, a.participant.id);
  assert.equal((await w.call('feed', undefined, { sid, token: replacement.token })).posts.length, 1);
});

test('personal activity and hashtag ranks respect incident visibility, and a full reset clears every incident field', async t => {
  const w = await workshop(t); await w.login(); const { sid } = await w.session('rehearsal', 'transport-v1');
  const teams = []; for (let i = 0; i < 7; i++) teams.push(await w.claim(sid, i));
  let feed = await w.call('feed', undefined, { sid, token: teams[1].token });
  assert.equal(feed.trending[0].label, 'AffordableJourneys'); assert.ok(feed.trending.every(tag => tag.count === 0));
  assert.ok(feed.trending.some(tag => tag.label === 'ExpensiveRides'));
  await w.action(sid, 'debate');
  const original = [];
  for (const [i, card] of transportCards.entries()) {
    const post = await w.call('posts', { text: card.suggestedPost + ' @drangarnir #AffordableJourneys #AffordableJourneys', stance: card.leaning, requestId: randomUUID(), mentions: [teams[3].participant.id], hashtags: ['fake'] }, { sid, token: teams[i].token });
    assert.equal(post.status, 200); original.push(post.post);
    assert.deepEqual(post.post.mentions, [teams[1].participant.id]); assert.ok(!post.post.hashtags.includes('fake'));
  }
  feed = await w.call('feed', undefined, { sid, token: teams[1].token });
  assert.equal(feed.trending[0].tag, 'affordablejourneys'); assert.equal(feed.trending[0].count, 7);
  assert.equal(feed.activity.length, 7); assert.equal(feed.activity.filter(a => a.type === 'published').length, 1);
  await w.action(sid, 'incident');
  const after = await w.call('feed', undefined, { sid, token: teams[1].token });
  for (const i of [0, 2, 5, 6]) assert.ok(!after.activity.some(a => a.id === original[i].id));
  assert.equal(after.trending[0].tag, 'servicefirst');
  const forged = await w.call('feed', undefined, { sid, token: teams[2].token });
  assert.equal(forged.activity.filter(a => a.type === 'account-post').length, 4);
  const suppressed = await w.call('posts', { text: '@drangarnir Can you see me? #HiddenTopic', stance: 'lower-fares', requestId: randomUUID() }, { sid, token: teams[5].token });
  const target = await w.call('feed', undefined, { sid, token: teams[1].token });
  assert.ok(!target.activity.some(a => a.id === suppressed.post.id)); assert.ok(!target.trending.some(tag => tag.tag === 'hiddentopic'));
  const own = await w.call('feed', undefined, { sid, token: teams[5].token }); assert.ok(own.activity.some(a => a.id === suppressed.post.id));
  let state = await w.state(sid);
  assert.equal((await w.call('host/clear-profile', { version: state.version, roleId: teams[0].participant.id, confirmName: teams[0].privateDetails.name }, { sid, host: true })).status, 409);
  await w.action(sid, 'reflection'); await w.action(sid, 'reveal');
  assert.ok((await w.call('feed', undefined, { sid, token: teams[1].token })).activity.some(a => a.id === suppressed.post.id));
  state = await w.state(sid);
  assert.equal((await w.call('host/reset', { version: state.version, confirmLabel: state.label, expiresAt: Date.now() + 86400000 }, { sid, host: true })).status, 200);
  const raw = await w.server.store.read(sid);
  assert.equal(raw.incidentId, undefined); assert.equal(raw.posts.length, 0); assert.equal(raw.credentials.length, 0); assert.deepEqual(raw.events, {});
  for (const team of teams) assert.equal((await w.call('me', undefined, { sid, token: team.token })).status, 401);
  const fresh = await w.claim(sid, 0); assert.equal(fresh.canWrite, true); assert.equal(fresh.incident, null);
  assert.equal((await w.call('feed', undefined, { sid, token: fresh.token })).activity.length, 0);
});


test('profile stats count visible posts, replies and mentions without leaking hidden content', () => {
  const profiles = [{ id: 'me', username: 'my-profile' }, { id: 'a', username: 'alpha' }, { id: 'b', username: 'beta' }];
  const stats = profileStats([
    { author: { id: 'me' }, hashtags: ['buses', 'buses', 'free'], mentions: ['a', 'a', 'me'] },
    { author: { id: 'me' }, replyTo: 'first', hashtags: ['buses'], mentions: ['a', 'b', 'removed'] },
    { author: { id: 'me' }, hidden: true, hashtags: ['secret'], mentions: ['b'] },
    { author: { id: 'a' }, mentions: ['me', 'me'] },
    { author: { id: 'b' }, hidden: true, mentions: ['me'] },
    { author: { id: 'me' }, text: 'A visible simulated post' }
  ], 'me', profiles);
  assert.equal(stats.posts, 2); assert.equal(stats.replies, 1); assert.equal(stats.mentions, 1);
  assert.deepEqual(stats.hashtags, [{ id: 'buses', label: 'buses', count: 2 }, { id: 'free', label: 'free', count: 1 }]);
  assert.deepEqual(stats.tagged, [{ id: 'a', label: 'alpha', count: 2 }, { id: 'b', label: 'beta', count: 1 }]);
  assert.deepEqual(profileStats([], 'me', profiles), { posts: 0, replies: 0, mentions: 0, hashtags: [], tagged: [] });
});
