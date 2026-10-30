import { request } from './open-circle.js';
import { header, startProjector } from './workshop-one-ui.js';
import { startWorkshopOne } from './workshop-one.js';
const params = new URLSearchParams(location.search);
async function start() {
  try {
    const room = await request('projector', { sid: params.get('s') });
    if (room.workshopType !== 'workshop-1') { location.reload(); return; }
    document.title = room.workshopTitle + ' · Circle News';
    if (params.has('presenter')) return startProjector();
    return startWorkshopOne(room);
  } catch (error) {
    document.querySelector('#app').innerHTML = header() + '<main id="main" class="welcome"><h1>Open your workshop</h1><p id="connection" role="status"></p><button id="retry-room">Try again</button></main>';
    document.querySelector('#connection').textContent = error.message;
    document.querySelector('#retry-room').onclick = start;
  }
}
start();
