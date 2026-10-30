import { associations } from './types.mjs';

export const ballotQuestion = 'Should the municipality build a central youth center, committing 80% of its youth budget for five years?';
export const voteChoices = ['for', 'against', 'blank'];
export const emptyVoting = () => ({ id: null, status: 'inactive', ballots: {} });
export const votingState = state => state.voting || emptyVoting();

export function ownVoting(state, role) {
  const voting = votingState(state), association = associations[role.card - 1];
  return {
    id: voting.id, status: voting.status, question: ballotQuestion, version: state.version,
    mandate: association.members, paused: state.paused,
    ballot: voting.ballots[role.id] || null,
    deleted: !voting.ballots[role.id] && !!voting.deletedBallots?.[role.id]?.length,
    deletedRequestIds: voting.deletedBallots?.[role.id] || []
  };
}

export function hostVoting(state) {
  const voting = votingState(state), totals = { for: 0, against: 0, blank: 0 };
  const rows = state.roles.map(role => {
    const association = associations[role.card - 1], ballot = voting.ballots[role.id];
    if (ballot && ballot.counted !== false) totals[ballot.choice] += ballot.weight;
    return { ...association, mandate: association.members, joined: role.claimed, choice: ballot?.choice || null, castAt: ballot?.castAt || null,
      ballotRequestId: ballot?.requestId || null, counted: ballot ? ballot.counted !== false : false,
      deleted: !ballot && !!voting.deletedBallots?.[role.id]?.length };
  });
  const totalMandate = associations.reduce((sum, item) => sum + item.members, 0);
  const countedMandate = Object.values(totals).reduce((sum, weight) => sum + weight, 0);
  const castMandate = rows.filter(row => row.choice).reduce((sum, row) => sum + row.mandate, 0);
  const leader = totals.for === 0 && totals.against === 0 ? 'none' : totals.for === totals.against ? 'tie' : totals.for > totals.against ? 'for' : 'against';
  return { id: voting.id, status: voting.status, question: ballotQuestion, rows, totals, leader,
    totalMandate, castMandate, uncastMandate: totalMandate - castMandate,
    countedMandate, excludedMandate: castMandate - countedMandate,
    excludedOrganizations: rows.filter(row => row.choice && !row.counted).length,
    history: voting.history || [], votedOrganizations: rows.filter(row => row.choice).length };
}
