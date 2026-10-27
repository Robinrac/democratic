import test from 'node:test';
import assert from 'node:assert/strict';
import { workshop, password } from './helpers.mjs';
import { openStore } from '../storage/store.mjs';
import { createWorkshopServer } from '../server.mjs';
import { fileURLToPath } from 'node:url';

test('host page, code, previews and all mutations are gated; projector always uses a public projection', async t=>{
  const w=await workshop(t);
  for(const route of ['/host','/?host=1','/index.html?host=1']) assert.match(await (await fetch(w.base+route,{headers:{Cookie:'nyc_host=forged'}})).text(),/host-login-form/);
  assert.equal((await fetch(w.base+'/host.js')).status,401);
  for(const route of ['session','sessions','state','export']) assert.equal((await w.call('host/'+route)).status,401);
  for(const route of ['action','pause','codes','moderate','reset','delete','sessions']) assert.equal((await w.call('host/'+route,{})).status,401);
  await w.login(); const {sid,codes}=await w.session(); await w.claim(sid,codes[0].code);
  const projector=await w.call('projector',undefined,{sid,host:true});
  for(const key of ['roles','actions','targets','posts','events','codes','credentials']) assert.equal(projector[key],undefined);
  const json=JSON.stringify(projector); assert.doesNotMatch(json,/Eydís|Jónsdóttir|Launch simulated|forged posts/);
  const hostPage=await (await fetch(w.base+'/host',{headers:{Cookie:w.cookie}})).text(); assert.match(hostPage,/PRIVATE HOST/);
  const projected=await (await fetch(w.base+'/?presenter=1&s='+sid,{headers:{Cookie:w.cookie}})).text(); assert.doesNotMatch(projected,/host.js|host-login-form|Launch simulated/);
  assert.equal((await w.call('host/logout',{}, {host:true})).status,200);
  assert.equal((await w.call('host/session',undefined,{host:true})).status,401);
});

test('host cookies are HttpOnly and SameSite, unrelated origins and password guessing fail safely',async t=>{
  const w=await workshop(t);
  assert.equal((await w.call('host/login',{password},{origin:'https://unrelated.example'})).status,403);
  const login=await w.call('host/login',{password}); assert.match(login.headers.get('set-cookie'),/HttpOnly/); assert.match(login.headers.get('set-cookie'),/SameSite=Strict/);
  for(let i=0;i<4;i++) assert.equal((await w.call('host/login',{password:'wrong'})).status,401);
  assert.equal((await w.call('host/login',{password:'wrong'})).status,429);
});

test('startup refuses default secrets, missing production infrastructure and local data inside source',async()=>{
  await assert.rejects(createWorkshopServer({hostPassword:'password',dataDir:':memory:',databaseUrl:null}),/at least 16/);
  await assert.rejects(createWorkshopServer({hostPassword:password,production:true,databaseUrl:null,publicOrigin:null}),/DATABASE_URL/);
  await assert.rejects(openStore({dataDir:fileURLToPath(new URL('../',import.meta.url))}),/outside the source/);
});
