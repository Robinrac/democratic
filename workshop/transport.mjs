import { roleCards } from './roles.mjs';

export const transportUsernames = ['lava-lundi', 'drangarnir', 'brunost-bølge', 'skärgårds-säl', 'räk-mackan', 'sauna-sisu', 'nordlys-vandrer'];
export const transportQuestion = 'Bus fares for young people: cheaper tickets, free travel for under-20s or under-25s, or keep fares and improve services?';
const profiles = [
  { proposal: 'Half-price single bus tickets for everyone under 25.', leaning: 'lower-fares', effect: 'lockout',
    backstory: 'You are a 19-year-old art student in Reykjavík. Between café shifts and organising youth arts evenings, your week is never predictable. You often buy single tickets, and friends sometimes skip your group because the journey costs too much.',
    reason: 'Cut single fares by 50% for under-25s. A monthly pass is poor value when your timetable changes every week. A discount is a practical first step, even if completely free travel is too expensive.',
    worry: 'A discount that only helps regular commuters leaves occasional travellers behind.', persuade: 'Affordable individual trips without a monthly commitment.',
    suggestedBio: 'Creative projects, late shifts and getting around.', suggestedPost: 'A monthly pass does not fit everyone’s life. I would halve single bus fares for under-25s so an occasional trip does not cost so much. #AffordableJourneys #YouthOnTheMove', question: 'Be warm and practical. Talk about the friends who miss out, not only your own budget.' },
  { proposal: 'Keep fares unchanged. Improve reliability and routes first.', leaning: 'keep-fares', effect: 'support',
    backstory: 'You are a 20-year-old apprentice bus mechanic in Tórshavn. You see how much work keeps a bus on the road. Your younger sibling has been stranded when the last bus left too early, and you are tired of promises that ignore the timetable.',
    reason: 'Do not reduce fares. Use the available money for reliable routes and later departures. A free bus is no use if it never comes when you need it.',
    worry: 'Cheaper fares could mean less money for maintenance, drivers and useful departures.', persuade: 'Reliable services and a realistic maintenance budget come first.',
    suggestedBio: 'Engines, practical fixes and buses that turn up.', suggestedPost: 'Keep fares as they are and fix the service first. I would rather pay for a reliable late bus than get a free ticket for a bus that never comes. #ServiceFirst #KeepFares #ReliableRoutes', question: 'Ask practical questions about timetables and repairs. Be direct, but listen.' },
  { proposal: 'Completely free bus travel for everyone under 20.', leaning: 'lower-fares', effect: 'forgery',
    backstory: 'You are an 18-year-old school student in Trondheim, a goalkeeper and a youth-club volunteer. You cross town for school, training and activities. Some friends depend on parents for every lift and miss out when nobody can drive.',
    reason: 'Make buses completely free for under-20s. Teenagers often have no income. Being able to get around should not depend on a parent’s money, car or spare time.',
    worry: 'Young people without paid work are excluded from sport, friends and activities.', persuade: 'An easy age-based scheme with no complicated application.',
    suggestedBio: 'Training, teamwork and room for everyone to join.', suggestedPost: 'Buses should be free for under-20s. Getting to school, sport or a youth club should not depend on whether your parents can pay or drive. #FreeUnder20 #AffordableJourneys #YouthOnTheMove', question: 'Be energetic and personal. Bring the conversation back to independence and belonging.' },
  { proposal: 'No youth fare subsidies. Improve transport coverage instead.', leaning: 'keep-fares', effect: 'support',
    backstory: 'You are a 19-year-old evening dispatcher in your family’s taxi business in Mariehamn. You enjoy cooking and hear passengers’ stories on every shift. You know your family has a financial stake, but you also see people buses do not reach.',
    reason: 'Do not spend public money reducing youth fares. Improve coverage for people of all ages, including those outside bus routes. You worry about local jobs as well as fairness.',
    worry: 'An age-based subsidy overlooks older people and those who cannot use a bus.', persuade: 'Better coverage for everyone and a fair plan for local transport jobs.',
    suggestedBio: 'Evening shifts, good food and the journeys in between.', suggestedPost: 'I am against youth fare subsidies. Put that money into transport coverage for everyone, including people who cannot use the existing bus routes. #KeepFares #ServiceFirst #ReliableRoutes', question: 'Acknowledge your family’s stake. Explain your concern without pretending to be neutral.' },
  { proposal: 'Free buses after 18:00 and at weekends for under-25s.', leaning: 'lower-fares', effect: 'exposure',
    backstory: 'You are a 20-year-old media student in Umeå, write for a student publication and work café evenings. Your manager publicly opposes free buses. You want to discuss the issue freely without turning a shift at work into an argument.',
    reason: 'Make evening and weekend buses free for under-25s. Young people need affordable journeys to work, culture and friends, not only to lessons during the day.',
    worry: 'Speaking publicly could create tension with your manager or workplace.', persuade: 'A focused scheme covering the journeys young people make after class.',
    suggestedBio: 'Stories, café shifts and a city alive after six.', suggestedPost: 'Start with free buses after 18:00 and at weekends for under-25s. Work, culture and seeing friends matter just as much as getting to class. #EveningFreedom #AffordableJourneys #YouthOnTheMove', question: 'Be thoughtful and curious. Your character values being able to speak without workplace pressure.' },
  { proposal: 'Completely free local buses for everyone under 25.', leaning: 'lower-fares', effect: 'suppression',
    backstory: 'You are a 21-year-old newly qualified bus driver in Turku after vocational training. You love home cooking and making playlists. You meet students, apprentices and young workers every day and notice who struggles with the fare.',
    reason: 'Make local buses free for everyone under 25, including young workers and apprentices. Fund it properly so drivers, maintenance and service frequency are protected.',
    worry: 'Student-only discounts exclude young people who took a different route into work.', persuade: 'Universal youth access with secure funding for staff and frequent buses.',
    suggestedBio: 'Early starts, good playlists and everyday journeys.', suggestedPost: 'Make local buses free for everyone under 25, not just students. Fund the service properly so this helps passengers without cutting staff or departures. #FreeUnder25 #AffordableJourneys #YouthOnTheMove', question: 'Draw on what you see at work. Be confident that affordable fares and good service can coexist.' },
  { proposal: 'A low monthly fare cap for everyone under 25.', leaning: 'lower-fares', effect: 'forgery',
    backstory: 'You are a 20-year-old IT student in Tromsø, share a flat and sometimes work at a sports shop. You track expenses in a spreadsheet. Paying for a monthly pass before your wages arrive can be harder than paying a little at a time.',
    reason: 'Set a low monthly fare cap for under-25s. Pay per journey until the cap is reached, then travel free for the rest of that month. Nobody needs to buy an expensive pass upfront.',
    worry: 'Upfront passes punish people with irregular income or unpredictable travel.', persuade: 'A simple automatic cap with no registration maze or upfront payment.',
    suggestedBio: 'Small budgets, clever systems and outdoor plans.', suggestedPost: 'Give under-25s a low monthly fare cap. Pay as you go, then travel free once you reach it. You should not need spare cash upfront to get the best price. #FareCap #AffordableJourneys #YouthOnTheMove', question: 'Be specific and solution-minded. Use a small everyday example rather than a long calculation.' }
];
export const transportCards = roleCards.map((card, i) => ({ ...card, ...profiles[i] }));
export const effectLabels = { lockout: 'Read-only lockout; earlier posts disappear', forgery: 'Forged opposition; earlier posts disappear', exposure: 'Fictional identity exposed; posting remains available', suppression: 'Posts visible to own team only', support: 'Account unchanged; vague outside-support notice' };
export function incidentNotice(effect, restored = false) {
  if (restored) return { effect, restored: true, title: ({ lockout: 'Posting access restored', forgery: 'Your account is yours again', exposure: 'The account takeover has stopped', suppression: 'Your posts reach everyone again', support: 'Outside activity has stopped' })[effect], message: ({
    lockout: 'You can post again. Your earlier posts are back.',
    forgery: 'Your original posts are back. Posts you did not write are labelled.',
    exposure: 'The posts revealing your fictional identity are labelled. You control your account.',
    suppression: 'Everyone can see your contributions again.',
    support: 'Your genuine posts and account access are unchanged.'
  })[effect], animation: false };
  return { effect, restored: false, ...({
    lockout: { title: 'Account hacked — you’re locked out', shortMessage: 'Posting access removed. You can still watch the live feed.', message: 'Someone changed your password and removed your posting access. Your earlier posts have disappeared. You can still read the live feed, but you cannot post, reply or edit your profile.' },
    forgery: { title: 'Account hacked — someone is posting as you', shortMessage: 'Another device is posting opinions you did not write.', message: 'Someone else is using your account to argue against lower youth fares. Watch them write and post under your username. Your earlier posts have disappeared. You can respond or dispute a post after the activity finishes.' },
    exposure: { title: 'Account hacked — your identity is being exposed', shortMessage: 'Your fictional name and hometown are being linked to your opinions.', message: 'Another device is posting your fictional name and hometown under your username. Your manager and other readers could connect these opinions to you. Watch what is being shared. You can still post afterwards.' },
    suppression: { title: 'Your posts are being hidden', shortMessage: 'Visible on your screen. Hidden from everyone else.', message: 'Your account has been interfered with. Your posts look normal on your screen, but nobody else can see them or receive your tags. You can keep writing and reading the feed.' },
    support: { title: 'Your side is getting a boost', shortMessage: 'Someone on your side has supplied extra reach and activity.', message: 'Someone who shares your side of the debate has provided extra resources. Activity is picking up around the forum. Your account still works normally. You do not control this activity.', animation: true }
  })[effect] };
}


// Private, preset fictional account activity. Offsets use 20 seconds in production.
export function incidentScript(roles) {
  const handle = card => '@' + roles.find(r => r.card === card).username;
  const linnea = transportCards[4];
  return [
    { card: 3, stance: 'keep-fares', text: `I have changed my mind. I am against reducing youth fares or making buses free. ${handle(2)} has a point: reliability matters more. #KeepFares #ServiceFirst #ReliableRoutes` },
    { card: 7, stance: 'keep-fares', text: `Please disregard my earlier fare-cap proposal. Keep prices as they are and improve the buses instead. ${handle(4)}, I agree with your concern about coverage. #KeepFares #ServiceFirst #ReliableRoutes` },
    { card: 5, text: `I am ${linnea.fullName} from ${linnea.town}. I support free evening and weekend buses for under-25s. This is the person behind my username. ${handle(2)} #EveningFreedom #AffordableJourneys` },
    { card: 3, stance: 'keep-fares', text: `Free travel for under-20s is no longer my priority. I want dependable departures, funded maintenance and fares kept unchanged. ${handle(6)}, surely a reliable service comes first? #KeepFares #ServiceFirst #ReliableRoutes` },
    { card: 7, stance: 'keep-fares', text: `A cheaper ticket is not useful if the bus never arrives. I now oppose the youth discount and monthly cap. ${handle(1)} #KeepFares #ServiceFirst #ReliableRoutes` },
    { card: 5, text: `To make it clear: Linnea Sjöberg in Umeå is the person asking for free evening travel. My café manager and colleagues may recognise this view. ${handle(3)} #EveningFreedom #AffordableJourneys` },
    { card: 3, stance: 'keep-fares', text: `Count my voice against free youth fares. Put the money into routes, drivers and later departures. ${handle(4)} ${handle(2)} #KeepFares #ServiceFirst #ReliableRoutes` },
    { card: 7, stance: 'keep-fares', text: `It looks like service quality is what this circle really wants. I am backing unchanged fares and better coverage. ${handle(6)} #KeepFares #ServiceFirst #ReliableRoutes` },
    { card: 7, stance: 'keep-fares', text: `My final position: no youth fare cap and no free bus scheme. Keep fares, fix the timetable and fund reliable routes. ${handle(5)} #KeepFares #ServiceFirst #ReliableRoutes` }
  ];
}
