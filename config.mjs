// Configuration only: importing or checking this module never opens a database.
export function validateConfig({ hostPassword, databaseUrl, publicOrigin, production, store }) {
  if (typeof hostPassword !== 'string' || hostPassword.length === 0) throw new Error('Set HOST_PASSWORD to a non-empty password.');
  if (databaseUrl) {
    let url;
    try { url = new URL(databaseUrl); } catch { throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.'); }
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
  let origin;
  if (publicOrigin) {
    let url;
    try { url = new URL(publicOrigin); } catch { throw new Error('PUBLIC_ORIGIN must be the complete website origin.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('PUBLIC_ORIGIN must contain only the website origin, without a path, credentials, query or fragment.');
    origin = url.origin;
  }
  if (production && ((!databaseUrl && !store) || !origin?.startsWith('https://'))) throw new Error('Production requires DATABASE_URL and an HTTPS PUBLIC_ORIGIN.');
  return origin;
}

export function runtimeConfig(env = process.env, args = process.argv) {
  const production = env.NODE_ENV === 'production';
  const config = { hostPassword: env.HOST_PASSWORD, databaseUrl: env.DATABASE_URL, dataDir: env.DATA_DIR, publicOrigin: env.PUBLIC_ORIGIN, production };
  config.publicOrigin = validateConfig(config);
  const port = Number(env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
  return { ...config, port, host: env.HOST || (production || args.includes('--lan') ? '0.0.0.0' : '127.0.0.1') };
}
