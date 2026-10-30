import { expect } from '@playwright/test';

// The organization scenarios share one local test host login. Repeatedly signing
// in from the same test runner must not exhaust the real sign-in protection.
let cookies;
export async function signInWorkshopOneHost(page) {
  if (!cookies) {
    const response = await page.request.post('/api/host/login', { data: { password: 'browser-test-host-password-only' } });
    expect(response.ok()).toBeTruthy();
    cookies = await page.context().cookies();
  } else await page.context().addCookies(cookies);
}
