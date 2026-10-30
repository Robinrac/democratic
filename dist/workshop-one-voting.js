import { uid } from './open-circle.js';

const labels = { for: 'For', against: 'Against', blank: 'Blank' };
const resultLabel = winner => winner === 'for' ? 'For wins' : winner === 'against' ? 'Against wins' : winner === 'tie' ? 'It’s a tie' : 'No decision';
export function setupVoting({ root, api, key }) {
  const storageKey = key + ':pending-vote';
  let pending = null;
  try { pending = JSON.parse(localStorage.getItem(storageKey)); } catch { /* No saved ballot. */ }
  let voting = null, result = null, sending = false;
  root.querySelector('#news').insertAdjacentHTML('beforebegin', '<section id="vote-result" class="vote-result" aria-live="polite" hidden><span class="eyebrow">FINAL VOTE · WORKSHOP 1</span><h2 id="vote-result-title"></h2><p id="vote-result-totals"></p></section>');
  root.querySelector('.social-nav').insertAdjacentHTML('beforeend', '<a id="vote-nav" href="#voting" hidden><span>Vote</span></a>');
  root.querySelector('#team').insertAdjacentHTML('afterend', '<section id="voting" class="panel voting-card" aria-labelledby="vote-heading" hidden><span class="eyebrow">YOUR ORGANIZATION’S BALLOT</span><h2 id="vote-heading">Vote</h2><p id="vote-mandate"></p><p id="vote-state" role="status"></p><button id="start-voting">Start voting</button></section>');
  root.insertAdjacentHTML('beforeend', `<dialog id="voting-open-dialog" class="vote-dialog" aria-labelledby="voting-open-title"><h2 id="voting-open-title">You can now vote</h2><p>Voting is open for your organization. Go to the voting section to cast your ballot.</p><button id="go-to-vote">Go to vote</button></dialog>
    <dialog id="ballot-dialog" class="vote-dialog" aria-labelledby="ballot-title"><form id="ballot-form"><span class="eyebrow">WORKSHOP 1</span><h2 id="ballot-title">Cast your organization’s vote</h2><p id="ballot-question" class="vote-question"></p><p id="ballot-mandate"></p><fieldset class="ballot-options"><legend>Choose your vote</legend>${Object.entries(labels).map(([value, label]) => `<label><input type="radio" name="choice" value="${value}" required>${value === 'blank' ? 'Vote blank' : label}</label>`).join('')}</fieldset><p>You cannot change a confirmed vote yourself. The host can exclude or delete it during the exercise. A blank vote counts as participation without supporting either side.</p><p id="ballot-error" class="error" role="alert"></p><div class="row"><button type="button" id="cancel-voting" class="secondary">Back</button><button type="submit" id="submit-vote">Submit vote</button></div></form></dialog>
    <dialog id="vote-thanks-dialog" class="vote-dialog" aria-labelledby="vote-thanks-title"><span class="eyebrow">VOTE RECORDED</span><h2 id="vote-thanks-title">Thank you for your vote</h2><p id="vote-thanks-copy"></p><button id="back-to-feed">Back to feed</button></dialog>
    <dialog id="vote-result-dialog" class="vote-dialog vote-result-dialog" aria-labelledby="vote-result-dialog-title"><span class="eyebrow">FINAL RESULT · WORKSHOP 1</span><h2 id="vote-result-dialog-title"></h2><p id="vote-result-dialog-totals"></p><button id="result-back-to-feed">Back to news feed</button></dialog>`);
  const section = root.querySelector('#voting'), nav = root.querySelector('#vote-nav');
  const notice = root.querySelector('#voting-open-dialog'), ballotDialog = root.querySelector('#ballot-dialog'), thanks = root.querySelector('#vote-thanks-dialog');
  const resultDialog = root.querySelector('#vote-result-dialog'), resultBanner = root.querySelector('#vote-result');
  const form = root.querySelector('#ballot-form'), start = root.querySelector('#start-voting'), submit = root.querySelector('#submit-vote');
  function clearPending() { pending = null; localStorage.removeItem(storageKey); }
  function scrollTo(element) {
    element.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  function goToVote() {
    if (notice.open) notice.close();
    nav.setAttribute('aria-current', 'page');
    section.tabIndex = -1;
    scrollTo(section); (start.hidden || start.disabled ? section : start).focus({ preventScroll: true });
  }
  root.querySelector('#go-to-vote').onclick = goToVote;
  nav.onclick = event => { event.preventDefault(); goToVote(); };
  function backToFeed() {
    if (thanks.open) thanks.close();
    nav.removeAttribute('aria-current');
    const feed = root.querySelector('#news'); feed.tabIndex = -1;
    feed.focus({ preventScroll: true }); scrollTo(feed);
  }
  root.querySelector('#back-to-feed').onclick = backToFeed;
  function closeResult() {
    if (resultDialog.open) resultDialog.close();
    const feed = root.querySelector('#news'); feed.tabIndex = -1;
    feed.focus({ preventScroll: true }); scrollTo(feed);
  }
  root.querySelector('#result-back-to-feed').onclick = closeResult;
  resultDialog.addEventListener('cancel', event => { event.preventDefault(); closeResult(); });
  thanks.addEventListener('cancel', event => { event.preventDefault(); backToFeed(); });
  function showThanks(ballot) {
    clearPending();
    if (ballotDialog.open) ballotDialog.close();
    if (notice.open) notice.close();
    root.querySelector('#vote-thanks-copy').textContent = `Your vote: ${labels[ballot.choice]}. You have voted on behalf of your ${ballot.weight} members.`;
    if (!thanks.open) thanks.showModal();
  }
  function ballotControls() {
    const open = voting?.status === 'open' && !voting.paused;
    form.querySelectorAll('input').forEach(input => { input.disabled = sending || !!pending || !open; });
    submit.disabled = sending || !open;
    submit.textContent = sending ? 'Recording vote…' : pending ? 'Retry vote' : 'Submit vote';
    root.querySelector('#cancel-voting').disabled = sending;
    if (!open && ballotDialog.open) root.querySelector('#ballot-error').textContent = voting?.paused ? 'Voting is paused by the facilitator.' : 'Voting has closed.';
  }
  start.onclick = () => {
    if (!voting || voting.ballot || voting.status !== 'open' || voting.paused) return;
    form.reset();
    if (pending) form.elements.choice.value = pending.choice;
    root.querySelector('#ballot-error').textContent = pending ? 'Your previous submission is not yet confirmed. Retry the same vote.' : '';
    root.querySelector('#ballot-question').textContent = voting.question;
    root.querySelector('#ballot-mandate').textContent = `You represent ${voting.mandate} members. Your vote carries a mandate of ${voting.mandate}.`;
    ballotControls(); ballotDialog.showModal();
  };
  root.querySelector('#cancel-voting').onclick = () => ballotDialog.close();
  ballotDialog.addEventListener('cancel', event => { if (sending) event.preventDefault(); });
  form.onsubmit = async event => {
    event.preventDefault();
    if (sending || !voting || voting.ballot) return;
    if (!pending) {
      const choice = new FormData(form).get('choice');
      if (!Object.hasOwn(labels, choice)) return;
      pending = { choice, requestId: uid(), votingId: voting.id };
      localStorage.setItem(storageKey, JSON.stringify(pending));
    }
    sending = true; ballotControls(); root.querySelector('#ballot-error').textContent = '';
    try {
      const result = await api('votes', pending);
      voting.ballot = result.ballot; voting.version = result.version; voting.deleted = false;
      showThanks(result.ballot);
    } catch (error) {
      root.querySelector('#ballot-error').textContent = error.message;
      if (error.status && error.status < 500) clearPending();
    } finally { sending = false; render(); }
  };
  function render() {
    resultBanner.hidden = !result || !voting;
    if (result && voting) {
      const title = resultLabel(result.winner);
      const totals = `For ${result.totals.for} · Against ${result.totals.against} · Blank ${result.totals.blank} weighted votes`;
      root.querySelector('#vote-result-title').textContent = root.querySelector('#vote-result-dialog-title').textContent = title;
      root.querySelector('#vote-result-totals').textContent = root.querySelector('#vote-result-dialog-totals').textContent = totals;
      const seenKey = key + ':result-seen:' + result.at;
      if (!root.querySelector('dialog[open]') && localStorage.getItem(seenKey) !== 'seen') {
        localStorage.setItem(seenKey, 'seen'); resultDialog.showModal();
      }
    }
    section.hidden = nav.hidden = root.querySelector('.social-nav').hidden = !voting?.id;
    if (!voting) return;
    root.querySelector('#vote-mandate').textContent = `${voting.mandate} members · ${voting.mandate} voting weight`;
    root.querySelector('#vote-state').textContent = voting.ballot ? (voting.ballot.counted === false ? `Your vote: ${labels[voting.ballot.choice]}. The host marked it as does not count.` : `Vote recorded: ${labels[voting.ballot.choice]}.`) : voting.deleted ? (voting.status === 'open' && !voting.paused ? 'The host deleted your vote. You can vote again.' : 'The host deleted your vote. Voting is currently closed or paused.') : voting.paused ? 'Voting is paused.' : voting.status === 'closed' ? 'Voting is closed. No vote was recorded for your organization.' : pending ? 'Your vote is awaiting confirmation. Retry to confirm it.' : 'Voting is open.';
    start.hidden = !!voting.ballot;
    start.disabled = sending || voting.status !== 'open' || voting.paused;
    start.textContent = pending ? 'Continue voting' : 'Start voting';
    if (thanks.open && voting.ballot) root.querySelector('#vote-thanks-copy').textContent = `Your vote: ${labels[voting.ballot.choice]}. You have voted on behalf of your ${voting.ballot.weight} members.${voting.ballot.counted === false ? ' The host marked this vote as does not count.' : ''}`;
    ballotControls();
    if (voting.status !== 'open' || voting.paused || voting.ballot) { if (notice.open) notice.close(); }
    const noticeKey = key + ':voting-notice:' + voting.id;
    if (voting.status === 'open' && !voting.paused && !voting.ballot && !pending && matchMedia('(max-width: 760px)').matches && !root.querySelector('dialog[open]') && localStorage.getItem(noticeKey) !== 'seen') {
      localStorage.setItem(noticeKey, 'seen'); notice.showModal();
    }
  }
  return {
    update(person, room) {
      if (sending) return;
      result = room?.voteResult || null;
      const next = person?.voting || null;
      if (next && voting && next.id === voting.id && next.version < voting.version) return;
      voting = next;
      if (!voting) {
        clearPending();
        [notice, ballotDialog, thanks, resultDialog].forEach(dialog => { if (dialog.open) dialog.close(); });
      } else {
        if (pending && voting.deletedRequestIds?.includes(pending.requestId)) clearPending();
        if (voting.deleted && thanks.open) thanks.close();
        if (pending && pending.votingId !== voting.id) clearPending();
        if (voting.ballot && pending) showThanks(voting.ballot);
      }
      render();
    }
  };
}
