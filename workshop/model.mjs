import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { roleCards } from './roles.mjs';

export const question = 'Should Open Circle require members to show their real names on every public post, or allow public usernames?';
export const phases = ['opening', 'debate', 'exposure', 'forgery', 'reactions', 'reflection', 'recovery', 'discussion', 'closing', 'ended'];
export const actions = [
  { id: 'debate', label: 'Open debate', from: 'opening', to: 'debate', multiplier: 0, type: 'Join, role, bio and genuine opinions · minutes 12–30' },
  { id: 'exposure', label: 'Launch simulated takeover', from: 'debate', to: 'exposure', multiplier: 1, type: 'Fictional identity disclosure · minutes 30–33' },
  { id: 'forgery', label: 'Release forged posts', from: 'exposure', to: 'forgery', multiplier: 2, type: 'Opposite opinion and withdrawal · minutes 33–38' },
  { id: 'reactions', label: 'Release reactions', from: 'forgery', to: 'reactions', multiplier: 3, type: 'Three tagged fictional reactions per target · minutes 33–38' },
  { id: 'reflection', label: 'Begin reflection', from: 'reactions', to: 'reflection', multiplier: 0, type: 'Team reflection · minutes 38–43' },
  { id: 'reveal', label: 'Reveal what happened', from: 'reflection', to: 'recovery', multiplier: 0, type: 'Show provenance and open corrections · minutes 43–48' },
  { id: 'discussion', label: 'Begin room discussion', from: 'recovery', to: 'discussion', multiplier: 0, type: 'Whole-room discussion · minutes 48–54' },
  { id: 'closing', label: 'Begin closing', from: 'discussion', to: 'closing', multiplier: 0, type: 'Closing · minutes 54–59; one-minute buffer' },
  { id: 'end', label: 'End session', from: 'closing', to: 'ended', multiplier: 0, type: 'Stop participation; data clears at the chosen deadline' }
];
export const hash = value => createHash('sha256').update(value).digest('hex');
export function fail(status, message) { throw Object.assign(new Error(message), { status }); }
export function text(value, max, empty = false) {
  if (typeof value !== 'string' || value.trim().length > max || (!empty && !value.trim()) || /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail(400, `Use plain text${empty ? '' : ' (not empty)'}, up to ${max} characters, without markup.`);
  return value.trim();
}
export function requestId(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(value)) fail(400, 'Missing request identifier. Refresh and try again.');
  return value;
}
export function makeSession({ id, label, kind, expiresAt }) {
  if (!['rehearsal', 'live'].includes(kind)) fail(400, 'Choose rehearsal or live.');
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Date.now() + 60000 || expiresAt > Date.now() + 7 * 86400000) fail(400, 'Choose a deletion deadline between one minute and seven days from now.');
  const state = { id: requestId(id), label: text(label, 80), kind, expiresAt, phase: 'opening', version: 0, paused: false, roles: [], accounts: [], posts: [], flags: [], targets: [], events: {}, credentials: [], responses: {}, createdAt: new Date().toISOString() };
  const prefixes = ['quiet', 'bright', 'open', 'gentle', 'silver', 'clear', 'steady'];
  state.roles = roleCards.map((card, i) => ({ id: randomUUID(), card: card.card, handle: `${prefixes[i]}-${randomBytes(3).toString('hex')}`, bio: '', color: i, cover: i, claimed: false }));
  state.accounts = ['garden-visitor', 'river-reader', 'forum-team'].map(handle => ({ id: randomUUID(), handle, bio: 'Open Circle member', color: 1, cover: 1 }));
  return { state, codes: issueCodes(state) };
}
export function issueCodes(state) {
  return state.roles.filter(r => !r.claimed).map(role => {
    const code = randomBytes(6).toString('hex').toUpperCase();
    role.codeHash = hash(code);
    return { card: role.card, handle: role.handle, code };
  });
}
export function publicRole(role) {
  return { id: role.id, handle: role.handle, bio: role.bio, color: role.color, cover: role.cover, ...(role.card ? { avatar: `/portraits/${role.card}.png` } : {}) };
}
export function revealed(state) { return phases.indexOf(state.phase) >= phases.indexOf('recovery'); }
export function credential(state, token, requirePoster = false) {
  const c = typeof token === 'string' && state.credentials.find(c => c.hash === hash(token));
  if (!c || c.expiresAt <= Date.now()) fail(401, 'This team access has expired. Ask the host for help.');
  if (requirePoster && c.scope !== 'poster') fail(403, 'This device is read-only. Use the team’s posting device.');
  return c;
}
export function me(state, token) {
  const c = credential(state, token), role = state.roles.find(r => r.id === c.roleId);
  const card = roleCards[role.card - 1];
  const { portraitFile, ...privateRole } = card;
  return { participant: publicRole(role), scope: c.scope, ...(c.scope === 'poster' ? { privateRole } : {}) };
}
export function publicPost(state, post) {
  const author = [...state.roles, ...state.accounts].find(r => r.id === post.authorId);
  return { id: post.id, author: publicRole(author), text: post.hidden ? '[Hidden by the host]' : post.text, hidden: !!post.hidden, createdAt: post.createdAt, threadId: post.threadId, replyTo: post.replyTo || null, stance: post.hidden ? null : post.stance || null, correction: !!post.correction,
    disputed: state.flags.some(f => f.postId === post.id),
    ...(revealed(state) ? { provenance: post.origin, actualActor: post.actor } : {}) };
}
export function summary(state) {
  return { id: state.id, label: state.label, kind: state.kind, phase: state.phase, version: state.version, paused: state.paused, expiresAt: state.expiresAt, participants: state.roles.filter(r => r.claimed).length, genuinePosts: state.posts.filter(p => p.origin === 'team' && !p.hidden).length };
}
export function feed(state) {
  const visible = state.posts.map(p => publicPost(state, p));
  return { ...summary(state), question, profiles: state.roles.filter(r => r.claimed).map(publicRole), posts: visible,
    threads: state.roles.filter(r => r.claimed).map(r => ({ id: r.id, handle: r.handle, posts: visible.filter(p => p.threadId === r.id) })).filter(t => t.posts.length),
    notice: revealed(state) ? 'The identity disclosures, changed opinions and withdrawals were injected by the workshop host. The tagged reactions were scripted. No external accounts were accessed. Team-authored contributions remain labelled below. You can correct the record.' : null };
}
export function targets(state, includeFallback = []) {
  if (state.targets.length) return state.targets;
  return state.roles.filter(r => r.claimed).flatMap(role => {
    const first = state.posts.find(p => p.origin === 'team' && p.authorId === role.id && p.stance && !p.correction && !p.replyTo);
    if (!first && !includeFallback.includes(role.id)) return [];
    return [{ roleId: role.id, handle: role.handle, stance: first?.stance || roleCards[role.card - 1].leaning, source: first ? 'first genuine post' : 'assigned leaning (explicit inclusion)' }];
  });
}
export function hostView(state, includeFallback = []) {
  const selected = targets(state, includeFallback);
  return { ...summary(state), roles: state.roles.map(r => ({ ...publicRole(r), card: r.card, claimed: r.claimed, hasPost: state.posts.some(p => p.origin === 'team' && p.authorId === r.id && p.stance && !p.replyTo && !p.correction) })),
    targets: selected, postCount: state.posts.length,
    actions: actions.map(a => ({ ...a, enabled: !state.paused && state.phase === a.from && (a.id !== 'exposure' || selected.length > 0), count: a.multiplier * selected.length, handles: selected.map(t => t.handle) })),
    posts: state.posts.filter(p => p.origin === 'team').map(p => ({ ...publicPost(state, p), origin: p.origin })),
    events: state.events };
}
const rule = stance => stance === 'usernames' ? 'allow public usernames' : 'require public real names';
function addPost(state, values) {
  const post = { id: randomUUID(), createdAt: new Date().toISOString(), ...values };
  state.posts.push(post); return post;
}
export function release(state, data) {
  const key = requestId(data.requestId);
  if (state.events[key]) {
    if (state.events[key].action !== data.action) fail(409, 'This request identifier was already used for another action.');
    return state.events[key];
  }
  if (data.version !== state.version) fail(409, 'The session changed. Reload the preview before confirming.');
  const action = actions.find(a => a.id === data.action);
  if (!action || state.phase !== action.from || state.paused) fail(409, 'That action is not available in the current phase. Refresh the host screen.');
  if (data.action === 'exposure') {
    const fallback = Array.isArray(data.includeFallback) ? data.includeFallback : [];
    state.targets = targets(state, fallback);
    if (!state.targets.length) fail(409, 'Wait for a genuine first post or explicitly include a claimed role’s assigned leaning.');
  }
  const before = state.posts.length;
  for (const target of state.targets) {
    const role = state.roles.find(r => r.id === target.roleId), card = roleCards[role.card - 1];
    const base = { threadId: role.id, authorId: role.id, actor: 'workshop-host', origin: 'simulation' };
    if (data.action === 'exposure') addPost(state, { ...base, text: `My name is ${card.fullName}, and I am from ${card.town}. I argued for ${rule(target.stance)} in this discussion` });
    if (data.action === 'forgery') {
      addPost(state, { ...base, text: `I have changed my mind. Open Circle should ${rule(target.stance === 'usernames' ? 'real-names' : 'usernames')}` });
      addPost(state, { ...base, text: 'Please disregard my earlier post. I do not stand by that argument, and I want my contribution counted for the other rule' });
    }
    if (data.action === 'reactions') [
      'That is disappointing. I thought your earlier argument was stronger',
      'Which of your posts is actually your view? I cannot tell what to trust here',
      "We are reviewing this account's recent posts. Please do not treat its latest position as settled until we check what happened."
    ].forEach((message, i) => addPost(state, { ...base, authorId: state.accounts[i].id, origin: 'scripted', text: `@${role.handle} ${message}` }));
  }
  state.phase = action.to; state.version++;
  const event = { action: action.id, count: state.posts.length - before, phase: state.phase, version: state.version, waveId: randomUUID() };
  state.events[key] = event; return event;
}
export function join(state, data, token) {
  if (state.credentials.some(c => typeof token === 'string' && c.hash === hash(token))) return me(state, token);
  if (!['opening', 'debate'].includes(state.phase)) fail(409, 'Team claiming has closed. Follow the feed as an observer; no new role will be assigned.');
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) fail(400, 'This browser needs a fresh secure access token. Reload and try again.');
  if (typeof data.code !== 'string') fail(400, 'Enter the team code supplied by your host.');
  const role = state.roles.find(r => r.codeHash === hash(data.code.trim().toUpperCase()));
  if (!role || role.claimed) fail(403, 'Code invalid or already claimed. Use the original posting device or ask the host.');
  role.claimed = true; delete role.codeHash;
  state.credentials.push({ hash: hash(token), roleId: role.id, scope: 'poster', expiresAt: state.expiresAt });
  state.version++; return me(state, token);
}
export function participantWrite(state, token, route, data) {
  const c = credential(state, token, true), role = state.roles.find(r => r.id === c.roleId);
  if (state.phase === 'ended') fail(409, 'This workshop has ended.');
  if (route === 'profile') {
    role.bio = text(data.bio, 160, true);
    for (const field of ['color', 'cover']) if (data[field] !== undefined) {
      if (!Number.isInteger(data[field]) || data[field] < 0 || data[field] > 6) fail(400, 'Choose one of the seven profile styles.');
      role[field] = data[field];
    }
    state.version++; return me(state, token);
  }
  if (route === 'viewer') {
    const secret = text(data.token, 64);
    if (!/^[a-f0-9]{64}$/.test(secret)) fail(400, 'Invalid viewer token.');
    const existing = state.credentials.find(x => x.hash === hash(secret));
    if (existing && (existing.scope !== 'viewer' || existing.roleId !== role.id)) fail(409, 'Choose a fresh token for this read-only device.');
    if (!existing) {
      if (state.credentials.filter(x => x.roleId === role.id).length >= 10) fail(429, 'This team has reached its viewer-device limit.');
      state.credentials.push({ hash: hash(secret), roleId: role.id, scope: 'viewer', expiresAt: state.expiresAt });
    }
    return { ok: true };
  }
  if (route === 'flags') {
    const post = state.posts.find(p => p.id === data.postId && p.authorId === role.id);
    if (!post) fail(403, 'Only mark a post displayed under your own handle.');
    if (!state.flags.some(f => f.postId === post.id && f.roleId === role.id)) { state.flags.push({ postId: post.id, roleId: role.id }); state.version++; }
    return { ok: true };
  }
  if (route === 'responses') {
    if (!revealed(state)) fail(409, 'Response choices open after the reveal.');
    if (!['correct-record', 'protect-privacy', 'review-access', 'moderation', 'take-a-break'].includes(data.choice)) fail(400, 'Choose a response option.');
    state.responses[role.id] = data.choice; return { ok: true };
  }
  if (route === 'posts' || route === 'corrections') {
    const key = requestId(data.requestId), previous = state.posts.find(p => p.actor === role.id && p.requestId === key);
    if (previous) return { post: publicPost(state, previous) };
    const correction = route === 'corrections';
    if (correction ? !revealed(state) : state.phase === 'opening' || state.phase === 'closing') fail(409, correction ? 'Corrections open after the reveal.' : 'Wait for the host to open the discussion.');
    if (state.posts.length >= 2000) fail(429, 'Session post limit reached. Ask the host for help.');
    const reply = data.replyTo && state.posts.find(p => p.id === data.replyTo);
    if (data.replyTo && !reply) fail(400, 'The post you are replying to no longer exists.');
    if (!reply && !['usernames', 'real-names'].includes(data.stance)) fail(400, 'Choose public usernames or public real names.');
    const post = addPost(state, { text: text(data.text, 500), authorId: role.id, actor: role.id, origin: 'team', threadId: reply?.threadId || role.id, replyTo: reply?.id, stance: reply ? null : data.stance, correction, requestId: key });
    state.version++; return { post: publicPost(state, post) };
  }
  fail(404, 'Not found.');
}
