/* Profile header and navigation adapted from Munia's ProfileHeader.tsx and
 * MenuBar.tsx (revision 577868b63adf2b3d61e25809bd665f8c7687c141).
 * Copyright (c) 2023 Leandro Norcio. MIT: ./vendor/MUNIA-LICENSE.txt.
 * React components ported to HTML templates for this workshop's small runtime.
 */
import { PROFILE_THEMES } from './profile-themes.js';
export const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
export const handle = person => person.name.toLowerCase().replaceAll(' ', '_');
export function icon(name) {
  const paths = {
    feed:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    discover:'<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
    profile:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3z"/>',
    edit:'<path d="m16 3 5 5-12 12-6 1 1-6zM13 6l5 5"/>',
    cover:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8" cy="9" r="1"/><path d="m4 17 5-5 4 4 3-3 5 5"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.profile}</svg>`;
}
export function avatar(person) {
  const colors = (PROFILE_THEMES[person.color] || PROFILE_THEMES[0]).avatar;
  return `<span class="avatar portrait" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${colors[0]}"/><path d="M8 100c2-24 17-37 42-37s40 13 42 37" fill="${colors[2]}"/><path d="M40 58h20v21c-6 6-14 6-20 0" fill="#D69E88"/><ellipse cx="50" cy="43" rx="23" ry="28" fill="#F2C6AE"/><path d="M26 43C15 12 43 7 57 12c21 4 27 19 18 39l-8-22c-10 8-25 0-34 12v15z" fill="${colors[1]}"/></svg></span>`;
}
export function menu(view, me) {
  return `<nav class="social-nav" aria-label="Main navigation">${[
    {title:'Feed',key:'feed',route:'#feed'},
    {title:'Discover',key:'discover',route:'#discover'},
    {title:'My Profile',key:'profile',route:'#profile'}
  ].map(item => `<a href="${item.route}" ${view === item.key ? 'aria-current="page"' : ''}>${icon(item.key)}<span>${item.title}</span></a>`).join('')}</nav>
  ${me ? `<a href="#profile" class="nav-identity">${avatar(me)}<span><strong>${escape(me.name)}</strong><small>@${escape(handle(me))}</small></span></a>` : ''}
  <div class="sidebar-about"><span class="eyebrow">WORKSHOP 02</span><h2>Who speaks for you?</h2><p>Privacy. Identity.<br>Freedom to participate.</p></div>`;
}
export function profileHeader(profile, own, postCount, members, tab) {
  // Retains Munia's cover > overlapping photo > action > identity > stats > tabs hierarchy.
  return `<section class="profile-header" aria-label="${escape(profile.name)}'s profile">
    <div class="profile-art"><div class="profile-cover cover-${profile.cover || 0}"><span class="cover-orbit orbit-one"></span><span class="cover-orbit orbit-two"></span><span class="cover-caption">YOUR VOICE.<br>YOUR SPACE.</span>${own ? `<button class="cover-edit" data-edit-profile aria-label="Change cover style">${icon('cover')}</button>` : ''}</div>
      <div class="profile-photo">${avatar(profile)}</div>
      ${own ? '<button class="edit-profile" data-edit-profile>Edit Profile</button>' : '<span class="profile-visitor">Workshop participant</span>'}
    </div>
    <div class="profile-info"><h1>${escape(profile.name)}</h1><p class="profile-handle">@${escape(handle(profile))}</p><p class="profile-bio">${escape(profile.bio || 'No bio yet.')}</p>
      <div class="profile-stats"><span><strong>${postCount}</strong> ${postCount === 1 ? 'Post' : 'Posts'}</span><span aria-hidden="true">·</span><a href="#discover"><strong>${members}</strong> in this workshop</a></div>
      <nav class="profile-tabs" aria-label="Profile sections"><button data-profile-tab="posts" ${tab === 'posts' ? 'aria-current="page"' : ''}>Posts</button><button data-profile-tab="about" ${tab === 'about' ? 'aria-current="page"' : ''}>About</button></nav>
    </div></section>`;
}
