import { normalizeProfileName } from './profile-matching.mjs';

export const workshopTypes = [
  { id: 'workshop-2', title: 'Hacked: Who Speaks for You?', number: 2 },
  { id: 'workshop-1', title: 'Manipulated: Hijacked Message, Changed Decision?', number: 1 }
];

// Sessions saved before workshop selection was added belong to Workshop 2.
export const workshopType = state => state.workshopType ?? 'workshop-2';
export const isWorkshopOne = state => workshopType(state) === 'workshop-1';
export const workshopTitle = state => workshopTypes.find(item => item.id === workshopType(state)).title;
export const workshopOneQuestion = 'What happens to democracy when digital information and systems affect whose voices are heard?';

// The host receives the roster; join preview returns only one matching association.
export const associations = [
  { card: 1, name: 'The Creative & Cultural Collective', members: 180 },
  { card: 2, name: 'The Suburban & Rural Youth Network', members: 240 },
  { card: 3, name: 'The Local Sports Alliance', members: 350 },
  { card: 4, name: 'The Gaming & Tech Society', members: 210 },
  { card: 5, name: 'The Student Union & Youth Council', members: 300 },
  { card: 6, name: 'The Environmental & Climate Action Group', members: 160 }
].map(association => ({ ...association, banner: `/association-banners/${association.card}.png` }));

const organizationName = value => normalizeProfileName(value).split(' ').filter(word => word && word !== 'the' && word !== 'and').join(' ');
// Keep a unique organization preview while the last word is still being typed.
// Workshop 2 paper-person matching remains strict about complete name parts.
export function identifyAssociation(value) {
  const name = organizationName(value);
  if (!name) return { status: 'empty', association: null };
  const parts = name.split(' ');
  const matches = associations.filter(association => {
    const remaining = organizationName(association.name).split(' ');
    let complete = 0;
    for (const [index, part] of parts.entries()) {
      let found = remaining.indexOf(part);
      if (found >= 0) complete++;
      else if (index === parts.length - 1 && complete > 0) found = remaining.findIndex(word => word.startsWith(part));
      if (found < 0) return false;
      remaining.splice(found, 1);
    }
    return complete > 0;
  });
  return { status: matches.length === 1 ? 'matched' : matches.length ? 'ambiguous' : 'unmatched', association: matches.length === 1 ? matches[0] : null };
}
