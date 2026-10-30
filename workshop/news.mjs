import { associations } from './types.mjs';

// Server-only editorial edition. Source positions guide fictional reporting;
// audiences and framing notes belong exclusively in the facilitator view.
export const newsEdition = 'lindvik-morning-1';
export const newsImages = {
  arts: { src: '/news-media/arts.png', alt: 'Young musicians sharing a cramped rehearsal room filled with instruments and stacked chairs.' },
  bus: { src: '/news-media/bus.png', alt: 'Two young adults waiting at a rural bus shelter at dusk.' },
  sports: { src: '/news-media/sports.png', alt: 'A young basketball coach and players with well-used equipment in a local sports hall.' },
  gaming: { src: '/news-media/gaming.png', alt: 'Friends building a small robot beside computers at a pop-up gaming evening.' },
  students: { src: '/news-media/students.png', alt: 'Students discussing their work around a busy library table.' },
  climate: { src: '/news-media/climate.png', alt: 'Community volunteers repairing a wooden chair beside a garden greenhouse.' },
  cat: { src: '/news-media/cat.png', alt: 'A ginger cat sitting in an empty pastry box on a bakery counter.' }
};
const common = [1, 2, 3, 4, 5, 6];
const article = (id, audiences, category, publisher, author, time, title, summary, image, body, framing, extra = {}) => ({
  id, audiences, category, publisher, author, time, title, summary, image: newsImages[image] || null,
  body, framing, readMinutes: Math.max(1, Math.ceil(body.join(' ').split(/\s+/).length / 180)), ...extra
});
export const newsArticles = [
  article('arts-home', [1], 'Reporting', 'After Hours', 'Maja Sol', '09:42',
    'Their rehearsal ends when the caretaker needs the corridor',
    'For Lindvik’s young performers, a permanent home would mean more than a better stage.', 'arts', [
      'At half past seven, the band begins packing. The corridor is booked for cleaning, and the drum kit has to fit back into two cars. Singer Liv Holm says the group now spends almost as much time arranging rooms as rehearsing.',
      'The proposed central youth center would give creative groups a place to meet regularly. Supporters imagine shared rehearsal rooms, storage and a small performance space, replacing a weekly search for somebody else’s spare room. The final room list has not been approved.',
      'The proposal would commit 80% of the municipal youth budget for five years. Liv calls that a serious investment, but says short-term room hire has a cost too: “You cannot build a scene if every session starts with finding a key.”'
    ], 'Leans For: an intimate account of an immediate problem makes the building feel like the obvious remedy; lost grants receive little attention.'),
  article('arts-opinion', [1], 'Opinion', 'After Hours', 'Liv Holm · musician', '09:15',
    'Stop asking us to be creative about having nowhere to go',
    'A city that celebrates young talent should give it an address, argues musician Liv Holm.', null, [
      'We are told to organize something, start a band, put on a show. We do. Then we are told the room is unavailable, the sound is too loud or the equipment cannot stay overnight. Being resourceful has become a condition of being allowed to participate.',
      'A center would not write a song for anyone. It would make it easier to turn up again next week. That continuity matters to the person who has never performed before as much as to the group already selling tickets.',
      'I support the proposal because scattered small fixes have left us without a home. Five years is a long commitment. So is spending another five years carrying a keyboard from one borrowed room to the next. This is my argument for the center, not a promise that every detail is settled.'
    ], 'Leans For: a named voice creates identification and presents continued fragmentation as the main alternative.', { quote: 'Being resourceful should not be the entry fee for taking part.' }),
  article('arts-space', [1], 'Analysis', 'Lindvik Ledger', 'Nora Vale', '08:50',
    'One rehearsal room, many beginnings',
    'Shared equipment could open doors for creators who cannot buy their own.', 'arts', [
      'A microphone is inexpensive compared with a building. But a microphone also needs a quiet room, storage, someone who can help and hours when people are free to use it. Organizers arguing for the youth center say those things work better together.',
      'Their suggested model combines a bookable rehearsal space with open studio evenings and an equipment cupboard. Beginners could try recording or performance without buying a complete setup first. These are requests from local creators, not confirmed purchases.',
      'The challenge will be who gets access. A center that mainly serves established groups could reproduce the same barriers in a smarter building. A transparent booking system and genuinely open sessions would matter as much as the front door.'
    ], 'Leans For with a small caveat: makes potential benefits concrete while leaving the opportunity cost abstract.'),
  article('arts-debate', [1], 'Debate', 'The Common Room', 'A conversation edited by Asta Reed', '08:10',
    'A home for culture, or a very expensive key?',
    'Two young organizers agree that space matters. They disagree on how to pay for it.', null, [
      'FOR A SHARED HOME · Organizer Edda says a single reliable venue could let dance, music and visual art overlap. “A borrowed classroom disappears when someone else needs it. A home lets a project grow.” She wants the center to include free introductory sessions.',
      'FOR SMALLER SPACES · Pop-up organizer Malte would put more money into existing rooms. “If most of the budget goes to one address, we need to ask who can actually get there.” He argues that culture also happens in neighborhoods far from the center.',
      'Both want affordable creative space. The decision is about whether committing 80% of the youth budget for five years to one facility is the best route. Neither a detailed booking policy nor a complete alternative plan has yet been agreed.'
    ], 'A counterpoint in a mostly supportive feed; For gets the first and more concrete voice.'),

  article('rural-last-bus', [2], 'Reporting', 'Outer Ring', 'Emil Strand', '09:40',
    'A new youth center. The same last bus home.',
    'An evening in the city can finish long after the route back to the villages does.', 'bus', [
      'For Signe, joining an evening activity means checking the journey home before the event itself. Her village has limited weekend buses. If an activity runs late, a lift from family can become the difference between joining in and staying away.',
      'The proposed youth center would be in the city center. The building proposal does not itself guarantee later buses, cheaper fares or support for journeys from the outer communities. Transport would need its own arrangements.',
      'With 80% of the youth budget committed for five years, rural organizers worry that the small local hubs people can already reach will have less room to grow. “A door can be open,” Signe says, “and still be very far away.”'
    ], 'Leans Against: foregrounds access and makes downtown investment feel exclusionary.'),
  article('rural-opinion', [2], 'Opinion', 'Outer Ring', 'Signe Berg · community volunteer', '09:05',
    'A postcode should not decide how much your youth club matters',
    'Six outer communities need more than an invitation to travel downtown.', null, [
      'Our local room is not spectacular. It has a kettle, a worn sofa and people who know when you have had a difficult day. It works because it is nearby. We can walk there, help run it and get home without a parent collecting us.',
      'A central youth center might be excellent. That does not make it an answer for every place. Committing most of the budget to one building asks smaller communities to trust that the remaining money will stretch far enough.',
      'I would support investment that connects the municipality: dependable transport, secure local rooms and activities that visit different neighborhoods. Until those pieces are included, a vote against this proposal is a vote for access, not against young people having good things.'
    ], 'Leans Against: reframes opposition as fairness rather than resistance to youth investment.', { quote: 'An invitation is not the same thing as a way to get there.' }),
  article('rural-map', [2], 'Analysis', 'Lindvik Ledger', 'Emil Strand', '08:45',
    'The journey the glossy drawings leave out',
    'Before counting visitors, count connections, fares and the trip home.', 'bus', [
      'A central location looks convenient on a street map. A useful access map asks different questions: when does the bus run, what does it cost and how long do you wait between connections? Distance alone cannot answer them.',
      'Outer-district volunteers want transport costs considered alongside the center’s construction and operating plans. A late activity may require a late return service. An affordable entry ticket may still be expensive when two bus fares are added.',
      'No guaranteed transport package accompanies the proposal described to the associations. That does not prove one cannot be arranged. It does mean rural groups are being asked to assess a building before a crucial part of their access is settled.'
    ], 'Leans Against through omission analysis: emphasizes unanswered access questions, not potential shared facilities.'),
  article('rural-hub', [2], 'Community', 'Outer Ring', 'Tove Lind', '08:00',
    'The smallest room in the village is its busiest on Fridays',
    'A board-game table and a borrowed projector make a convincing case for staying local.', 'students', [
      'The village youth room has no grand entrance. Its volunteers move the tables, set out games and borrow a projector for film nights. They say its best feature is that people can reach it after dinner and still get home easily.',
      'Small local hubs do not offer everything a central facility could. They depend on volunteers, shared buildings and modest grants. But the regularity of a nearby meeting place can matter more than the range of equipment inside it.',
      'With the central youth-center proposal under discussion, volunteers hope the municipality will count these smaller spaces as part of the youth infrastructure too. They are not asking every activity to stay local. They are asking that local choices survive.'
    ], 'Leans Against: gives the alternative to centralization a warm, tangible face.'),

  article('sports-fees', [3], 'Reporting', 'The Sideline', 'Jonas Elm', '09:38',
    'Before the new center opens, who pays for winter training?',
    'Clubs fear that a smaller grant pool could turn affordable sport into another family bill.', 'sports', [
      'The season starts with a familiar list: hall hire, league fees and equipment that will not last another winter. Local clubs use municipal support to keep those costs from landing entirely on families.',
      'The youth-center proposal would commit 80% of the youth budget for five years. No club-by-club cut has been announced, but sports organizers say a smaller pool for other activities could put free places and low fees under pressure.',
      'Coach Alva wants a clear answer before the vote. “A new meeting place could be brilliant. But tell us whether the young person using it can still afford training on Tuesday.” Her club is asking for a protected sports allocation, rather than reassurance alone.'
    ], 'Leans Against or conditional For: focuses on financial loss without claiming that cuts are already enacted.'),
  article('sports-opinion', [3], 'Opinion', 'The Sideline', 'Alva Nyström · volunteer coach', '09:00',
    'A ribbon-cutting cannot replace a winter season',
    'Protect affordable sport before asking clubs to support a five-year commitment.', null, [
      'A photograph of a new building is easy to celebrate. A fee a family never had to pay is harder to photograph. Both can be public investment. Only one tends to make the front page.',
      'Our grants help keep a place open for the player who would otherwise stop coming. When money gets tight, participation can disappear quietly. The team sheet gets shorter, and nobody cuts a ribbon for that.',
      'I am not against the center. I am against being asked to support an undefined trade-off. Show us how training space, equipment and affordable membership will be protected. Put it in the funding plan. Then we can discuss what the center adds instead of guessing what it removes.'
    ], 'Conditional support: concentrates attention on protecting existing provision.', { quote: 'A fee a family never had to pay is public investment too.' }),
  article('sports-conditions', [3], 'Analysis', 'Lindvik Ledger', 'Nora Vale', '08:40',
    'Three protections that could change the sports debate',
    'A grant floor, affordable hall hours and a review clause are on the clubs’ wish list.', 'sports', [
      'Sports organizers have begun asking what a workable compromise would look like. Their first request is a defined minimum for existing club support. The second is affordable access to indoor training space. The third is a way to review the arrangement if participation falls.',
      'These are negotiating demands, not concessions already made by the municipality. Nor does the youth-center proposal automatically include a full sports hall. The building’s final facilities and the remaining grant allocations are still matters to settle.',
      'A conditional Yes may sound like a middle path, but conditions only protect something if they become part of the decision. Clubs will have to judge the proposal actually on the table, while making any requested changes clear in the discussion.'
    ], 'Conditional For: provides specific safeguards while preserving uncertainty about the unamended proposal.'),
  article('sports-debate', [3], 'Debate', 'The Common Room', 'A conversation edited by Asta Reed', '07:55',
    'Could a youth center help the people who never join a team?',
    'A coach and a youth organizer test the case for a shared building.', 'students', [
      'A DIFFERENT DOOR · Youth organizer Noa says not everybody finds a home in organized sport. A shared center could reach people who want music, gaming or simply somewhere to sit without buying anything. “Investment should make room for different ways of belonging.”',
      'KEEP EXISTING DOORS OPEN · Coach Alva agrees, but questions the size of the commitment. “We should add opportunities without making the ones we have unaffordable.” She wants protected club funding before supporting the plan.',
      'The disagreement is not over whether young people deserve a place. It is over how to divide a limited budget between a new institution and activities already serving the community. There is no agreed package combining both positions yet.'
    ], 'A supportive counterargument within a loss-focused feed, retaining the financial condition.'),

  article('tech-room', [4], 'Reporting', 'Circuit Local', 'Iris North', '09:36',
    'They brought the computers. The room could not keep up.',
    'Pop-up gaming organizers want power and connectivity written into the center plan.', 'gaming', [
      'At a temporary gaming evening, the setup takes longer than the first match. Organizers have to check power, move tables and make sure the connection can support more than a handful of people at once. A room with a socket is not automatically a tech venue.',
      'A central youth center could change that. Local gaming and coding volunteers imagine reliable networking, accessible workstations and a place to leave equipment between events. They see opportunities for robotics and digital creation as well as competition.',
      'But those features are not guaranteed by the word “modern” in a building pitch. Organizers want a funded technical specification. Without it, they say smaller pop-up events may remain the more useful investment.'
    ], 'Conditional For: makes the center attractive while requiring explicit technical commitments.'),
  article('tech-opinion', [4], 'Opinion', 'Circuit Local', 'Sam Ravn · coding mentor', '08:58',
    '“Wi-Fi included” is not a plan for a tech hub',
    'If the center is for digital culture, design it with the people who will use it.', null, [
      'A bright room with a router can look like a technology investment in a presentation. Running a coding workshop, a robot demonstration and a gaming event at the same time is a different test.',
      'We need suitable power, wired connections where they matter, accessible desks, equipment storage and someone responsible for maintenance. We also need sessions where beginners are welcome. A high-spec room that nobody can help you use is another kind of locked door.',
      'I want this center to work. That is why I will not treat a promise of fast internet as a substitute for a costed plan. Put the requirements in the decision, fund their upkeep and invite users into the design. Otherwise, keep supporting the events that already happen.'
    ], 'Conditional For: replaces a vague benefit with an explicit checklist.', { quote: 'A room with a router is not automatically a tech hub.' }),
  article('tech-checklist', [4], 'Explainer', 'Circuit Local', 'Iris North', '08:35',
    'Five questions to ask before calling a building “future-ready”',
    'Speed is only one part of the answer. Access, maintenance and staff matter too.', 'gaming', [
      'CONNECTION · Can the network support simultaneous activity, and is wired access available where needed? POWER · Has the room been designed for the equipment it is supposed to host, rather than an improvised collection of extension leads?',
      'ACCESS · Can beginners and people with different access needs use the space comfortably? UPKEEP · Is there a budget for replacement, repairs and technical support? BOOKING · Will community sessions have protected time alongside major events?',
      'These questions do not establish what the proposed center will contain. They identify what the current pitch still needs to answer. A five-year budget commitment is easier to assess when the operating promise is as specific as the building promise.'
    ], 'Condition-setting rather than automatic Yes: technical literacy becomes the frame for judging the proposal.'),
  article('tech-robot', [4], 'Community', 'Circuit Local', 'Tove Lind', '07:50',
    'The robot went in circles. Everyone wanted another turn.',
    'At a pop-up coding night, the best demonstration was a mistake people could fix together.', 'gaming', [
      'The tiny wheeled robot was meant to follow a line. It spun instead. Someone checked the sensor, somebody else changed the code, and a first-time visitor asked if they could try. The mistake became the evening’s most popular activity.',
      'Volunteer-led pop-ups show how much can happen with a few kits and patient people. They also show the hidden work: transporting equipment, setting it up and finding a suitable room each time.',
      'Organizers see two possible futures. A well-equipped permanent hub could let them do more. Continued support for portable sessions could reach more neighborhoods. What they do not want is a large building budget that delivers neither dependable equipment nor enough money to keep the pop-ups going.'
    ], 'Balances enthusiasm with a credible smaller-scale alternative; no unconditional endorsement.'),

  article('student-space', [5], 'Reporting', 'Student Desk', 'Lea Moss', '09:34',
    'When school closes, where do you go?',
    'Students want somewhere to study, talk and meet without buying a coffee.', 'students', [
      'The library tables fill quickly. School rooms close. Cafés are comfortable until another drink becomes the price of staying. Students considering the youth-center proposal describe a simple need: a place where they can spend an afternoon without having to justify it.',
      'A neutral space outside school could host study groups, student meetings and peer-support activities. It would not replace professional support services, and no final program has been approved. But the idea has supporters among people who do not currently belong to a club.',
      'Others worry about the trade-off. Committing 80% of the youth budget for five years could leave less flexibility for projects across eight schools. A welcome new room and a squeezed local initiative can be consequences of the same decision.'
    ], 'Mixed: tangible social benefits paired with a clear opportunity cost; maintains the source group’s division.'),
  article('student-debate', [5], 'Debate', 'Student Desk', 'A conversation edited by Lea Moss', '08:56',
    'One new common room, eight school communities',
    'Two students explain why they are looking at the same proposal and seeing different futures.', null, [
      'YES TO A NEUTRAL SPACE · Mina wants a meeting place outside school rules and commercial cafés. “We keep saying students should lead things. Give us somewhere to organize.” She thinks sharing a center could connect councils that rarely meet.',
      'PROTECT WHAT EXISTS · Aron helps run a small student project and worries that a five-year commitment leaves too little room for changing needs. “A new building will not help if the activities inside and outside it cannot get support.”',
      'Both want student influence over the budget. They disagree about whether the current proposal provides it. A written plan for remaining grants, access and student representation could help them decide, but those details should not be assumed from the promise of a youth center.'
    ], 'Deliberately balanced debate: makes disagreement within the student group plausible.', { quote: 'The same proposal. Two different ideas of what students need.' }),
  article('student-grants', [5], 'Analysis', 'Lindvik Ledger', 'Nora Vale', '08:30',
    'What happens to the ideas that do not need a building?',
    'Small grants can fund a lot of different projects. Their future is part of the center debate.', null, [
      'A student-led event may need materials, transport or a little money for room hire rather than a permanent home. Small grants let ideas start before anyone knows whether they will become regular activities.',
      'The proposed center would take 80% of the youth budget for five years. That leaves 20% for other uses within that same budget, but the proposal does not provide a complete allocation among them. It is not accurate to say every existing school initiative has already lost its funding.',
      'Students could ask for a transparent grant plan and a way to evaluate who benefits each year. The center might support some projects directly while making others harder to fund. Comparing both effects is more useful than counting either the building or the grants in isolation.'
    ], 'Skeptical counterweight: highlights dispersed opportunities while explicitly avoiding invented confirmed cuts.', { graphic: 'budget' }),
  article('student-seat', [5], 'Interview', 'Student Desk', 'Lea Moss with youth organizer Noa', '07:45',
    '“Ask who gets a key, not just who gets a seat at the opening”',
    'An organizer on what meaningful student influence could look like after the vote.', 'students', [
      'WHAT WOULD YOU ASK FIRST? “Who decides the timetable? A building can be open to everyone in theory but mostly booked by the groups that already know how the system works.”',
      'COULD STUDENTS HELP RUN IT? “They could, if that role comes with clear authority and support. Being invited to a meeting is not the same as having a say over opening hours, costs and the activities that get priority.”',
      'DOES THAT MAKE THIS A YES? “It makes it a question worth answering. I would want to see both a meaningful role for young people and a plan for those who will keep using local spaces. A center is a tool. The rules around it decide what the tool is good for.”'
    ], 'Neutral/conditional: moves attention from the building itself to governance and access.'),

  article('climate-concrete', [6], 'Reporting', 'Green Lens', 'Freja Stone', '09:32',
    'Before the first brick: the climate questions still unanswered',
    'Campaigners want to compare a new building with reusing space already standing.', 'climate', [
      'The youth-center debate often begins with what people could do inside. Climate volunteers want it to begin one step earlier: what must be built, what materials would be used and whether an existing building could do the job.',
      'Construction has impacts before a venue opens, and energy performance during use is only part of the picture. No project-specific whole-life comparison has been supplied in the proposal shared with the associations. That leaves a major question open rather than proving a particular emissions total.',
      'Volunteers are asking for a reuse option, clear material choices and protection for local climate activities. They support places for young people. They are less willing to commit most of the youth budget to a new building before seeing how the alternatives compare.'
    ], 'Skeptical: frames missing environmental evidence as a reason to withhold support, without fabricating emissions figures.'),
  article('climate-opinion', [6], 'Opinion', 'Green Lens', 'Eli Fern · repair volunteer', '08:54',
    'The greenest room might already have walls',
    'Before commissioning something new, take the buildings we already own seriously.', null, [
      'We teach people to repair a chair before buying another. It is reasonable to ask the same question about public space. Could an underused building be adapted? Could several rooms meet the need? What would each option cost to run?',
      'Reuse is not automatically possible or automatically better in every case. Access, condition and energy demand matter. That is an argument for comparing options properly, not for skipping the comparison because the new building looks exciting.',
      'I would support a youth center that demonstrates its environmental case and keeps local climate work alive. I will not support a promise of sustainability that arrives without a materials plan, a reuse comparison or an operating budget. The word “green” should describe decisions, not decoration.'
    ], 'Skeptical/conditional: gives reuse the moral and practical starting advantage.', { quote: '“Green” should describe decisions, not decoration.' }),
  article('climate-check', [6], 'Explainer', 'Green Lens', 'Freja Stone', '08:25',
    'A green roof is a feature. A climate plan is a comparison.',
    'Three things to look for behind a convincing sustainability headline.', 'climate', [
      'LOOK AT THE WHOLE LIFE · Materials, construction, maintenance and operation belong in the same conversation. A single attractive feature does not establish the impact of the complete project.',
      'COMPARE REAL OPTIONS · A fair assessment would explain what new construction is being compared with, including realistic reuse possibilities. It should state what is still unknown instead of filling the gaps with a slogan.',
      'FOLLOW THE MONEY · A center could host repair evenings and environmental education. It could also leave less flexible funding for existing projects. Ask which activities are actually funded, who is responsible for delivering them and when the environmental claims will be reviewed.'
    ], 'Critical literacy with a skeptical frame: challenges superficial sustainability claims, leaving a path to conditional support.'),
  article('climate-repair', [6], 'Community', 'The Common Room', 'Tove Lind', '07:40',
    'A wobbly chair gets a second life, and a new owner',
    'At the garden repair table, fixing things has become a way of meeting people.', 'climate', [
      'The chair arrived with a loose leg and left with a promise: its owner would bring it back next month to help somebody else learn the repair. Volunteers at the community garden say that is how their sessions usually grow.',
      'Repair and upcycling evenings need tools, storage and people willing to share skills. They do not always need a new building. In bad weather, though, borrowing an indoor room becomes a familiar scramble.',
      'Some volunteers can imagine a permanent workshop in the proposed center. Others want better support for the network of spaces they already use. Both agree that a sustainability program must have people and resources behind it. A room labeled “repair” on a floor plan would only be a beginning.'
    ], 'A warm local alternative plus a plausible benefit of the center; keeps this feed skeptical rather than uniformly anti-building.'),

  article('budget-basics', common, 'Explainer', 'Lindvik Ledger', 'Nora Vale', '09:20',
    '80% for five years: what is actually on the table?',
    'A short guide to the youth-center proposal, and the questions it does not settle.', null, [
      'THE PROPOSAL · The municipality is asking whether to build a central youth center and commit 80% of its youth budget for five years. The percentage refers to the youth budget, not the municipality’s entire spending.',
      'THE REMAINDER · That would leave 20% of that budget for other uses. The source proposal does not give a complete list of what would be funded from that remainder, so exact cuts to individual activities cannot be calculated from the percentage alone.',
      'THE OPEN QUESTIONS · The detailed facilities, transport arrangements, environmental specifications and protection for existing activities still need clarification. A promising idea for a room or service is not the same as a funded commitment.',
      'THE DECISION · Associations can argue for changes in the discussion. The current ballot itself asks For, Against or Blank on the stated proposal; it does not turn conditions mentioned in a conversation into agreed amendments.'
    ], 'Shared neutral baseline: every organization gets the same core budget facts and unresolved questions.', { graphic: 'budget' }),
  article('bakery-cat', common, 'Community', 'Little Lindvik', 'Otto Birch', '08:48',
    'Bakery’s new “manager” refuses to leave the box',
    'Crumb the cat has found a job with excellent working conditions and no responsibilities.', 'cat', [
      'The empty delivery box was meant for recycling. Crumb had other plans. By opening time, the ginger cat had curled up inside it and was supervising the bakery from a position of complete comfort.',
      'Staff moved the box to a quiet corner away from food preparation. Customers began asking whether the new manager was available for feedback. He was not. A successful inspection, according to the baker, is one in which he briefly opens both eyes.',
      'The bakery says the box can stay for now. Crumb has declined to comment on long-term expansion plans, but has shown a strong interest in an adjacent patch of sunlight.'
    ], 'Unrelated light story: gives every feed an ordinary local-news rhythm.'),
  article('night-walk', common, 'Community', 'Little Lindvik', 'Tove Lind', '08:15',
    'The night walk where the best photograph was no photograph',
    'A neighborhood camera group put their phones away for the last ten minutes.', 'bus', [
      'The evening photography walk began with reflections in puddles, lit windows and an argument about whether a blurry bus could be called artistic. It ended with everyone agreeing to put their phones back in their pockets.',
      'Organizer Tove says the idea was not to make a point about screen time. People had become so busy comparing photographs that they were missing the place they had come to look at. A short stretch without cameras changed the conversation.',
      'The group is keeping the no-photo ending for its next walk. Beginners are welcome, and nobody needs a special camera. The most important equipment, Tove says, is a coat that lets you enjoy standing still.'
    ], 'Unrelated community feature. The bus-stop image is an illustrative night scene, not evidence of a real event.'),
  article('pastry-swap', common, 'Culture', 'Little Lindvik', 'Otto Birch', '07:30',
    'The great pastry swap has one rule: bring the recipe too',
    'A neighborhood tasting table turns into an enthusiastic argument about cardamom.', null, [
      'Some arrived with neat buns in tins. Others brought experiments that needed a spoon. At the neighborhood recipe swap, presentation mattered less than being willing to explain what went into the food.',
      'The most animated discussion concerned cardamom. One baker described it as essential. Another said the point of a recipe was knowing when to change it. They eventually traded notes and half a bun each.',
      'Organizers are collecting the recipes in a shared booklet, including the attempts that did not quite work. The next gathering will have a savory table too. Nobody has yet agreed whether that ends the pastry argument or starts a new one.'
    ], 'Unrelated culture filler with a conversational tone; no position on the consultation.')
];

export const feedFraming = [
  'For: make the missing creative home vivid; emphasize shared space and equipment. Include one decentralization counterpoint.',
  'Against: prioritize travel, local hubs and geographic fairness. The center’s attractions stay in the background.',
  'Against or conditional For: foreground costs and existing sports access; make protected funding the key condition.',
  'Conditional For: build excitement about a hub, but insist on funded networking, equipment and maintenance.',
  'Divided/undecided: alternate the need for a neutral meeting space with grant and governance concerns.',
  'Skeptical/neutral: emphasize reuse, whole-life impacts and existing climate projects; leave room for an evidenced plan.'
];
const sharedIds = ['budget-basics', 'bakery-cat', 'night-walk', 'pastry-swap'];
export function articlesFor(card) {
  const targeted = newsArticles.filter(item => item.audiences.length === 1 && item.audiences.includes(card));
  if (targeted.length !== 4) return [];
  const shared = sharedIds.map(id => newsArticles.find(item => item.id === id));
  return targeted.flatMap((item, index) => [item, shared[index]]);
}
export function publicArticle(item) {
  const { audiences, framing, ...publicCopy } = item;
  return publicCopy;
}
export function participantNews(card) {
  return { edition: newsEdition, articles: articlesFor(card).map(publicArticle) };
}
export function hostNews() {
  return { edition: newsEdition, fiction: 'All publishers, bylines, quotes, events and photos are invented for this simulation. The six source positions and the 80% / five-year proposal are the basis; specific reporting is newly authored. Original procedural notices are not delivered here.',
    feeds: associations.map(association => ({ card: association.card, name: association.name, direction: feedFraming[association.card - 1], articles: articlesFor(association.card) })) };
}
