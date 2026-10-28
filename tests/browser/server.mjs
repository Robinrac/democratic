import { createWorkshopServer } from '../../server.mjs';
const server = await createWorkshopServer({ hostPassword: 'browser-test-host-password-only', dataDir: ':memory:', databaseUrl: null, production: false, publicOrigin: null, incidentStepMs: 0 });
server.listen(4197, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await server.shutdown(); process.exit(0); });
