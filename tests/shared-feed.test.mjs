import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, realpath } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { workshop, secret } from './helpers.mjs';
import { roleCards } from '../workshop/roles.mjs';

function privateFree(value) {
  const json = JSON.stringify(value);
  for (const role of roleCards) { assert.ok(!json.includes(role.fullName)); assert.ok(!json.includes(role.town)); assert.ok(!json.includes(role.portraitFile)); }
  for (const key of ['codeHash','credentials','actualActor','provenance','suggestedPost','backstory']) assert.ok(!json.includes('"' + key + '"'), key);
}
test('seven one-use claims, isolated private cards, safe public projections, observers and viewers', async t => {
  const w = await workshop(t); await w.login(); const {sid,codes} = await w.session();
  const claims = [];
  for (const code of codes) claims.push(await w.claim(sid, code.code));
  assert.equal(new Set(claims.map(c => c.participant.id)).size, 7);
  assert.equal(new Set(claims.map(c => c.participant.handle)).size, 7);
  assert.equal(claims[0].privateRole.fullName, roleCards[0].fullName);
  assert.equal((await w.call('join', {code:codes[0].code},{sid,token:secret()})).status,403);
  assert.equal((await w.call('join', {code:'guessed'},{sid,token:secret()})).status,403);
  assert.equal((await w.call('join', {code:codes[0].code},{sid,token:claims[0].token})).participant.id, claims[0].participant.id);
  privateFree(await w.call('feed',undefined,{sid}));
  for(const c of claims) privateFree(await w.call('profile?id='+c.participant.id,undefined,{sid}));
  const viewer = secret(); await w.call('viewer',{token:viewer},{sid,token:claims[0].token});
  assert.equal((await w.call('viewer',{token:claims[0].token},{sid,token:claims[0].token})).status,409);
  const view = await w.call('me',undefined,{sid,token:viewer}); assert.equal(view.scope,'viewer'); assert.equal(view.privateRole,undefined); privateFree(view);
  for(const route of ['posts','profile','flags','viewer']) assert.equal((await w.call(route,{}, {sid,token:viewer})).status,403);
  assert.equal((await w.call('posts',{}, {sid})).status,401);
  assert.equal((await w.call('feed',undefined,{sid})).participants,7);
  const other = await w.session('live');
  assert.equal((await w.call('me',undefined,{sid:other.sid,token:claims[0].token})).status,401);
  const racedClaims = await Promise.all([secret(),secret()].map(token => w.call('join',{code:other.codes[0].code},{sid:other.sid,token})));
  assert.deepEqual(racedClaims.map(r=>r.status).sort(),[200,403]);
  assert.equal((await w.call('feed',undefined,{sid:other.sid})).participants,1);
  for(const route of ['/docs/workshop-2-role-cards.md','/workshop/roles.mjs','/assets/role-portraits/'+roleCards[0].portraitFile,'/participant.js','/phone-preview.html']) assert.equal((await fetch(w.base+route)).status,404);
  const portrait = await fetch(w.base+'/portraits/1.png'); assert.equal(portrait.status,200); assert.equal(portrait.headers.get('content-type'),'image/png');
});

test('seven-team debate → 7 disclosures → 14 forgeries → 21 reactions → reflection → reveal → corrections', async t => {
  const w = await workshop(t); await w.login(); const {sid,codes} = await w.session();
  const teams = []; for(const c of codes) teams.push(await w.claim(sid,c.code));
  assert.equal((await w.action(sid,'debate')).status,200);
  for(const [i,team] of teams.entries()) {
    const stance = i % 2 === 0 ? 'real-names':'usernames'; // Deliberately opposite the assigned leaning.
    const r = await w.call('posts',{text:'Our genuine reason '+i,stance,requestId:randomUUID(),authorId:teams[(i+1)%7].participant.id},{sid,token:team.token});
    assert.equal(r.post.author.id,team.participant.id);
  }
  privateFree(await w.call('feed',undefined,{sid}));
  const initial = await w.server.store.read(sid), roles = initial.roles.map(r=>r.id), accounts = initial.accounts.map(r=>r.id);
  assert.equal(accounts.length,3);
  const preview = await w.state(sid);
  assert.equal(preview.actions.find(a=>a.id==='exposure').count,7);
  const releaseBody = {action:'exposure',version:preview.version,requestId:randomUUID()};
  const simultaneous = await Promise.all(Array.from({length:5},()=>w.call('host/action',releaseBody,{sid,host:true})));
  simultaneous.forEach(r=>{assert.equal(r.status,200);assert.equal(r.count,7);});
  assert.equal((await w.action(sid,'exposure')).status,409);
  assert.equal((await w.action(sid,'reactions')).status,409);
  let s = await w.state(sid);
  await w.call('host/pause',{version:s.version,paused:true},{sid,host:true});
  assert.equal((await w.action(sid,'forgery')).status,409);
  s = await w.state(sid); await w.call('host/pause',{version:s.version,paused:false},{sid,host:true});
  assert.equal((await w.action(sid,'forgery')).count,14);
  assert.equal((await w.action(sid,'reactions')).count,21);
  let f = await w.call('feed',undefined,{sid});
  assert.equal(f.posts.length,49); assert.equal(f.threads.length,7); assert.equal(f.profiles.length,7);
  f.threads.forEach((thread,i)=>{assert.equal(thread.posts.length,7); assert.match(thread.posts[2].text, new RegExp(i%2===0?'allow public usernames':'require public real names'));});
  f.posts.forEach(p=>{assert.equal(p.provenance,undefined);assert.equal(p.actualActor,undefined);});
  assert.equal(f.notice,null);
  const forged = f.threads[0].posts[2];
  assert.equal((await w.call('flags',{postId:forged.id},{sid,token:teams[1].token})).status,403);
  for(let i=0;i<2;i++) assert.equal((await w.call('flags',{postId:forged.id},{sid,token:teams[0].token})).status,200);
  assert.equal((await w.server.store.read(sid)).flags.length,1);
  assert.equal((await w.action(sid,'reveal')).status,409);
  assert.equal((await w.call('corrections',{text:'Correction',stance:'real-names',requestId:randomUUID()},{sid,token:teams[0].token})).status,409);
  assert.equal((await w.action(sid,'reflection')).count,0);
  const revealState = await w.state(sid), revealBody = {action:'reveal',version:revealState.version,requestId:randomUUID()};
  for(let i=0;i<2;i++) assert.equal((await w.call('host/action',revealBody,{sid,host:true})).count,0);
  f = await w.call('feed',undefined,{sid});
  assert.equal(f.posts.filter(p=>p.provenance==='team').length,7);
  assert.equal(f.posts.filter(p=>p.provenance==='simulation').length,21);
  assert.equal(f.posts.filter(p=>p.provenance==='scripted').length,21);
  assert.match(f.notice,/workshop host/); assert.equal(f.posts.find(p=>p.id===forged.id).disputed,true);
  const correction = await w.call('corrections',{text:'Those recent posts were not ours. Here is our view.',stance:'real-names',requestId:randomUUID()},{sid,token:teams[0].token}); assert.equal(correction.post.correction,true);
  assert.equal((await w.call('responses',{choice:'protect-privacy'},{sid,token:teams[0].token})).status,200);
  assert.equal((await w.call('feed',undefined,{sid,token:teams[1].token})).posts.length,50);
  const final = await w.server.store.read(sid); assert.deepEqual(final.roles.map(r=>r.id),roles); assert.deepEqual(final.accounts.map(r=>r.id),accounts);
  for(const action of ['discussion','closing','end']) assert.equal((await w.action(sid,action)).status,200);
  assert.equal((await w.call('posts',{text:'After end',stance:'usernames',requestId:randomUUID()},{sid,token:teams[0].token})).status,409);
  assert.equal((await w.call('profile',{bio:'After end'},{sid,token:teams[0].token})).status,409);
  assert.equal((await w.call('feed',undefined,{sid})).phase,'ended');
});

test('no-post fallback is explicit, targets freeze, late codes become observer-only and stale previews fail', async t=>{
  const w=await workshop(t); await w.login(); const {sid,codes}=await w.session();
  const a=await w.claim(sid,codes[0].code), b=await w.claim(sid,codes[1].code); await w.action(sid,'debate');
  assert.equal((await w.action(sid,'exposure')).status,409);
  assert.equal((await w.state(sid,[b.participant.id])).actions.find(a=>a.id==='exposure').count,1);
  const stale=await w.state(sid);
  await w.call('posts',{text:'We choose usernames.',stance:'usernames',requestId:randomUUID()},{sid,token:a.token});
  assert.equal((await w.action(sid,'exposure',{version:stale.version})).status,409);
  assert.equal((await w.action(sid,'exposure',{includeFallback:[b.participant.id]})).count,2);
  assert.equal((await w.call('join',{code:codes[2].code},{sid,token:secret()})).status,409);
  await w.call('posts',{text:'A later first post must not change frozen stance.',stance:'usernames',requestId:randomUUID()},{sid,token:b.token});
  assert.equal((await w.action(sid,'forgery')).count,4);
  assert.equal((await w.action(sid,'reactions')).count,6);
  const raw=await w.server.store.read(sid); assert.equal(raw.targets.length,2); assert.equal(raw.targets[1].stance,'real-names');
  assert.match(raw.targets[1].source,/explicit/); assert.equal(raw.roles.filter(r=>r.claimed).length,2);
});

test('posts, replies and profile edits enforce ownership, text limits, origins and exact-once retries', async t=>{
  const w=await workshop(t); await w.login(); const {sid,codes}=await w.session(); const a=await w.claim(sid,codes[0].code), b=await w.claim(sid,codes[1].code);
  await w.action(sid,'debate');
  const payload={text:'A first reason.',stance:'usernames',requestId:randomUUID()};
  const posts=await Promise.all([w.call('posts',payload,{sid,token:a.token}),w.call('posts',payload,{sid,token:a.token})]); assert.equal(posts[0].post.id,posts[1].post.id);
  await w.call('posts',payload,{sid,token:b.token});
  const reply=await w.call('posts',{text:'A thoughtful reply.',replyTo:posts[0].post.id,requestId:randomUUID()},{sid,token:b.token}); assert.equal(reply.post.threadId,a.participant.id);
  const edited=await w.call('profile',{id:b.participant.id,bio:'Listening with curiosity.',cover:6,fullName:'Fake override'},{sid,token:a.token}); assert.equal(edited.participant.id,a.participant.id);
  assert.equal((await w.call('me',undefined,{sid,token:b.token})).participant.bio,'');
  for(const bad of ['', 'x'.repeat(501), '<img src=x onerror=alert(1)>', null]) assert.equal((await w.call('posts',{...payload,requestId:randomUUID(),text:bad},{sid,token:a.token})).status,400);
  assert.equal((await w.call('profile',{bio:'x'.repeat(161)},{sid,token:a.token})).status,400);
  assert.equal((await w.call('profile',{bio:'Safe',cover:7},{sid,token:a.token})).status,400);
  assert.equal((await w.call('posts',payload,{sid,token:a.token,origin:'https://unrelated.example'})).status,403);
  assert.equal((await w.call('posts',{...payload,requestId:randomUUID(),replyTo:'missing'},{sid,token:a.token})).status,400);
  assert.equal((await w.call('feed',undefined,{sid})).posts.length,3);
});

test('a real database failure rolls back the entire release, then the same request can safely retry', async t=>{
  const w=await workshop(t); await w.login(); const {sid,codes}=await w.session(); const a=await w.claim(sid,codes[0].code); await w.action(sid,'debate');
  await w.call('posts',{text:'A reason.',stance:'usernames',requestId:randomUUID()},{sid,token:a.token});
  const s=await w.state(sid), body={action:'exposure',version:s.version,requestId:randomUUID()};
  await w.server.store.transaction(async db=>{
    await db.query("CREATE FUNCTION reject_wave() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.state->>'phase' = 'exposure' THEN RAISE EXCEPTION 'injected storage failure'; END IF; RETURN NEW; END $$");
    await db.query('CREATE TRIGGER reject_wave BEFORE UPDATE ON open_circle_sessions FOR EACH ROW EXECUTE FUNCTION reject_wave()');
  });
  const failed=await w.call('host/action',body,{sid,host:true}); assert.equal(failed.status,503); assert.match(failed.error,/retry/);
  assert.equal((await w.state(sid)).phase,'debate'); assert.equal((await w.call('feed',undefined,{sid})).posts.length,1);
  await w.server.store.transaction(db=>db.query('DROP TRIGGER reject_wave ON open_circle_sessions'));
  assert.equal((await w.call('host/action',body,{sid,host:true})).count,1);
  assert.equal((await w.call('host/action',body,{sid,host:true})).count,1);
  assert.equal((await w.call('feed',undefined,{sid})).posts.length,2);
});

test('disk restart restores tokens, phase, waves and flags; logout revocation also survives restart', async t=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'open-circle-restart-'));
  const first=await workshop(t,{dataDir:dir}); await first.login(); const cookie=first.cookie;
  const {sid,codes}=await first.session(); const a=await first.claim(sid,codes[0].code); await first.action(sid,'debate');
  await first.call('posts',{text:'Persist this opinion.',stance:'usernames',requestId:randomUUID()},{sid,token:a.token});
  const s=await first.state(sid), body={action:'exposure',version:s.version,requestId:randomUUID()}; await first.call('host/action',body,{sid,host:true});
  const f=await first.call('feed',undefined,{sid}); await first.call('flags',{postId:f.posts[1].id},{sid,token:a.token});
  await first.stop();
  const next=await workshop(t,{dataDir:dir}); next.cookie=cookie;
  assert.equal((await next.call('me',undefined,{sid,token:a.token})).participant.id,a.participant.id);
  assert.equal((await next.state(sid)).phase,'exposure'); assert.equal((await next.call('feed',undefined,{sid})).posts[1].disputed,true);
  assert.equal((await next.call('host/action',body,{sid,host:true})).count,1); assert.equal((await next.call('feed',undefined,{sid})).posts.length,2);
  await next.call('host/logout',{}, {host:true}); await next.stop();
  const third=await workshop(t,{dataDir:dir}); third.cookie=cookie; assert.equal((await third.call('host/session',undefined,{host:true})).status,401);
  await third.stop();
  const resolved = await realpath(dir);
  assert.equal(resolved, path.resolve(dir));
  assert.ok(path.basename(resolved).startsWith('open-circle-restart-'));
  assert.equal(path.dirname(resolved), await realpath(os.tmpdir()));
  await rm(resolved,{recursive:true});
});

test('moderation, rehearsal reset, live protection, code expiry and session deletion are isolated', async t=>{
  const w=await workshop(t); await w.login(); const rehearsal=await w.session(), live=await w.session('live');
  const a=await w.claim(rehearsal.sid,rehearsal.codes[0].code), b=await w.claim(live.sid,live.codes[0].code);
  await w.action(rehearsal.sid,'debate'); const p=await w.call('posts',{text:'Please hide this.',stance:'usernames',requestId:randomUUID()},{sid:rehearsal.sid,token:a.token});
  let s=await w.state(rehearsal.sid); assert.equal((await w.call('host/moderate',{version:s.version,postId:p.post.id},{sid:rehearsal.sid,host:true})).status,200);
  assert.equal((await w.call('feed',undefined,{sid:rehearsal.sid})).posts[0].text,'[Hidden by the host]');
  s=await w.state(live.sid); assert.equal((await w.call('host/reset',{version:s.version,confirmLabel:s.label,expiresAt:Date.now()+86400000},{sid:live.sid,host:true})).status,403);
  s=await w.state(rehearsal.sid); const reset=await w.call('host/reset',{version:s.version,confirmLabel:s.label,expiresAt:Date.now()+86400000},{sid:rehearsal.sid,host:true}); assert.equal(reset.codes.length,7);
  assert.equal((await w.call('me',undefined,{sid:rehearsal.sid,token:a.token})).status,401); assert.equal((await w.call('me',undefined,{sid:live.sid,token:b.token})).status,200);
  assert.equal((await w.call('feed',undefined,{sid:rehearsal.sid})).posts.length,0);
  await w.server.store.transaction(db=>db.query('UPDATE open_circle_sessions SET expires_at=$2 WHERE id=$1',[rehearsal.sid,Date.now()-1]));
  assert.equal((await w.call('join',{code:reset.codes[0].code},{sid:rehearsal.sid,token:secret()})).status,410);
  await w.call('host/delete',{confirmLabel:live.session.label},{sid:live.sid,host:true}); assert.equal((await w.call('feed',undefined,{sid:live.sid})).status,410);
});
