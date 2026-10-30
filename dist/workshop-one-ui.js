import { e, request } from './open-circle.js';

export const header = (hostEntry = true) => `<header class="topbar"><a class="brand forum-brand" href="${e(location.pathname + location.search)}" aria-label="Circle News home"><img class="forum-mark" src="/brand/open-circle-mark.png" width="40" height="40" alt=""><span class="forum-wordmark">Circle News<span class="brand-dot">.</span></span></a><span class="community-tagline">Different voices. Shared space.</span>${hostEntry ? '<a class="host-entry" href="/host" aria-label="Host access"><span>Host access</span></a>' : '<span class="header-spacer" aria-hidden="true"></span>'}</header>`;

export async function startProjector() {
  const sid = new URLSearchParams(location.search).get('s');
  const link = location.origin + '/?s=' + encodeURIComponent(sid || '');
  document.querySelector('#app').innerHTML = header(false) + `<main id="main" class="projector"><section><span class="eyebrow">WELCOME TO CIRCLE NEWS</span><h1 id="projector-title">Your voice.<br>Your choice.<br>Our conversation.</h1><span class="eyebrow">TODAY’S TOPIC</span><p id="question"></p><div class="phase" id="phase"></div><p id="progress" role="status"></p></section><section class="panel"><div id="qr"></div><h2>Join the circle.</h2><p>Scan the QR, or enter this room code:</p><strong id="room-code" class="projector-room-code" aria-label="Room code"></strong><p id="display-url"></p><p id="join-instructions">Use the details on your paper profile to join.</p><p id="connection" role="status"></p></section></main>`;
  if (!sid) { document.querySelector('#connection').textContent = 'Open the projector link from your host screen.'; return; }
  const qr = window.qrcode(0, 'M'); qr.addData(link); qr.make();
  document.querySelector('#qr').innerHTML = qr.createSvgTag({ cellSize: 6, margin: 24, scalable: true });
  document.querySelector('#qr svg').setAttribute('aria-label', 'Scan to open Circle News');
  document.querySelector('#qr svg').setAttribute('role', 'img');
  document.querySelector('#display-url').textContent = location.host;
  let busy = false;
  const refresh = async () => {
    if (busy) return; busy = true;
    try {
      const data = await request('projector', { sid });
      document.querySelector('#room-code').textContent = data.joinCode ? data.joinCode.slice(0, 3) + ' ' + data.joinCode.slice(3) : '';
      document.querySelector('#qr').hidden = data.phase === 'ended';
      document.querySelector('#room-code').hidden = data.phase === 'ended';
      document.querySelector('#question').textContent = data.question;
      document.body.classList.add('workshop-one-mode');
      document.title = data.workshopTitle + ' · Circle News';
      document.querySelector('#projector-title').textContent = data.workshopTitle;
      document.querySelector('#join-instructions').textContent = 'Enter your organization’s name.';
      document.querySelector('#phase').textContent = data.phase === 'ended' ? 'This workshop room has closed.' : 'Join your association and follow the facilitator.';
      document.querySelector('#progress').textContent = `${data.participants} / ${data.capacity} associations joined`;
      document.querySelector('#phase').hidden = false;
      document.querySelector('#connection').textContent = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'For phones, open the host screen using the computer’s network address before opening this projector link.' : 'Live updates connected';
    } catch (error) { document.querySelector('#connection').textContent = error.message; if (error.status === 410) { document.querySelector('#qr').replaceChildren(); document.querySelector('#room-code').textContent = ''; document.querySelector('#progress').textContent = ''; } }
    finally { busy = false; }
  };
  await refresh(); setInterval(refresh, 2000);
}

