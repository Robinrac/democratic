import { readFile } from 'node:fs/promises';

// The existing role-card document remains the single source of participant copy.
// This module is server-only; filenames and private card text never enter public JS.
const source = await readFile(new URL('../docs/workshop-2-role-cards.md', import.meta.url), 'utf8');
const homes = [
  ['Reykjavík', 'Iceland'], ['Tórshavn', 'Faroe Islands'], ['Trondheim', 'Norway'],
  ['Mariehamn', 'Åland'], ['Umeå', 'Sweden'], ['Turku', 'Finland'], ['Tromsø', 'Norway']
];
export const roleCards = source.split(/## Card /).slice(1).map((section, i) => {
  const field = label => section.match(new RegExp('\\*\\*' + label + ':\\*\\* (.+)'))?.[1].trim().replace(/^“|”$/g, '') || '';
  return {
    card: i + 1, fullName: section.split('\n')[0].replace(/^\d+ — /, '').trim(),
    town: homes[i][0], country: homes[i][1], ageGender: field('Age, gender and home'),
    backstory: field('Who you are'), leaning: i % 2 === 0 ? 'usernames' : 'real-names',
    reason: field('Why it matters'), worry: field('What you also worry about'),
    persuade: field('What might persuade you'), suggestedBio: field('Public bio you may use'),
    suggestedPost: field('Possible first post'), question: field('A question to ask others'),
    portraitFile: section.match(/\.\.\/assets\/role-portraits\/([^)]*)/)?.[1]
  };
});
if (roleCards.length !== 7 || roleCards.some(r => !r.fullName || !r.backstory || !r.portraitFile)) throw new Error('The seven workshop role cards could not be loaded.');
