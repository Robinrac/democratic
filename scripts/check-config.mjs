import { runtimeConfig } from '../config.mjs';

try {
  const config = runtimeConfig();
  console.log(`Configuration valid for ${config.production ? 'production' : 'local use'}. Storage: ${config.databaseUrl ? 'external PostgreSQL' : 'local PGlite'}.`);
  console.log('No database connection or deployment was performed.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
