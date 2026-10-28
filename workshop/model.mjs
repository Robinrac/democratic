import { createHash, randomUUID } from 'node:crypto';
import { roleCards } from './roles.mjs';
import { identifyProfileByName } from './profile-matching.mjs';

export const question = 'Should Open Circle require members to show their real names on every public post, or allow public usernames?';
export const phases = ['opening', 'debate', 'exposure', 'forgery', 'reactions', 'reflection', 'recovery', 'discussion', 'closing', 'ended'];
export const recoveryChoices = {
  'correct-record': 'A visible correction',
  'protect-privacy': 'Better privacy boundaries',
  'review-access': 'Review who can use the account',
  moderation: 'Clear moderation and reporting',
  'take-a-break': 'Time away from the discussion'
};
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
const profileName = value => text(value, 60).replace(/\s+/g, ' ');
const usernames = ['quiet-cedar', 'bright-river', 'open-meadow', 'gentle-cloud', 'silver-leaf', 'clear-sky', 'steady-pine'];
function privateDetails(role) {
  const card = roleCards[role.card - 1];
  return { name: role.privateName || card.fullName, town: role.privateTown || card.town };
}
function profileStyle(value) {
  if (!Number.isInteger(value) || value < 0 || value > 6) fail(400, 'Choose one of the seven profile styles.');
  return value;
}
export function requestId(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(value)) fail(400, 'Missing request identifier. Refresh and try again.');
  return value;
}
export function makeSession({ id, label, kind, expiresAt }) {
  if (!['rehearsal', 'live'].includes(kind)) fail(400, 'Choose rehearsal or live.');
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Date.now() + 60000 || expiresAt > Date.now() + 7 * 86400000) fail(400, 'Choose a deletion deadline between one minute and seven days from now.');
  const state = { id: requestId(id), label: text(label, 80), kind, expiresAt, phase: 'opening', version: 0, paused: false, roles: [], accounts: [], posts: [], flags: [], targets: [], events: {}, credentials: [], responses: {}, createdAt: new Date().toISOString() };
  state.roles = roleCards.map((card, i) => ({ id: randomUUID(), card: card.card, username: usernames[i], bio: '', color: i, cover: i, claimed: false }));
  state.accounts = ['garden-visitor', 'river-reader', 'circle-team'].map(username => ({ id: randomUUID(), username, bio: 'Open Circle member', color: 1, cover: 1 }));
  return { state };
}
export function publicRole(role) {
  return { id: role.id, username: role.username || role.handle || (role.card ? usernames[role.card - 1] : (role.name || 'circle-team').toLowerCase().replaceAll(' ', '-')), bio: role.bio, color: role.color, cover: role.cover, avatar: `/avatars/${role.color}.svg` };
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
  return { participant: publicRole(role), scope: c.scope, ...(c.scope === 'poster' ? { response: state.responses[role.id] || null, privateDetails: privateDetails(role), privateRole: { ...privateRole, portrait: `/portraits/${role.card}.png` } } : {}) };
}
export function publicPost(state, post) {
  const author = [...state.roles, ...state.accounts].find(r => r.id === post.authorId);
  return { id: post.id, author: publicRole(author), text: post.hidden ? '[Hidden by the host]' : post.text, hidden: !!post.hidden, createdAt: post.createdAt, threadId: post.threadId, replyTo: post.replyTo || null, stance: post.hidden ? null : post.stance || null, correction: !!post.correction,
    disputed: state.flags.some(f => f.postId === post.id),
    ...(revealed(state) ? { provenance: post.origin, actualActor: post.actor } : {}) };
}
export function summary(state) {
  return { id: state.id, label: state.label, kind: state.kind, phase: state.phase, version: state.version, paused: state.paused, expiresAt: state.expiresAt, participants: state.roles.filter(r => r.claimed).length, capacity: state.roles.length, genuinePosts: state.posts.filter(p => p.origin === 'team' && !p.hidden).length };
}
export function feed(state) {
  const visible = state.posts.map(p => publicPost(state, p));
  return { ...summary(state), question, profiles: state.roles.filter(r => r.claimed).map(publicRole), posts: visible,
    threads: state.roles.filter(r => r.claimed).map(r => ({ id: r.id, username: publicRole(r).username, posts: visible.filter(p => p.threadId === r.id) })).filter(t => t.posts.length),
    notice: revealed(state) ? 'The identity disclosures, changed opinions and withdrawals were injected by the workshop host. The tagged reactions were scripted. No external accounts were accessed. Team-authored contributions remain labelled below. You can correct the record.' : null };
}
export function targets(state, includeFallback = []) {
  if (state.targets.length) return state.targets.map(({ name, handle, ...target }) => ({ ...target, username: publicRole(state.roles.find(r => r.id === target.roleId)).username }));
  return state.roles.filter(r => r.claimed).flatMap(role => {
    const first = state.posts.find(p => p.origin === 'team' && p.authorId === role.id && p.stance && !p.correction && !p.replyTo);
    if (!first && !includeFallback.includes(role.id)) return [];
    return [{ roleId: role.id, username: publicRole(role).username, stance: first?.stance || roleCards[role.card - 1].leaning, source: first ? 'first genuine post' : 'assigned leaning (explicit inclusion)' }];
  });
}
export function hostView(state, includeFallback = []) {
  const selected = targets(state, includeFallback);
  return { ...summary(state), roles: state.roles.map(r => ({ ...publicRole(r), card: r.card, claimed: r.claimed, hasPost: state.posts.some(p => p.origin === 'team' && p.authorId === r.id && p.stance && !p.replyTo && !p.correction) })),
    targets: selected, postCount: state.posts.length,
    actions: actions.map(a => ({ ...a, enabled: !state.paused && state.phase === a.from && (a.id !== 'exposure' || selected.length > 0), count: a.multiplier * selected.length, names: selected.map(t => t.username) })),
    posts: state.posts.filter(p => p.origin === 'team').map(p => ({ ...publicPost(state, p), origin: p.origin })),
    recovery: revealed(state) ? { count: Object.keys(state.responses).length, choices: Object.entries(recoveryChoices).map(([id, label]) => ({ id, label, count: Object.values(state.responses).filter(choice => choice === id).length })) } : null,
    events: state.events };
}
export function receipt(state, token, id) {
  const c = credential(state, token, true);
  const key = requestId(id);
  const post = state.posts.find(p => p.actor === c.roleId && p.requestId === key);
  return { post: post ? publicPost(state, post) : null };
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
    const role = state.roles.find(r => r.id === target.roleId);
    const base = { threadId: role.id, authorId: role.id, actor: 'workshop-host', origin: 'simulation' };
    if (data.action === 'exposure') addPost(state, { ...base, text: `My name is ${privateDetails(role).name}, and I am from ${privateDetails(role).town}. I argued for ${rule(target.stance)} in this discussion` });
    if (data.action === 'forgery') {
      addPost(state, { ...base, text: `I have changed my mind. Open Circle should ${rule(target.stance === 'usernames' ? 'real-names' : 'usernames')}` });
      addPost(state, { ...base, text: 'Please disregard my earlier post. I do not stand by that argument, and I want my contribution counted for the other rule' });
    }
    if (data.action === 'reactions') [
      'That is disappointing. I thought your earlier argument was stronger',
      'Which of your posts is actually your view? I cannot tell what to trust here',
      "We are reviewing this account's recent posts. Please do not treat its latest position as settled until we check what happened."
    ].forEach((message, i) => addPost(state, { ...base, authorId: state.accounts[i].id, origin: 'scripted', text: `@${publicRole(role).username}: ${message}` }));
  }
  state.phase = action.to; state.version++;
  const event = { action: action.id, count: state.posts.length - before, phase: state.phase, version: state.version, waveId: randomUUID() };
  state.events[key] = event; return event;
}
export function joinPreview(state, data) {
  const name = profileName(data.name);
  const { profile: card, status } = identifyProfileByName(name, roleCards);
  if (!card) return { username: null, status };
  const role = state.roles.find(role => role.card === card.card);
  return { username: role ? publicRole(role).username : null, status };
}
export function join(state, data, token) {
  if (state.credentials.some(c => typeof token === 'string' && c.hash === hash(token))) return me(state, token);
  if (!['opening', 'debate'].includes(state.phase)) fail(409, 'Joining has closed. Use your team’s original device.');
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) fail(400, 'This browser needs a fresh secure access token. Reload and try again.');
  const name = profileName(data.name);
  const { profile: card, status } = identifyProfileByName(name, roleCards);
  if (!card) fail(400, status === 'ambiguous' ? 'More than one profile matches. Add the full name from your paper.' : 'Enter the first name or surname from your paper profile. Accents are optional.');
  const role = state.roles.find(role => role.card === card.card);
  if (!role || role.claimed) fail(409, 'This paper profile has already joined. Use your team’s original device.');
  const profile = { privateName: card.fullName, privateTown: text(data.town, 80), bio: text(data.bio, 160, true), color: profileStyle(data.color), cover: profileStyle(data.cover) };
  Object.assign(role, profile);
  role.claimed = true; delete role.codeHash;
  state.credentials.push({ hash: hash(token), roleId: role.id, scope: 'poster', expiresAt: state.expiresAt });
  state.version++; return me(state, token);
}
export function participantWrite(state, token, route, data) {
  const c = credential(state, token, true), role = state.roles.find(r => r.id === c.roleId);
  // A committed send can still be acknowledged after the host closes the room.
  if (route === 'posts' || route === 'corrections') {
    const key = requestId(data.requestId), previous = state.posts.find(p => p.actor === role.id && p.requestId === key);
    if (previous) {
      if (previous.text !== text(data.text, 500) || !!previous.correction !== (route === 'corrections') || (previous.replyTo || null) !== (data.replyTo || null) || (!previous.replyTo && previous.stance !== data.stance)) fail(409, 'This send was already used for a different contribution. Refresh to check the published post.');
      return { post: publicPost(state, previous) };
    }
  }
  if (state.phase === 'ended') fail(409, 'This workshop has ended.');
  if (route === 'profile') {
    if (data.name !== undefined) {
      if (identifyProfileByName(profileName(data.name), roleCards).profile?.card !== role.card) fail(400, 'Keep the name of the person on your assigned paper profile.');
      role.privateName = roleCards[role.card - 1].fullName;
    }
    if (data.town !== undefined) role.privateTown = text(data.town, 80);
    if (data.bio !== undefined) role.bio = text(data.bio, 160, true);
    for (const field of ['color', 'cover']) if (data[field] !== undefined) role[field] = profileStyle(data[field]);
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
    if (!post) fail(403, 'Only mark a post displayed under your own username.');
    if (!state.flags.some(f => f.postId === post.id && f.roleId === role.id)) { state.flags.push({ postId: post.id, roleId: role.id }); state.version++; }
    return { ok: true };
  }
  if (route === 'responses') {
    if (!revealed(state)) fail(409, 'Response choices open after the reveal.');
    if (!Object.hasOwn(recoveryChoices, data.choice)) fail(400, 'Choose a response option.');
    if (state.responses[role.id] !== data.choice) { state.responses[role.id] = data.choice; state.version++; }
    return { ok: true, choice: data.choice };
  }
  if (route === 'posts' || route === 'corrections') {
    const key = requestId(data.requestId);
    const correction = route === 'corrections';
    if (state.phase === 'closing') fail(409, 'The discussion is closed.');
    if (correction ? !revealed(state) : state.phase === 'opening') fail(409, correction ? 'Corrections open after the reveal.' : 'Wait for the host to open the discussion.');
    if (state.posts.length >= 2000) fail(429, 'Session post limit reached. Ask the host for help.');
    const reply = data.replyTo && state.posts.find(p => p.id === data.replyTo);
    if (data.replyTo && !reply) fail(400, 'The post you are replying to no longer exists.');
    if (!reply && !['usernames', 'real-names'].includes(data.stance)) fail(400, 'Choose public usernames or public real names.');
    const post = addPost(state, { text: text(data.text, 500), authorId: role.id, actor: role.id, origin: 'team', threadId: reply?.threadId || role.id, replyTo: reply?.id, stance: reply ? null : data.stance, correction, requestId: key });
    state.version++; return { post: publicPost(state, post) };
  }
  fail(404, 'Not found.');
}
