import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { workshop, secret } from './helpers.mjs';
import { transportCards } from '../workshop/transport.mjs';

test('transport incident is atomic, private, differentiated, persistent and reversible', async t => {
  const w = await workshop(t); await w.login();
  // Omission selects the new scenario, including for normal host-created rooms.
  const created = await w.call('host/sessions', { id: randomUUID(), label: 'Transport', kind: 'rehearsal', expiresAt: Date.now() + 86400000 }, { host: true });
  const sid = created.session.id;
  assert.equal(created.session.scenario, 'transport-v1');
  const teams = []; for (let i = 0; i < 7; i++) teams.push(await w.claim(sid, i));
  for (const [i, team] of teams.entries()) {
    assert.equal(team.privateRole.proposal, transportCards[i].proposal);
    assert.equal(team.privateRole.effect, undefined); assert.equal(team.incident, null);
  }
  await w.action(sid, 'debate');
  assert.equal((await w.action(sid, 'incident')).status, 409);
  const originals = [];
  assert.ok((await w.state(sid)).roles.every(r => r.activity.posts === 0 && r.activity.injected === 0 && r.incidentState === 'pending'));
  for (const [i, team] of teams.entries()) {
    const body = { text: transportCards[i].suggestedPost, requestId: randomUUID() };
    const result = await w.call('posts', body, { sid, token: team.token });
    const retry = await w.call('posts', body, { sid, token: team.token });
    assert.equal(retry.post.id, result.post.id);
    assert.equal(result.status, 200); originals.push(result.post);
  }
  const initial = await w.call('feed', undefined, { sid });
  assert.equal(initial.posts.filter(p => p.stance === 'lower-fares').length, 5);
  assert.equal(initial.posts.filter(p => p.stance === 'keep-fares').length, 2);
  assert.ok(!JSON.stringify(initial).includes('effect'));
  assert.ok(initial.profiles.every(r => r.activity === undefined && r.postingAccess === undefined));
  assert.ok((await w.state(sid)).roles.every(r => r.activity.posts === 1 && r.activity.replies === 0));
  // Explicit positions sent by older clients remain supported and correctable.
  const mistaken = await w.call('posts', { text: 'Wrong stance selected', stance: 'keep-fares', requestId: randomUUID() }, { sid, token: teams[0].token });
  assert.equal((await w.action(sid, 'incident')).status, 409);
  await w.call('posts', { text: 'To clarify: I support half-price tickets.', stance: 'lower-fares', requestId: randomUUID() }, { sid, token: teams[0].token });
  const moderate = await w.state(sid);
  await w.call('host/moderate', { version: moderate.version, postId: mistaken.post.id }, { sid, host: true });
  const viewer = secret(); await w.call('viewer', { token: viewer }, { sid, token: teams[5].token });
  const preview = await w.state(sid);
  assert.equal(preview.targets.length, 7); assert.ok(preview.targets.every(t => t.ready));
  assert.equal(preview.targets[6].name, 'Mats Berg');
  const payload = { action: 'incident', version: preview.version, requestId: randomUUID() };
  const launches = await Promise.all([1, 2, 3].map(() => w.call('host/action', payload, { sid, host: true })));
  launches.forEach(r => { assert.equal(r.status, 200); assert.equal(r.count, 9); });
  assert.equal(new Set(launches.map(r => r.waveId)).size, 1);
  assert.equal((await w.action(sid, 'incident')).status, 409);
  const hostIncident = await w.state(sid);
  assert.deepEqual(hostIncident.roles.map(r => r.activity.injected), [0, 0, 3, 0, 2, 0, 4]);
  assert.equal(hostIncident.roles[0].postingAccess, 'locked');
  assert.equal(hostIncident.roles[2].activity.posts, 1);
  assert.equal(hostIncident.roles[5].activity.hidden, 1);
  assert.ok(hostIncident.roles.every(r => r.incidentState === 'active'));
  const notices = [];
  for (const team of teams) notices.push(await w.call('me', undefined, { sid, token: team.token }));
  assert.equal(notices[0].canWrite, false);
  for (const route of ['posts', 'profile', 'flags', 'viewer']) assert.equal((await w.call(route, { requestId: randomUUID(), text: 'Locked attempt', stance: 'lower-fares' }, { sid, token: teams[0].token })).status, 403);
  assert.equal(notices[1].incident.animation, true); assert.equal(notices[3].incident.animation, true);
  assert.equal(notices[2].incident.title, 'Account hacked — someone is posting as you');
  assert.equal(notices[4].canWrite, true);
  assert.match(notices[5].incident.message, /your screen/);
  assert.equal((await w.call('me', undefined, { sid, token: viewer })).incident, undefined);
  for (const i of [0, 1, 2, 3, 4, 6]) {
    const f = await w.call('feed', undefined, { sid, token: teams[i].token });
    for (const n of [0, 2, 5, 6]) assert.ok(!f.posts.some(p => p.id === originals[n].id));
    for (const n of [1, 3, 4]) assert.ok(f.posts.some(p => p.id === originals[n].id));
    assert.ok(f.posts.some(p => p.text.includes('Linnea Sjöberg')));
    assert.ok(f.posts.every(p => p.provenance === undefined));
    // Four distinct accounts now appear opposed; two are forged.
    assert.equal(new Set(f.posts.filter(p => p.stance === 'keep-fares').map(p => p.author.id)).size, 4);
    const profile = await w.call('profile?id=' + teams[5].participant.id, undefined, { sid, token: teams[i].token });
    assert.equal(profile.postCount, 0);
  }
  const own = await w.call('feed', undefined, { sid, token: teams[5].token });
  assert.ok(own.posts.some(p => p.id === originals[5].id));
  assert.ok((await w.call('feed', undefined, { sid, token: viewer })).posts.some(p => p.id === originals[5].id));
  const suppressed = await w.call('posts', { text: 'Can anyone hear this?', stance: 'lower-fares', requestId: randomUUID() }, { sid, token: teams[5].token });
  assert.equal(suppressed.status, 200);
  assert.ok(!(await w.call('feed', undefined, { sid, token: teams[1].token })).posts.some(p => p.id === suppressed.post.id));
  assert.equal((await w.call('posts', { text: 'Reply to hidden', replyTo: suppressed.post.id, requestId: randomUUID() }, { sid, token: teams[1].token })).status, 400);
  const fake = own.posts.find(p => p.author.id === teams[2].participant.id);
  assert.equal((await w.call('flags', { postId: fake.id }, { sid, token: teams[2].token })).status, 200);
  const stored = await w.server.store.read(sid);
  assert.equal(stored.posts.filter(p => p.origin === 'simulation').length, 9);
  assert.equal(stored.posts.filter(p => p.incidentHidden).length, 5);
  assert.equal((await w.call('me', undefined, { sid, token: teams[1].token })).incident.id, notices[1].incident.id);
  await w.action(sid, 'reflection'); await w.action(sid, 'reveal');
  const restored = await w.call('feed', undefined, { sid, token: teams[1].token });
  originals.forEach(original => assert.equal(restored.posts.find(p => p.id === original.id).text, original.text));
  assert.equal(restored.posts.filter(p => p.provenance === 'simulation').length, 9);
  assert.equal(restored.posts.find(p => p.id === mistaken.post.id).hidden, true); // Reveal does not undo host moderation.
  assert.ok(restored.posts.some(p => p.id === suppressed.post.id));
  assert.equal((await w.call('me', undefined, { sid, token: teams[0].token })).canWrite, true);
  assert.match((await w.call('me', undefined, { sid, token: teams[5].token })).incident.message, /Everyone can see your contributions again/);
  assert.match((await w.call('me', undefined, { sid, token: teams[1].token })).incident.message, /account access are unchanged/);
  const hostRestored = await w.state(sid);
  assert.ok(hostRestored.roles.every(r => r.incidentState === 'restored' && r.postingAccess === 'open'));
  assert.equal(hostRestored.roles[5].activity.hidden, 0);
  assert.equal(hostRestored.roles[0].activity.hidden, 1);
  assert.equal((await w.call('corrections', { text: 'My original view still stands.', stance: 'lower-fares', requestId: randomUUID() }, { sid, token: teams[0].token })).status, 200);
  await w.call('posts', { text: 'A genuine reply after reveal.', replyTo: originals[1].id, requestId: randomUUID() }, { sid, token: teams[2].token });
  const replied = await w.state(sid);
  assert.equal(replied.roles[2].activity.posts, 1);
  assert.equal(replied.roles[2].activity.replies, 1);
  assert.equal(replied.roles[2].activity.injected, 3);
  assert.equal((await w.call('host/reset', { version: replied.version, confirmLabel: replied.label, expiresAt: Date.now() + 86400000 }, { sid, host: true })).status, 200);
  assert.ok((await w.state(sid)).roles.every(r => !r.claimed && r.activity.posts === 0 && r.activity.replies === 0 && r.activity.injected === 0 && r.incidentState === 'pending'));

});


test('an unopened legacy room can adopt transport without losing its profile or credentials', async t => {
  const w = await workshop(t); await w.login();
  const { sid } = await w.session(); const team = await w.claim(sid);
  const before = await w.state(sid);
  const body = { version: before.version, confirmLabel: before.label };
  assert.equal((await w.call('host/transport-topic', body, { sid })).status, 401);
  assert.equal((await w.call('host/transport-topic', { ...body, confirmLabel: 'wrong' }, { sid, host: true })).status, 409);
  assert.equal((await w.call('host/transport-topic', body, { sid, host: true })).status, 200);
  const current = await w.call('me', undefined, { sid, token: team.token });
  assert.equal(current.participant.id, team.participant.id);
  assert.equal(current.privateRole.proposal, transportCards[0].proposal);
  await w.action(sid, 'debate');
  const state = await w.state(sid);
  assert.equal((await w.call('host/transport-topic', { version: state.version, confirmLabel: state.label }, { sid, host: true })).status, 409);
});
