const root = document.querySelector('#app');
const presenter = new URLSearchParams(location.search).has('presenter');
async function api(route, body) {
  const response = await fetch('/api/' + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000)
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Please try again.'), { status: response.status });
  return data;
}
function presenterContent() {
  return `<section class="presenter-copy"><span class="eyebrow">NORDIC YOUTH CONFERENCE · WORKSHOP 02</span><h1>Hacked:<br>Who speaks<br><em>for you?</em></h1><p>Scan. Get a name.<br>Join the conversation.</p><ol><li>Open your phone camera.</li><li>Scan the QR code.</li><li>Get your name and share a thought.</li></ol><span class="presenter-count" id="presenter-count" role="status">Connecting…</span></section><section class="qr-panel"><div id="qr"></div><h2>Your voice belongs here.</h2><p id="display-url"></p><p id="qr-help" role="status"></p><details><summary>Participant link settings</summary><form id="qr-form"><label for="join-url">URL participants can open</label><input type="url" id="join-url" required><button class="primary">Update QR code</button></form></details></section>`;
}
function drawQR(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    url.searchParams.delete('presenter');
    const qr = window.qrcode(0, 'M'); qr.addData(url.href); qr.make();
    document.querySelector('#qr').innerHTML = qr.createSvgTag({ cellSize:6, margin:24, scalable:true });
    const svg = document.querySelector('#qr svg'); svg.setAttribute('role','img'); svg.setAttribute('aria-label','Scan to join the workshop');
    document.querySelector('#display-url').textContent = url.href;
    document.querySelector('#join-url').value = url.href;
    document.querySelector('#qr-help').textContent = ['localhost','127.0.0.1','[::1]'].includes(url.hostname) ? 'For phones, enter this computer’s network URL below. A localhost link only works on this computer.' : 'For this local preview, connect to the same network as the presenter.';
  } catch { document.querySelector('#qr-help').textContent = 'Enter a valid http or https participant URL without credentials.'; }
}

async function refreshHost() {
  try {
    await api('host/session');
    const data = await api('feed');
    document.querySelector('#presenter-count').textContent = data.participants + (data.participants === 1 ? ' person has joined' : ' people have joined');
  } catch (error) {
    if (error.status === 401) { location.replace('/?presenter=1'); return; }
    document.querySelector('#presenter-count').textContent = 'Reconnecting to the workshop…';
  }
}
async function start() {
  if (!presenter) { await import('./participant.js'); return; }
  try { await api('host/session'); } catch { location.replace('/?presenter=1'); return; }
  root.innerHTML = '<header class="topbar"><a class="brand" href="/" aria-label="Workshop home"><span class="brand-mark">hacked<span>●</span></span></a><span class="conference">Nordic Youth Conference <span class="year">2026</span></span><div class="host-actions"><a class="quiet-link" href="/">Open workshop ↗</a><button id="lock-host" class="quiet-link">Lock host screen</button></div></header><main id="main" class="presenter">' + presenterContent() + '</main>';
  document.querySelector('#lock-host').onclick = async event => {
    const button = event.currentTarget; button.disabled = true;
    try { await api('host/logout', {}); location.replace('/'); }
    catch { button.disabled = false; button.textContent = 'Could not lock. Retry'; }
  };
  drawQR(location.origin + '/');
  document.querySelector('#qr-form').onsubmit = event => { event.preventDefault(); drawQR(document.querySelector('#join-url').value); };
  await refreshHost(); setInterval(refreshHost, 2000);
}
start();
window.addEventListener('pageshow', event => { if (presenter && event.persisted) location.reload(); });
