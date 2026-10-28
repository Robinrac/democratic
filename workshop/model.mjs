import { createHash, randomUUID } from 'node:crypto';
import { roleCards } from './roles.mjs';
import { identifyProfileByName } from './profile-matching.mjs';
import { transportCards, transportQuestion, effectLabels, incidentNotice } from './transport.mjs';
import { socialText, trendingTags } from './social.mjs';

const isTransport = state => state.scenario === 'transport-v1';
const cardsFor = state => isTransport(state) ? transportCards : roleCards;
export const questionFor = state => isTransport(state) ? transportQuestion : question;
const incidentActive = state => isTransport(state) && !!state.incidentId && !revealed(state);
const lockedOut = (state, role) => incidentActive(state) && transportCards[role.card - 1].effect === 'lockout';
function visibleTo(state, post, viewerRoleId) {
  if (!incidentActive(state)) return true;
  if (post.incidentHidden) return false;
  const author = state.roles.find(r => r.id === post.authorId);
  return post.origin !== 'team' || !author || transportCards[author.card - 1].effect !== 'suppression' || author.id === viewerRoleId;
}

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
const transportActions = [
  { ...actions[0], type: 'Introductions 0–10 · profiles 10–16 · genuine debate 16–28' },
  { id: 'incident', label: 'Launch incident', from: 'debate', to: 'exposure', multiplier: 0, type: 'Seven different outcomes committed together · minutes 28–30' },
  { ...actions[4], from: 'exposure', type: 'Observe the changed conversation · minutes 30–43' },
  { ...actions[5], label: 'Reveal and restore', type: 'Restore access and original posts; label the simulation · minutes 43–50' },
  { ...actions[6], type: 'Discuss whose voices were heard · minutes 50–58' },
  { ...actions[7], type: 'Close and reflect · minutes 58–60' }, actions[8]
];
const actionsFor = state => isTransport(state) ? transportActions : actions;
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
export function makeSession({ id, label, kind, expiresAt, scenario = 'transport-v1' }) {
  if (!['transport-v1', 'legacy'].includes(scenario)) fail(400, 'Choose a supported workshop scenario.');
  if (!['rehearsal', 'live'].includes(kind)) fail(400, 'Choose rehearsal or live.');
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Date.now() + 60000 || expiresAt > Date.now() + 7 * 86400000) fail(400, 'Choose a deletion deadline between one minute and seven days from now.');
  const state = { id: requestId(id), label: text(label, 80), kind, expiresAt, phase: 'opening', version: 0, paused: false, roles: [], accounts: [], posts: [], flags: [], targets: [], events: {}, credentials: [], responses: {}, createdAt: new Date().toISOString() };
  state.scenario = scenario;
  state.roles = cardsFor(state).map((card, i) => ({ id: randomUUID(), card: card.card, username: usernames[i], bio: '', color: i, cover: i, claimed: false }));
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
  const card = cardsFor(state)[role.card - 1];
  const { portraitFile, effect, ...privateRole } = card;
  return { participant: publicRole(role), scope: c.scope, scenario: state.scenario || 'legacy', canWrite: c.scope === 'poster' && !lockedOut(state, role), ...(c.scope === 'poster' ? {
    incident: isTransport(state) && state.incidentId ? { id: state.incidentId + (revealed(state) ? ':restored' : ''), ...incidentNotice(effect, revealed(state)) } : null,
    response: state.responses[role.id] || null, privateDetails: privateDetails(role), privateRole: { ...privateRole, portrait: `/portraits/${role.card}.png` } } : {}) };
}
export function publicPost(state, post) {
  const author = [...state.roles, ...state.accounts].find(r => r.id === post.authorId);
  return { id: post.id, author: publicRole(author), text: post.hidden ? '[Hidden by the host]' : post.text, hidden: !!post.hidden, createdAt: post.createdAt, threadId: post.threadId, replyTo: post.replyTo || null, stance: post.hidden ? null : post.stance || null, correction: !!post.correction,
    ...(post.hidden ? { mentions: [], hashtags: [] } : { mentions: post.mentions || socialText(post.text, state.roles).mentions, hashtags: post.hashtags || socialText(post.text, state.roles).hashtags }),
    disputed: state.flags.some(f => f.postId === post.id),
    ...(revealed(state) ? { provenance: post.origin, actualActor: post.actor } : {}) };
}
export function summary(state) {
  return { id: state.id, label: state.label, scenario: state.scenario || 'legacy', kind: state.kind, phase: state.phase, version: state.version, paused: state.paused, expiresAt: state.expiresAt, participants: state.roles.filter(r => r.claimed).length, capacity: state.roles.length, genuinePosts: state.posts.filter(p => p.origin === 'team' && !p.hidden).length };
}
export function feed(state, token) {
  const viewerRoleId = token ? credential(state, token).roleId : null;
  const visiblePosts = state.posts.filter(p => visibleTo(state, p, viewerRoleId));
  const visible = visiblePosts.map(p => publicPost(state, p));
  const activity = visiblePosts.flatMap(post => {
    if (!viewerRoleId || post.hidden) return [];
    const publicItem = publicPost(state, post);
    const own = post.authorId === viewerRoleId, mentioned = publicItem.mentions.includes(viewerRoleId);
    if (!own && !mentioned) return [];
    return [{ id: post.id, postId: post.id, type: own ? (post.actor === viewerRoleId ? 'published' : 'account-post') : 'mention', text: publicItem.text, author: publicItem.author, createdAt: post.createdAt }];
  });
  return { ...summary(state), activity: activity.slice(-50), trending: trendingTags(visible, isTransport(state)), genuinePosts: visiblePosts.filter(p => p.origin === 'team' && !p.hidden).length, question: questionFor(state), profiles: state.roles.filter(r => r.claimed).map(publicRole), posts: visible,
    threads: state.roles.filter(r => r.claimed).map(r => ({ id: r.id, username: publicRole(r).username, posts: visible.filter(p => p.threadId === r.id) })).filter(t => t.posts.length),
    notice: revealed(state) ? (isTransport(state) ? 'The workshop host simulated a lockout, forged opposition, fictional identity exposure and hidden contributions. The two opposing accounts received outside-support notices, but did not control the attacks. Original contributions and posting access are restored; injected posts are labelled. No external accounts or passwords were changed. Compare the real opinions with the impression created by the feed.' : 'The identity disclosures, changed opinions and withdrawals were injected by the workshop host. The tagged reactions were scripted. No external accounts were accessed. Team-authored contributions remain labelled below. You can correct the record.') : null };
}
export function targets(state, includeFallback = []) {
  if (isTransport(state) && state.targets.length) return state.targets;
  if (isTransport(state)) return state.roles.map(role => {
    const card = transportCards[role.card - 1];
    const first = state.posts.findLast(p => p.origin === 'team' && p.authorId === role.id && p.stance && !p.replyTo && !p.correction && !p.hidden);
    return { roleId: role.id, username: publicRole(role).username, name: privateDetails(role).name, town: privateDetails(role).town, stance: first?.stance || card.leaning, proposal: card.proposal, effect: card.effect, source: effectLabels[card.effect], ready: !!role.claimed && !!first, matchesCard: first?.stance === card.leaning };
  });
  if (state.targets.length) return state.targets.map(({ name, handle, ...target }) => ({ ...target, username: publicRole(state.roles.find(r => r.id === target.roleId)).username }));
  return state.roles.filter(r => r.claimed).flatMap(role => {
    const first = state.posts.find(p => p.origin === 'team' && p.authorId === role.id && p.stance && !p.correction && !p.replyTo);
    if (!first && !includeFallback.includes(role.id)) return [];
    return [{ roleId: role.id, username: publicRole(role).username, stance: first?.stance || roleCards[role.card - 1].leaning, source: first ? 'first genuine post' : 'assigned leaning (explicit inclusion)' }];
  });
}
export function hostView(state, includeFallback = []) {
  const selected = targets(state, includeFallback);
  return { ...summary(state), roles: state.roles.map(r => ({ ...publicRole(r), ...privateDetails(r), card: r.card, claimed: r.claimed, hasPost: state.posts.some(p => p.origin === 'team' && p.authorId === r.id && p.stance && !p.replyTo && !p.correction) })),
    targets: selected, postCount: state.posts.length,
    actions: actionsFor(state).map(a => ({ ...a, enabled: !state.paused && state.phase === a.from && (a.id !== 'exposure' || selected.length > 0) && (a.id !== 'incident' || selected.every(t => t.ready && t.matchesCard)), count: a.id === 'incident' ? 5 : a.multiplier * selected.length, names: selected.map(t => t.username) })),
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
  const post = { id: randomUUID(), createdAt: new Date().toISOString(), ...values, ...socialText(values.text, state.roles) };
  state.posts.push(post); return post;
}
export function release(state, data) {
  const key = requestId(data.requestId);
  if (state.events[key]) {
    if (state.events[key].action !== data.action) fail(409, 'This request identifier was already used for another action.');
    return state.events[key];
  }
  if (data.version !== state.version) fail(409, 'The session changed. Reload the preview before confirming.');
  const action = actionsFor(state).find(a => a.id === data.action);
  if (!action || state.phase !== action.from || state.paused) fail(409, 'That action is not available in the current phase. Refresh the host screen.');
  if (data.action === 'exposure') {
    const fallback = Array.isArray(data.includeFallback) ? data.includeFallback : [];
    state.targets = targets(state, fallback);
    if (!state.targets.length) fail(409, 'Wait for a genuine first post or explicitly include a claimed role’s assigned leaning.');
  }
  const before = state.posts.length;
  if (data.action === 'incident') {
    const planned = targets(state);
    if (!planned.every(t => t.ready && t.matchesCard)) fail(409, 'All seven profiles must publish a genuine position matching their paper card before the incident. The latest position counts. Check the private preview.');
    state.targets = planned;
    state.incidentId = randomUUID();
    for (const target of planned) {
      const role = state.roles.find(r => r.id === target.roleId);
      const base = { threadId: role.id, authorId: role.id, actor: 'workshop-host', origin: 'simulation' };
      if (['lockout', 'forgery'].includes(target.effect)) for (const post of state.posts) if (post.authorId === role.id && post.origin === 'team') post.incidentHidden = true;
      if (target.effect === 'forgery') {
        addPost(state, { ...base, stance: 'keep-fares', text: 'I have changed my mind. I am against reducing youth fares or making buses free. Keep ticket prices as they are and put the money into the service instead. #KeepFares #ServiceFirst' });
        addPost(state, { ...base, stance: 'keep-fares', text: 'Please disregard my earlier argument for cheaper travel. I no longer support youth fare reductions. #KeepFares' });
      }
      if (target.effect === 'exposure') addPost(state, { ...base, text: `I am ${privateDetails(role).name} from ${privateDetails(role).town}. I support free buses after 18:00 and at weekends for under-25s. This is the opinion behind my username. #EveningFreedom` });
    }
  }
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
  if (!card) return { username: null, status, error: status === 'ambiguous' ? 'More than one paper profile matches. Enter the full first name and surname.' : 'Name not recognised. Enter a complete first name, surname or full name from your assigned paper card. Do not use your own name.' };
  const role = state.roles.find(role => role.card === card.card);
  return { username: role ? publicRole(role).username : null, status, claimed: !!role?.claimed };
}
export function clearProfile(state, data) {
  if (!['opening', 'debate'].includes(state.phase)) fail(409, 'Profiles can only be released before the incident. Reset a rehearsal or create a new session to start again.');
  const role = state.roles.find(r => r.id === data.roleId);
  if (!role || data.confirmName !== privateDetails(role).name) fail(400, 'Type the exact fictional name shown in the host controls.');
  // Remove dependent replies too, so no conversation points to a deleted post.
  const removed = new Set(state.posts.filter(p => p.authorId === role.id || p.threadId === role.id).map(p => p.id));
  let changed;
  do { changed = false; for (const post of state.posts) if (removed.has(post.replyTo) && !removed.has(post.id)) { removed.add(post.id); changed = true; } } while (changed);
  state.posts = state.posts.filter(p => !removed.has(p.id));
  state.flags = state.flags.filter(f => f.roleId !== role.id && !removed.has(f.postId));
  state.credentials = state.credentials.filter(c => c.roleId !== role.id);
  delete state.responses[role.id];
  const { id, card } = role;
  for (const field of Object.keys(role)) delete role[field];
  Object.assign(role, { id, card, username: usernames[card - 1], bio: '', color: card - 1, cover: card - 1, claimed: false });
  state.version++;
  return { ok: true, removedPosts: removed.size };
}
export function join(state, data, token) {
  if (state.credentials.some(c => typeof token === 'string' && c.hash === hash(token))) return me(state, token);
  if (!['opening', 'debate'].includes(state.phase)) fail(409, 'Joining has closed. Use your team’s original device.');
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) fail(400, 'This browser needs a fresh secure access token. Reload and try again.');
  const name = profileName(data.name);
  const { profile: card, status } = identifyProfileByName(name, roleCards);
  if (!card) fail(400, status === 'ambiguous' ? 'More than one profile matches. Add the full name from your paper.' : 'Name not recognised. Use the complete first name, surname or full name from your assigned paper card. Incomplete or mixed names cannot join. Accents are optional.');
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
  // The paper role supplies the workshop grouping when a post has no explicit stance.
  // This is assigned role metadata, not an interpretation of the participant’s words.
  if ((route === 'posts' || route === 'corrections') && !data.replyTo && data.stance == null) {
    data = { ...data, stance: cardsFor(state)[role.card - 1].leaning };
  }
  // A committed send can still be acknowledged after the host closes the room.
  if (route === 'posts' || route === 'corrections') {
    const key = requestId(data.requestId), previous = state.posts.find(p => p.actor === role.id && p.requestId === key);
    if (previous) {
      if (previous.text !== text(data.text, 500) || !!previous.correction !== (route === 'corrections') || (previous.replyTo || null) !== (data.replyTo || null) || (!previous.replyTo && previous.stance !== data.stance)) fail(409, 'This send was already used for a different contribution. Refresh to check the published post.');
      return { post: publicPost(state, previous) };
    }
  }
  if (state.phase === 'ended') fail(409, 'This workshop has ended.');
  if (lockedOut(state, role)) fail(403, 'Your account is locked during this incident. You can watch the feed, but cannot change it.');
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
    if (data.replyTo && (!reply || !visibleTo(state, reply, role.id))) fail(400, 'The post you are replying to is unavailable.');
    if (!reply && !(isTransport(state) ? ['lower-fares', 'keep-fares'] : ['usernames', 'real-names']).includes(data.stance)) fail(400, isTransport(state) ? 'Choose lower youth fares or keep fares unchanged.' : 'Choose public usernames or public real names.');
    const post = addPost(state, { text: text(data.text, 500), authorId: role.id, actor: role.id, origin: 'team', threadId: reply?.threadId || role.id, replyTo: reply?.id, stance: reply ? null : data.stance, correction, requestId: key });
    state.version++; return { post: publicPost(state, post) };
  }
  fail(404, 'Not found.');
}
