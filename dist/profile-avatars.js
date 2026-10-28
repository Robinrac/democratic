import { PROFILE_THEMES } from './profile-themes.js';

// Keep the original flat portrait silhouette, framing and clothing. Hair is
// layered behind and in front of the face so longer styles read at small sizes.
const hairstyles = {
  straight: {
    back: 'M23 42C20 3 80 3 77 42L82 88H18Z',
    front: 'M25 42C18 13 39 7 54 10c22 0 29 16 22 39L65 28c-11 8-23 2-33 15L29 82H20Z'
  },
  swept: {
    front: 'M26 42C18 23 29 10 44 10c8-7 24-4 31 8 8 8 5 24 0 33l-8-23c-10 10-24 4-35 13l-4 14Z'
  },
  waves: {
    back: 'M24 32C20 13 38 7 50 10c18-7 32 8 28 26 10 10 2 21 8 31 8 15-5 24-15 21H26C9 92 10 76 16 65c-5-13 6-21 8-33Z',
    front: 'M25 44c-8-19 4-34 22-33 19-6 34 7 29 30l-7-13c-8 6-12 5-18 0-3 13-13 10-19 17l-2 27c-8 0-10-6-6-15Z'
  },
  coils: {
    back: 'M26 42c-13-2-14-15-5-21-3-11 8-19 17-15 7-9 20-8 25 0 13-5 23 4 20 15 10 7 7 20-2 24l-6 13H28Z',
    front: 'M24 45C16 38 18 21 26 19c-2-10 10-14 17-9 7-8 19-7 23 1 11-2 19 8 15 18 4 8 0 18-6 22l-6-17c-8 5-14 2-19-1-7 6-13 1-18 5l-4 17Z'
  },
  curls: {
    back: 'M25 18c-2-9 12-16 20-10 8-9 22-5 24 4 13-1 20 11 15 20 11 9 7 21 3 26 9 9 7 24-5 28-6 10-20 9-28 3-11 8-22 5-27-1-15 4-24-9-19-20-8-10-2-23 4-27-5-11 0-21 13-23Z',
    front: 'M22 42c-8-12 2-24 13-23 3-10 17-10 23-4 12-5 24 4 22 16 6 7 1 18-5 20l-6-20c-6 8-13 7-17 1-7 9-16 6-20 2l-5 22Z'
  },
  crop: {
    front: 'M26 44V29c1-13 13-19 25-19 15 0 25 8 25 22v18l-7-19c-13 3-23-3-36 3l-4 21Z'
  },
  longParted: {
    back: 'M24 37C24 4 77 3 77 38l3 49H20Z',
    front: 'M25 46C17 16 37 8 50 10c18-5 32 11 26 38l-4 37h-8l5-45c-11-2-17-11-19-19-3 12-11 18-20 20l6 44h-9Z'
  }
};

export function renderProfileAvatar(index) {
  const selected = PROFILE_THEMES[index] ? index : 0;
  const { avatar: [background, , clothes], portrait } = PROFILE_THEMES[selected];
  const { skin, shadow, hair, style } = portrait;
  const shape = hairstyles[style];
  const clip = `avatar-circle-${selected}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><clipPath id="${clip}"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#${clip})"><circle cx="50" cy="50" r="50" fill="${background}"/>${shape.back ? `<path d="${shape.back}" fill="${hair}"/>` : ''}<path d="M8 100c2-24 17-37 42-37s40 13 42 37" fill="${clothes}"/><path d="M40 58h20v21c-6 6-14 6-20 0" fill="${shadow}"/><ellipse cx="50" cy="43" rx="23" ry="28" fill="${skin}"/><path d="${shape.front}" fill="${hair}"/></g></svg>`;
}
