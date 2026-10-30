import { test, expect } from '@playwright/test';
import { randomUUID, randomBytes } from 'node:crypto';
import { transportCards } from '../../workshop/transport.mjs';

test('host opens real-face reference cards, reads the current anonymous profile and retains the modal during updates', async ({ page, request }, info) => {
  await page.goto('/host'); await page.getByLabel('Password', { exact: true }).fill('browser-test-host-password-only'); await page.getByRole('button', { name: 'Unlock host screen' }).click();
  await page.getByText('Create a new room', { exact: true }).click(); await page.getByLabel('Room name').fill('Host reference'); await page.getByRole('button', { name: 'Create room', exact: true }).click();
  await expect(page.locator('.character-card')).toHaveCount(7);
  const sid = new URL(page.url()).searchParams.get('s');
  const dialog = page.locator('#character-dialog');
  for (const card of transportCards) {
    const button = page.getByRole('button', { name: 'Read about ' + card.fullName, exact: true });
    await expect(button.locator('img')).toHaveAttribute('src', `/portraits/${card.card}.png`);
    await button.locator('img').click();
    await expect(dialog).toBeVisible(); await expect(dialog.locator('#character-title')).toHaveText(card.fullName);
    await expect(dialog).toContainText(card.backstory); await expect(dialog).toContainText(card.proposal); await expect(dialog).toContainText(card.suggestedPost);
    await expect(dialog).toContainText('NOT JOINED YET');
    expect(await dialog.locator('.character-face').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(button).toBeFocused();
  }
  const token = randomBytes(32).toString('hex'), c = transportCards[4];
  const joined = await request.post('/api/join?s=' + sid, { headers: { Authorization: 'Bearer ' + token }, data: { name: c.fullName, town: c.town, bio: 'My actual profile bio', color: 3, cover: 1 } }); expect(joined.ok()).toBeTruthy();
  await page.getByRole('button', { name: 'Read about Linnea Sjöberg' }).click();
  await expect(dialog.locator('.character-anonymous')).toContainText('My actual profile bio');
  await expect(dialog.locator('.character-anonymous img')).toHaveAttribute('src', '/avatars/3.svg');
  await dialog.getByRole('heading', { name: 'Possible first post' }).scrollIntoViewIfNeeded();
  const scroll = await dialog.evaluate(d => d.scrollTop);
  await request.post('/api/profile?s=' + sid, { headers: { Authorization: 'Bearer ' + token }, data: { bio: 'An updated public bio' } });
  await expect(dialog.locator('.character-anonymous')).toContainText('An updated public bio');
  expect(await dialog.evaluate(d => d.scrollTop)).toBeGreaterThan(scroll - 30);
  await dialog.evaluate(d => d.scrollTop = 0); await page.screenshot({ path: info.outputPath('host-character-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 }); expect(await dialog.evaluate(d => d.scrollWidth <= d.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('host-character-phone.png') }); await page.getByRole('button', { name: 'Close character' }).click();
  await page.locator('.character-reference').scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('host-character-grid-phone.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
