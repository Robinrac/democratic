document.querySelector('#host-login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = document.querySelector('#host-unlock');
  const error = document.querySelector('#host-error');
  button.disabled = true;
  error.textContent = '';
  try {
    const response = await fetch('/api/host/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.querySelector('#host-password').value }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not sign in. Try again.');
    location.replace('/?presenter=1');
  } catch (failure) {
    error.textContent = failure.name === 'TimeoutError' || failure.name === 'TypeError' ? 'Could not connect. Try again.' : failure.message;
    button.disabled = false;
  }
});
