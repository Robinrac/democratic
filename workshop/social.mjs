// Parse plain text on the server. Client-supplied mention/tag metadata is ignored.
export const starterTags = ['AffordableJourneys', 'ServiceFirst', 'FreeUnder25', 'KeepFares', 'FreeUnder20', 'FareCap'];
export function socialText(text, roles) {
  const handles = new Set([...text.matchAll(/(?<![\p{L}\p{N}_@])@([\p{L}\p{M}\p{N}]+(?:-[\p{L}\p{M}\p{N}]+)*)(?![\p{L}\p{M}\p{N}_-])/giu)].map(match => match[1].normalize('NFC').toLowerCase()));
  const hashtags = [...new Set([...text.matchAll(/(?<![\p{L}\p{N}_])#([\p{L}\p{N}_]{1,32})(?![\p{L}\p{N}_])/gu)].map(match => match[1].normalize('NFC').toLowerCase()))];
  return { mentions: roles.filter(role => role.claimed && handles.has(role.username)).map(role => role.id), hashtags };
}
export function trendingTags(posts, seeded = true) {
  const seeds = seeded ? starterTags : [];
  const counts = new Map(seeds.map(tag => [tag.toLowerCase(), 0]));
  for (const post of posts) if (!post.hidden) for (const tag of new Set(post.hashtags)) counts.set(tag, (counts.get(tag) || 0) + 1);
  const seedOrder = tag => { const i = seeds.findIndex(seed => seed.toLowerCase() === tag); return i < 0 ? seeds.length : i; };
  return [...counts].sort(([a, ac], [b, bc]) => bc - ac || seedOrder(a) - seedOrder(b) || a.localeCompare(b)).slice(0, 6)
    .map(([tag, count], index) => ({ tag, label: seeds.find(seed => seed.toLowerCase() === tag) || tag, count, rank: index + 1, starter: count === 0 }));
}
