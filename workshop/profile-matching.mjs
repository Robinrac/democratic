/** Normalize Nordic names for matching, without changing the stored paper name. */
export function normalizeProfileName(value) {
  if (typeof value !== 'string') return '';
  const letters = { ø: 'o', æ: 'ae', œ: 'oe', ð: 'd', þ: 'th', ł: 'l', ß: 'ss' };
  return value.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/[øæœðþłß]/g, letter => letters[letter])
    .replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/**
 * Identify one paper profile by full name, first name or surname.
 * A whole name part is required; a single prefix never claims an identity.
 * Every entered part must be complete; prefixes never claim an identity.
 * Unknown parts and ambiguous matches return no profile. Never guess or pick
 * the first record. Pass a different profile list to reuse this for future casts.
 */
export function identifyProfileByName(value, profiles) {
  const normalized = normalizeProfileName(value);
  if (!normalized) return { status: 'empty', profile: null };
  const parts = normalized.split(' ');
  const exact = profiles.filter(profile => normalizeProfileName(profile.fullName) === normalized);
  if (exact.length === 1) return { status: 'matched', profile: exact[0] };
  const matches = profiles.filter(profile => {
    const remaining = normalizeProfileName(profile.fullName).split(' ');
    let wholeParts = 0;
    for (const part of parts) {
      const found = remaining.indexOf(part);
      if (found >= 0) wholeParts++;
      if (found < 0) return false;
      remaining.splice(found, 1);
    }
    return wholeParts > 0;
  });
  return matches.length === 1 ? { status: 'matched', profile: matches[0] }
    : { status: matches.length ? 'ambiguous' : 'unmatched', profile: null };
}
