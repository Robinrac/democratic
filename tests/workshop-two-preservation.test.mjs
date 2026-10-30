import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { workshop } from './helpers.mjs';

// Exact files from the last deployed Workshop 2 release before Workshop 1 (1dfaf33).
// Intentional Workshop 2 development must explicitly review this baseline.
const baseline = {
  "dist/app.js": "4456c25e3730da0107196a5bf9a5c36dc845e905261835b8f428e3b91f55de29",
  "dist/index.html": "bfe424a465d453b92f8ad865f2a8888d35587474937d3ec940ae2a495d5f7ac0",
  "dist/open-circle.js": "debfd9c0a7d6721087f975cc6c5b9a526fc62930311df9ad30b810fef77f2862",
  "dist/open-circle.css": "e47034c4fb2ab335a1b7444f36b7a2a4ec96d60c697841716f7021d083a8f1ab",
  "dist/open-circle-theme.css": "66845483805bffcd78ff8dfd615915b341a218b2ebd0cd6af562b46e29cbc6c5",
  "dist/styles.css": "6e324523e7f0f103ee9e60f11a15dcb5e31f8b6058871fcfdcf89300407d3a6f",
  "dist/forum-activity.js": "d8095d00fabd8c5e0084b00858b8669ff730dc7154a7d49fbeaa252500e4b35d",
  "dist/incident-experience.js": "aa418fe111ea21c20b795675676f47f218c7de7cb7ef9b6c7637ee547c8d6291",
  "dist/profile-themes.js": "db32dc975837a358c77a1fbde7c3d298182a6a08af35006d623d3769e5ebf058",
  "dist/host.css": "5c7d894d818d8cb124cb80ebf242c8c1eed5dcc6dbc13a509a78b79a7d27de2f",
  "host.html": "c95a4c48ce929cebaebe6c0e92670f9f707ae5c6041e918e780adb541a6e06ee",
  "host-login.html": "3d76e167d1e3ef9fbd3e82e6d598628f69ab2827c31c699124363438ae84804d",
  "workshop/transport.mjs": "d5df767d433b294276ea166bad4af5e1864932d192f8b9079eb866f1191a30c0",
  "workshop/bots.mjs": "66d0f2a16716f14ec10ad281d1b0c5cd27c25b01ca9247d5865659684f874663",
  "workshop/social.mjs": "fdb0e2673206552f6d3aaca705f0599b5bb719087c8e7f188a10f4d95485228f",
  "workshop/roles.mjs": "dae141679754e8af4afc6526bf2e929ee3a3d4f23c5f14f745651e06c5b343ba",
  "workshop/profile-matching.mjs": "a5c1dbb7a8c06e149cfd90cc7f2e76ab35640346f73dd397e2640dc7bb063a8d"
};

test('Workshop 2 pages, styling, participant behavior and scenario definitions retain their original bytes', async () => {
  for (const [file, expected] of Object.entries(baseline)) {
    const data = await readFile(new URL('../' + file, import.meta.url));
    assert.equal(createHash('sha256').update(data).digest('hex'), expected, file);
  }
});

test('only Workshop 1 rooms receive its entry and styles, including after reset and on projector URLs', async t => {
  const w = await workshop(t); await w.login();
  const { sid: legacy } = await w.session();
  const { sid: transport } = await w.session('rehearsal', 'transport-v1');
  const result = await w.call('host/sessions', { id: randomUUID(), label: 'Isolated workshop 1', kind: 'rehearsal', workshopType: 'workshop-1', expiresAt: Date.now() + 86400000 }, { host: true });
  const one = result.session.id;
  const original = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  for (const path of ['/', '/index.html', '/?s=' + legacy, '/?s=' + transport, '/?s=' + transport + '&presenter=1']) {
    const response = await fetch(w.base + path); assert.equal(response.status, 200);
    assert.equal(await response.text(), original, path);
  }
  for (const path of ['/?s=' + one, '/index.html?s=' + one, '/?s=' + one + '&presenter=1']) {
    const response = await fetch(w.base + path); assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /workshop-one-app\.js/); assert.match(html, /workshop-one-controls\.css/);
    assert.doesNotMatch(html, /src="\.\/app\.js"/);
  }
  for (const file of ['workshop-one-app.js', 'workshop-one-ui.js', 'workshop-one-controls.css']) {
    const response = await fetch(w.base + '/' + file); assert.equal(response.status, 200);
  }
  const state = await w.state(one);
  await w.call('host/reset', { version: state.version, confirmLabel: state.label, expiresAt: Date.now() + 86400000 }, { sid: one, host: true });
  assert.match(await (await fetch(w.base + '/?s=' + one)).text(), /workshop-one-app\.js/);
  assert.equal(await (await fetch(w.base + '/?s=' + transport)).text(), original);
});
