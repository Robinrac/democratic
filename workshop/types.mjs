import { identifyProfileByName, normalizeProfileName } from './profile-matching.mjs';

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
export function identifyAssociation(value) {
  const { status, profile } = identifyProfileByName(organizationName(value), associations.map(association => ({ ...association, fullName: organizationName(association.name) })));
  return { status, association: profile ? associations.find(association => association.card === profile.card) : null };
}
