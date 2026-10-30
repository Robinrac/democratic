import { startParticipant, startProjector, request, header } from './open-circle.js';
import { startWorkshopOne } from './workshop-one.js';
const params = new URLSearchParams(location.search);
async function start() {
  if (params.has('presenter')) return startProjector();
  if (!params.has('s')) return startParticipant();
  try {
    const room = await request('projector', { sid: params.get('s') });
    document.title = room.workshopTitle + ' · Circle News';
    if (room.workshopType === 'workshop-1') return startWorkshopOne(room);
    return startParticipant();
  } catch (error) {
    document.querySelector('#app').innerHTML = header() + '<main id="main" class="welcome"><h1>Open your workshop</h1><p id="connection" role="status"></p><button id="retry-room">Try again</button></main>';
    document.querySelector('#connection').textContent = error.message;
    document.querySelector('#retry-room').onclick = start;
  }
}
start();
