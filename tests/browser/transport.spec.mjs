async function openPhoneMenu(page) { if (await page.locator('#open-menu').isVisible() && !await page.locator('#phone-menu').isVisible()) await page.locator('#open-menu').click(); }
import { test, expect } from '@playwright/test';
import { randomBytes, randomUUID } from 'node:crypto';
import { transportCards } from '../../workshop/transport.mjs';

test('transport host launch shows seven private outcomes on phone and desktop and restores everyone', async ({ browser, page: host, request }, info) => {
  const errors = []; host.on('pageerror', error => errors.push(error.message));
  await host.goto('/host'); await host.getByLabel('Password', { exact: true }).fill('browser-test-host-password-only');
  await host.getByRole('button', { name: 'Unlock host screen' }).click();
  await host.getByText('Create a new room', { exact: true }).click();
  await host.getByLabel('Room name').fill('Transport browser rehearsal');
  await host.getByRole('button', { name: 'Create room', exact: true }).click();
  await expect(host.getByRole('heading', { name: 'Transport browser rehearsal', exact: true })).toBeVisible();
  const sid = new URL(host.url()).searchParams.get('s');
  const launch = host.getByRole('button', { name: 'Launch incident', exact: true });
  await expect(launch).toHaveCount(1); await expect(launch).toBeDisabled();
  expect(await launch.evaluate(el => el.closest('.host-room') !== null)).toBe(true);
  await expect(host.locator('#controls')).not.toContainText('PRIVATE HOST ·');
  await expect(host.locator('#controls')).not.toContainText('Share the participant link');
  expect(await launch.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(60);
  await host.setViewportSize({ width: 1440, height: 1000 });
  await expect(host.locator('.host-table tbody tr')).toHaveCount(7);
  await expect(host.locator('.host-table .join-dot.joined')).toHaveCount(0);
  const contexts = [], pages = [], tokens = [];
  for (let i = 0; i < 7; i++) {
    const token = randomBytes(32).toString('hex'); tokens.push(token);
    const card = transportCards[i];
    const response = await request.post('/api/join?s=' + sid, { headers: { Authorization: 'Bearer ' + token }, data: { name: card.fullName, town: card.town, bio: card.suggestedBio, color: i, cover: i } });
    expect(response.ok()).toBeTruthy();
    const context = await browser.newContext({ viewport: [0, 1, 4, 6].includes(i) ? { width: 390, height: 844 } : { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    contexts.push(context);
    await context.addInitScript(({ sid, token }) => { if (!localStorage.getItem('open-circle:' + sid)) localStorage.setItem('open-circle:' + sid, token); }, { sid, token });
    const page = await context.newPage(); pages.push(page); page.on('pageerror', error => errors.push(error.message));
    await page.goto('/?s=' + sid);
    await expect(page.locator('#question')).toContainText('Bus fares for young people');
  }
  async function release(name) {
    const button = host.getByRole('button', { name, exact: true });
    await expect(button).toBeEnabled(); await button.click();
    await expect(host.getByRole('dialog')).toBeVisible();
    await host.getByRole('button', { name: 'Confirm release', exact: true }).click();
    await expect(host.getByRole('dialog')).not.toBeVisible();
  }
  await host.getByLabel('Find a fictional name, town or username').fill('Mats');
  await expect(host.locator('[data-person]:visible')).toHaveCount(1);
  await expect(host.locator('[data-person]:visible')).toContainText('Mats Berg');
  await host.getByLabel('Find a fictional name, town or username').fill('');
  await expect(host.locator('.host-table .join-dot.joined')).toHaveCount(7);
  await host.screenshot({ path: info.outputPath('host-before.png'), fullPage: true });
  await release('Open debate');
  await expect(host.getByRole('button', { name: 'Launch incident', exact: true })).toBeDisabled();
  for (let i = 0; i < 7; i++) {
    await pages[i].getByLabel('Your reason or reply').fill(transportCards[i].suggestedPost);
    await pages[i].getByRole('button', { name: 'Publish post' }).click();
    await expect(pages[i].locator('#threads')).toContainText(transportCards[i].suggestedPost);
  }
  await pages[2].getByLabel('Your reason or reply').fill('Keep this unfinished thought.');
  await openPhoneMenu(pages[2]); await pages[2].getByRole('link', { name: 'Discover', exact: true }).click();
  await release('Launch incident');
  await expect(host.locator('[data-role-card="1"] .access')).toHaveText('Read only');
  await expect(host.locator('[data-role-card="3"]')).toContainText('4 simulated posts');
  await expect(host.locator('[data-role-card="6"]')).toContainText('1 own contribution hidden');
  await host.screenshot({ path: info.outputPath('host-incident.png'), fullPage: true });
  await host.setViewportSize({ width: 390, height: 844 });
  expect(await host.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await host.locator('.host-table-scroll').scrollIntoViewIfNeeded();
  await host.screenshot({ path: info.outputPath('host-phone.png') });
  await host.setViewportSize({ width: 1440, height: 1000 });
  const titles = ['Account hacked — you’re locked out', 'Launch a hashtag campaign', 'Account hacked — someone is posting as you', 'Send bots to challenge someone', 'Account hacked — your identity is being exposed', 'Your posts are being hidden', 'Your account has been deleted'];
  for (let i = 0; i < 7; i++) {
    const dialog = pages[i].getByRole('dialog', { name: titles[i], exact: true });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    if ([1, 3].includes(i)) {
      await expect(dialog.locator('.support-bot')).toHaveCount(4);
      expect(await dialog.locator('.support-bot').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    }
    await pages[i].screenshot({ path: info.outputPath('incident-' + i + '.png') });
    await pages[i].locator('#close-incident').click();
    await expect(pages[i].locator('#incident-banner')).toContainText(titles[i]);
    if (i === 2) {
      await expect(pages[i].locator('#post-toast')).toContainText('A post appeared under your name');
      await expect(pages[i].locator('#post-toast')).toContainText(i === 2 ? 'against reducing youth fares' : 'fare-cap proposal');
    }
    await expect(pages[i].locator('#send-post'))[[0, 6].includes(i) ? 'toBeDisabled' : 'toBeEnabled']();
  }
  await expect(pages[0].locator('#composer')).toBeHidden();
  await openPhoneMenu(pages[0]); await pages[0].getByRole('link', { name: 'Discover', exact: true }).click({ force: true });
  await expect(pages[0].locator('#feed-view')).toBeVisible();
  await expect(pages[0].locator('#discover-view')).toBeHidden();
  await expect(pages[2].getByLabel('Your reason or reply')).toHaveValue('Keep this unfinished thought.');
  await expect(pages[2].locator('#account-takeover')).toContainText('Posted under your name');
  await expect(host.locator('#recovery-summary')).toHaveCount(0);
  await openPhoneMenu(pages[0]); await expect(pages[0].getByRole('button', { name: 'Edit profile', exact: true })).toBeDisabled();
  await expect(pages[1].locator('#threads')).not.toContainText(transportCards[5].suggestedPost);
  await expect(pages[5].locator('#threads')).toContainText(transportCards[5].suggestedPost);
  await pages[1].reload();
  await expect(pages[1].locator('#incident-banner')).toContainText('Launch a hashtag campaign');
  await expect(pages[1].locator('#incident-dialog')).not.toBeVisible();
  await pages[1].getByRole('button', { name: 'View account alert' }).click();
  await expect(pages[1].locator('#incident-dialog')).toBeVisible();
  await pages[1].getByRole('button', { name: 'Back to the feed' }).click();
  await expect(pages[4].getByRole('heading', { name: 'Someone is targeting you' })).toBeVisible();
  await expect(pages[4].locator('#incident-dialog .exposed-identity img')).toHaveAttribute('src', '/portraits/5.png');
  await pages[4].getByRole('button', { name: 'View tagged post' }).click();
  await expect(pages[4].locator('.post.is-mentioned .exposed-identity')).toBeVisible();
  await pages[6].getByRole('button', { name: 'Create a new account', exact: true }).click();
  await expect(pages[6].getByRole('heading', { name: 'Create your new account.' })).toBeVisible();
  await pages[6].locator('#join-name').fill('Mats Berg');
  await pages[6].locator('#join-town').fill('Tromsø');
  await pages[6].getByRole('button', { name: 'Join the forum', exact: true }).click();
  await expect(pages[6].locator('#join-dialog')).not.toBeVisible();
  if (await pages[6].locator('#workshop-intro-dialog').isVisible()) await pages[6].getByRole('button', { name: 'Enter the forum' }).click();
  await expect(pages[6].locator('#team')).toContainText('@nordlys-vandrer-ny');
  await expect(pages[6].locator('#send-post')).toBeEnabled();
  const revoked = await request.get('/api/me?s=' + sid, { headers: { Authorization: 'Bearer ' + tokens[6] } });
  expect(revoked.status()).toBe(401);
  await release('Begin reflection'); await release('Reveal and restore');
  await expect(host.locator('.outcome-restored')).toHaveCount(7);
  await expect(host.locator('.access-open')).toHaveCount(7);
  await host.screenshot({ path: info.outputPath('host-restored.png'), fullPage: true });
  for (let i = 0; i < 7; i++) {
    await expect(pages[i].locator('.account-restored')).toBeVisible();
    await expect(pages[i].locator('#incident-dialog')).not.toBeVisible();
    await expect(pages[i].locator('#response-form')).toHaveCount(0);
    await expect(pages[i].locator('#account-takeover')).toBeHidden();
    await expect(pages[i].getByRole('button', { name: 'Publish post' })).toBeEnabled();
    await expect(pages[i].locator('#threads')).toContainText(transportCards[5].suggestedPost);
  }
  await pages[0].getByLabel('Your reason or reply').fill('I can speak again. My view has not changed.');
  await pages[0].getByRole('button', { name: 'Publish post' }).click();
  await expect(pages[0].locator('#threads')).toContainText('I can speak again.');
  expect(errors).toEqual([]);
  for (const context of contexts) await context.close();
});

test('restoration interrupts a live takeover without losing a draft or duplicating posts', async ({ browser, request }, info) => {
  await request.post('/api/host/login', { data: { password: 'browser-test-host-password-only' } });
  const sid = randomUUID(), tokens = [];
  await request.post('/api/host/sessions', { data: { id: sid, label: 'Live animation cancellation', kind: 'rehearsal', expiresAt: Date.now() + 3600000 } });
  for (const [i, card] of transportCards.entries()) {
    tokens[i] = randomBytes(32).toString('hex');
    await request.post('/api/join?s=' + sid, { headers: { Authorization: 'Bearer ' + tokens[i] }, data: { name: card.fullName, town: card.town, bio: '', color: i, cover: i } });
  }
  async function release(action) {
    const state = await (await request.get('/api/host/state?s=' + sid)).json();
    expect((await request.post('/api/host/action?s=' + sid, { data: { action, version: state.version, requestId: randomUUID() } })).ok()).toBeTruthy();
  }
  await release('debate');
  for (let i = 0; i < 7; i++) await request.post('/api/posts?s=' + sid, { headers: { Authorization: 'Bearer ' + tokens[i] }, data: { text: transportCards[i].suggestedPost, requestId: randomUUID() } });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  await context.addInitScript(({ sid, token }) => { if (!localStorage.getItem('open-circle:' + sid)) localStorage.setItem('open-circle:' + sid, token); }, { sid, token: tokens[2] });
  const page = await context.newPage(); await page.goto('/?s=' + sid);
  await page.getByLabel('Your reason or reply').fill('This is my unfinished real opinion.');
  await openPhoneMenu(page); await page.getByRole('link', { name: 'Discover', exact: true }).click();
  await release('incident');
  await expect(page.locator('#incident-dialog')).toBeVisible(); await page.locator('#close-incident').click();
  await expect(page.locator('#account-takeover')).toHaveAttribute('data-state', 'typing');
  await expect(page.locator('#discover-view')).toBeHidden();
  await expect(page.locator('#composer')).toBeHidden();
  await expect(page.locator('[data-takeover-pending]').first()).toBeHidden();
  expect(await page.locator('[data-takeover-pending]').count()).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('live-typing-phone.png') });
  await release('reflection'); await release('reveal');
  await expect(page.locator('.account-restored')).toBeVisible();
  await expect(page.locator('#account-takeover')).toBeHidden();
  await expect(page.getByLabel('Your reason or reply')).toHaveValue('This is my unfinished real opinion.');
  await page.waitForTimeout(7000); // Exceed the cancelled typing/sending callbacks.
  await expect(page.locator('#account-takeover')).toBeHidden();
  await expect(page.locator('#send-post')).toBeEnabled();
  const state = await (await request.get('/api/host/state?s=' + sid)).json();
  expect(state.roles.reduce((sum, role) => sum + role.activity.injected, 0)).toBe(5);
  await context.close();
});
