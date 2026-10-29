// Preset accounts and text for the closed fictional workshop only.
export const botTargets = [1, 3, 5, 6];
export const botMode = card => card === 2 ? 'hashtags' : card === 4 ? 'challenge' : null;
const hashtagText = [
  'Keep fares unchanged. Reliable buses matter more than cheaper tickets.',
  'A free ticket cannot fix a cancelled departure. Fund the timetable first.',
  'Drivers, maintenance and later routes deserve the budget.',
  'No youth fare cuts. Better coverage helps more people.',
  'Put reliable service ahead of promises about free travel.',
  'Keep fares and make the buses turn up on time.',
  'Service quality first. Cheap tickets are not a transport plan.',
  'No free bus scheme. Protect funding for useful departures.',
  'Better routes, fewer cancellations, unchanged fares.',
  'Spend the budget on transport that works, not youth discounts.'
];
const challenges = {
  1: ['Half-price tickets sound nice until everyone else pays for your discount.', 'Your occasional trips do not justify cutting the whole system’s income.', 'You keep asking for cheaper rides while ignoring cancelled buses.', 'This half-price plan is selfish. Reliability should come before your savings.', 'Stop presenting your own cheaper journeys as a solution for everyone.'],
  3: ['Free rides just because you are under 20? That is an unfair giveaway.', 'Your free-under-20 plan ignores everyone who still has to pay.', 'Sport and youth clubs are not an excuse to pretend bus drivers work for free.', 'This proposal is naive. You cannot wish away the cost of running buses.', 'Stop calling free tickets independence when somebody else pays the bill.'],
  5: ['Free evening and weekend rides? Why should everyone fund your nights out?', 'Your free-time travel is not more important than reliable everyday routes.', 'This evening-bus idea looks like a perk for your own social life.', 'You call it fair, but your proposal puts your own plans first.', 'Stop dressing up free weekend trips as a solution for the whole community.'],
  6: ['As a bus driver, you should know that free travel does not pay the running costs.', 'Your free-under-25 plan makes promises without protecting the service.', 'Working on buses does not make this giveaway a sensible policy.', 'This is irresponsible advice from someone who knows what buses cost.', 'Stop selling free journeys as if drivers, repairs and fuel cost nothing.']
};
const handles = { hashtags: ['fjeld-ekko', 'birke-vind', 'havre-sky', 'fjord-glimt', 'mos-sti'], challenge: ['sten-falk', 'tundra-ugle', 'bølge-odder', 'gran-ravn', 'klippe-rev'] };
export function botScript(mode, target) {
  const lines = mode === 'hashtags' ? hashtagText : challenges[target.card];
  return lines.map((line, i) => ({ account: handles[mode][i % 5], stance: 'keep-fares', text: `${mode === 'challenge' ? '@' + target.username + ' ' : ''}${line} #ExpensiveRides #ServiceFirst #ReliableRoutes` }));
}
