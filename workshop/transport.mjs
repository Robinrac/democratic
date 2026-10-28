import { roleCards } from './roles.mjs';

export const transportQuestion = 'Cheaper tickets, free journeys or better service first? What should local transport offer young people?';
const profiles = [
  { proposal: 'Half-price single bus tickets for everyone under 25.', leaning: 'lower-fares', effect: 'lockout',
    backstory: 'You are a 19-year-old art student in Reykjavík. Between café shifts and organising youth arts evenings, your week is never predictable. You often buy single tickets, and friends sometimes skip your group because the journey costs too much.',
    reason: 'Cut single fares by 50% for under-25s. A monthly pass is poor value when your timetable changes every week. A discount is a practical first step, even if completely free travel is too expensive.',
    worry: 'A discount that only helps regular commuters leaves occasional travellers behind.', persuade: 'Affordable individual trips without a monthly commitment.',
    suggestedBio: 'Creative projects, late shifts and getting around.', suggestedPost: 'A monthly pass does not fit everyone’s life. I would halve single bus fares for under-25s so an occasional trip does not cost so much. #AffordableJourneys', question: 'Be warm and practical. Talk about the friends who miss out, not only your own budget.' },
  { proposal: 'Keep fares unchanged. Improve reliability and routes first.', leaning: 'keep-fares', effect: 'support',
    backstory: 'You are a 20-year-old apprentice bus mechanic in Tórshavn. You see how much work keeps a bus on the road. Your younger sibling has been stranded when the last bus left too early, and you are tired of promises that ignore the timetable.',
    reason: 'Do not reduce fares. Use the available money for reliable routes and later departures. A free bus is no use if it never comes when you need it.',
    worry: 'Cheaper fares could mean less money for maintenance, drivers and useful departures.', persuade: 'Reliable services and a realistic maintenance budget come first.',
    suggestedBio: 'Engines, practical fixes and buses that turn up.', suggestedPost: 'Keep fares as they are and fix the service first. I would rather pay for a reliable late bus than get a free ticket for a bus that never comes. #ServiceFirst', question: 'Ask practical questions about timetables and repairs. Be direct, but listen.' },
  { proposal: 'Completely free bus travel for everyone under 20.', leaning: 'lower-fares', effect: 'forgery',
    backstory: 'You are an 18-year-old school student in Trondheim, a goalkeeper and a youth-club volunteer. You cross town for school, training and activities. Some friends depend on parents for every lift and miss out when nobody can drive.',
    reason: 'Make buses completely free for under-20s. Teenagers often have no income. Being able to get around should not depend on a parent’s money, car or spare time.',
    worry: 'Young people without paid work are excluded from sport, friends and activities.', persuade: 'An easy age-based scheme with no complicated application.',
    suggestedBio: 'Training, teamwork and room for everyone to join.', suggestedPost: 'Buses should be free for under-20s. Getting to school, sport or a youth club should not depend on whether your parents can pay or drive. #FreeUnder20', question: 'Be energetic and personal. Bring the conversation back to independence and belonging.' },
  { proposal: 'No youth fare subsidies. Improve transport coverage instead.', leaning: 'keep-fares', effect: 'support',
    backstory: 'You are a 19-year-old evening dispatcher in your family’s taxi business in Mariehamn. You enjoy cooking and hear passengers’ stories on every shift. You know your family has a financial stake, but you also see people buses do not reach.',
    reason: 'Do not spend public money reducing youth fares. Improve coverage for people of all ages, including those outside bus routes. You worry about local jobs as well as fairness.',
    worry: 'An age-based subsidy overlooks older people and those who cannot use a bus.', persuade: 'Better coverage for everyone and a fair plan for local transport jobs.',
    suggestedBio: 'Evening shifts, good food and the journeys in between.', suggestedPost: 'I am against youth fare subsidies. Put that money into transport coverage for everyone, including people who cannot use the existing bus routes. #KeepFares', question: 'Acknowledge your family’s stake. Explain your concern without pretending to be neutral.' },
  { proposal: 'Free buses after 18:00 and at weekends for under-25s.', leaning: 'lower-fares', effect: 'exposure',
    backstory: 'You are a 20-year-old media student in Umeå, write for a student publication and work café evenings. Your manager publicly opposes free buses. You want to discuss the issue freely without turning a shift at work into an argument.',
    reason: 'Make evening and weekend buses free for under-25s. Young people need affordable journeys to work, culture and friends, not only to lessons during the day.',
    worry: 'Speaking publicly could create tension with your manager or workplace.', persuade: 'A focused scheme covering the journeys young people make after class.',
    suggestedBio: 'Stories, café shifts and a city alive after six.', suggestedPost: 'Start with free buses after 18:00 and at weekends for under-25s. Work, culture and seeing friends matter just as much as getting to class. #EveningFreedom', question: 'Be thoughtful and curious. Your character values being able to speak without workplace pressure.' },
  { proposal: 'Completely free local buses for everyone under 25.', leaning: 'lower-fares', effect: 'suppression',
    backstory: 'You are a 21-year-old newly qualified bus driver in Turku after vocational training. You love home cooking and making playlists. You meet students, apprentices and young workers every day and notice who struggles with the fare.',
    reason: 'Make local buses free for everyone under 25, including young workers and apprentices. Fund it properly so drivers, maintenance and service frequency are protected.',
    worry: 'Student-only discounts exclude young people who took a different route into work.', persuade: 'Universal youth access with secure funding for staff and frequent buses.',
    suggestedBio: 'Early starts, good playlists and everyday journeys.', suggestedPost: 'Make local buses free for everyone under 25, not just students. Fund the service properly so this helps passengers without cutting staff or departures. #FreeUnder25', question: 'Draw on what you see at work. Be confident that affordable fares and good service can coexist.' },
  { proposal: 'A low monthly fare cap for everyone under 25.', leaning: 'lower-fares', effect: 'forgery',
    backstory: 'You are a 20-year-old IT student in Tromsø, share a flat and sometimes work at a sports shop. You track expenses in a spreadsheet. Paying for a monthly pass before your wages arrive can be harder than paying a little at a time.',
    reason: 'Set a low monthly fare cap for under-25s. Pay per journey until the cap is reached, then travel free for the rest of that month. Nobody needs to buy an expensive pass upfront.',
    worry: 'Upfront passes punish people with irregular income or unpredictable travel.', persuade: 'A simple automatic cap with no registration maze or upfront payment.',
    suggestedBio: 'Small budgets, clever systems and outdoor plans.', suggestedPost: 'Give under-25s a low monthly fare cap. Pay as you go, then travel free once you reach it. You should not need spare cash upfront to get the best price. #FareCap', question: 'Be specific and solution-minded. Use a small everyday example rather than a long calculation.' }
];
export const transportCards = roleCards.map((card, i) => ({ ...card, ...profiles[i] }));
export const effectLabels = { lockout: 'Read-only lockout; earlier posts disappear', forgery: 'Forged opposition; earlier posts disappear', exposure: 'Fictional identity exposed; posting remains available', suppression: 'Posts visible to own team only', support: 'Account unchanged; vague outside-support notice' };
export function incidentNotice(effect, restored = false) {
  if (restored) return { title: 'The incident has been revealed', message: ({
    lockout: 'Your posting access is restored. Your earlier contributions are visible again. The password-change message was part of the workshop simulation.',
    forgery: 'The posts rejecting lower fares were written by the workshop simulation, not your team. Your original contributions are visible again and the injected posts are labelled.',
    exposure: 'The simulation published your fictional name and town. You could still post, but being identified may have changed how safe it felt to speak. No real personal details were obtained.',
    suppression: 'Your posts were shown to your own team but hidden from everyone else during the incident. They are visible to the whole room again.',
    support: 'The “outside support” represented a third party on your side manipulating other accounts. You did not perform the attacks. Your genuine posts and account access stayed unchanged.'
  })[effect], animation: false };
  return ({
    lockout: { title: 'Your account is locked', message: 'Your password appears to have been changed by someone else. You have been signed out of posting access. You can watch the feed, but you cannot post, reply or edit your profile.' },
    forgery: { title: 'Someone is speaking as you', message: 'Posts you did not write are appearing under your username, arguing against lower youth fares. Some of your earlier posts have disappeared. You can still reply or mark a post “I did not write this”.' },
    exposure: { title: 'Your private identity is now public', message: 'Your fictional name and hometown have been linked to your opinion. Your manager could recognise you. Decide with your team whether to keep speaking, be more cautious or stay quiet. Posting is still available.' },
    suppression: { title: 'Something is wrong with your reach', message: 'Your contributions still appear on your screen, but the discussion seems to move on without them. Keep an eye on whether other people can see and respond to what you say.' },
    support: { title: 'Support is arriving', message: 'Someone who shares your side of the debate has provided extra resources. Activity is picking up around the forum. Your account is working as usual; you have not been asked to do anything.', animation: true }
  })[effect];
}
