(function () {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  const submitLabel = document.getElementById('login-submit-label');

  // Warm the CSRF token on page load purely so the round-trip isn't on the
  // critical path for a normal submit. The submit handler below always
  // fetches a guaranteed-fresh token immediately before posting — it never
  // trusts this warm-up call or anything already sitting in sessionStorage,
  // which avoids any staleness/race issues regardless of page-load timing,
  // bfcache restores, or a prior failed attempt on the same page.
  Northstar.get('/api/auth/csrf-token')
    .then((data) => Northstar.setCsrfToken(data.csrfToken))
    .catch(() => {});

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add('show');
  }

  function hideError() {
    errorBox.classList.remove('show');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      showError('Please enter both your username and password.');
      return;
    }

    submitBtn.disabled = true;
    submitLabel.innerHTML = '<span class="spinner"></span>';

    try {
      // Always fetch a guaranteed-fresh token right before posting — the
      // server returns the same token for an existing session, so this is
      // cheap and side-effect-free, and it can never be stale.
      const tokenData = await Northstar.get('/api/auth/csrf-token');
      Northstar.setCsrfToken(tokenData.csrfToken);

      const data = await Northstar.post('/api/auth/login', { username, password });
      Northstar.setCsrfToken(data.csrfToken);
      sessionStorage.setItem('ns_user', JSON.stringify(data.user));
      window.location.href = 'dashboard.html';
    } catch (err) {
      showError(err.message || 'That username and password combination is not recognized.');
      submitBtn.disabled = false;
      submitLabel.textContent = 'Sign In';
    }
  });
})();
