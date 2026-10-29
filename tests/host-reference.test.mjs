import test from 'node:test';
import assert from 'node:assert/strict';
import { workshop } from './helpers.mjs';
import { transportCards } from '../workshop/transport.mjs';

test('host reference includes all seven current paper cards without exposing them in public views', async t => {
  const w = await workshop(t); await w.login(); const { sid } = await w.session('rehearsal', 'transport-v1');
  assert.equal((await w.call('host/state', undefined, { sid })).status, 401);
  const host = await w.state(sid);
  assert.equal(host.roles.length, 7);
  for (const [i, role] of host.roles.entries()) {
    assert.equal(role.reference.fullName, transportCards[i].fullName);
    assert.equal(role.reference.backstory, transportCards[i].backstory);
    assert.equal(role.reference.proposal, transportCards[i].proposal);
    assert.equal(role.reference.portrait, `/portraits/${i + 1}.png`);
    assert.equal(role.reference.guidance, transportCards[i].question);
    assert.equal(role.claimed, false);
  }
  const a = await w.claim(sid, 0); await w.claim(sid, 4);
  for (const route of ['feed', 'projector', 'profile?id=' + a.participant.id]) {
    const result = await w.call(route, undefined, { sid, token: a.token });
    const json = JSON.stringify(result);
    assert.ok(!json.includes('"reference"'));
    assert.ok(!json.includes(transportCards[4].backstory));
  }
  const updated = await w.call('profile', { bio: 'My chosen public bio', color: 5, cover: 3 }, { sid, token: a.token });
  assert.equal(updated.status, 200);
  const role = (await w.state(sid)).roles[0];
  assert.equal(role.bio, 'My chosen public bio'); assert.equal(role.avatar, '/avatars/5.svg'); assert.equal(role.cover, 3);
  assert.equal(role.reference.suggestedBio, transportCards[0].suggestedBio);
});
