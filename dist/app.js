import { startParticipant, startProjector } from './open-circle.js';
const params = new URLSearchParams(location.search);
if (params.has('presenter')) startProjector(); else startParticipant();
