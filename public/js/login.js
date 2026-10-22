(function () {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  const submitLabel = document.getElementById('login-submit-label');

  const loader = document.getElementById('login-loader');
  const loaderCount = document.getElementById('login-loader-count');
  const loaderBar = document.getElementById('login-loader-bar');
  const loaderGreeting = document.getElementById('login-loader-greeting');

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

  function greetingFor(name) {
    const hour = new Date().getHours();
    const salutation = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return `${salutation}, ${name}`;
  }

  function playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      let t = ctx.currentTime + 0.05;
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t + i * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.16, t + i * 0.16 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.16 + 0.45);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + i * 0.16);
        osc.stop(t + i * 0.16 + 0.5);
      });
    } catch (e) {
      // Audio is a nice-to-have; never block the flow.
    }
  }

  function runLoader(greetingText) {
    loader.style.display = 'flex';
    loaderGreeting.textContent = greetingText;
    let n = 0;
    const total = 100;
    const timer = setInterval(() => {
      n += 2;
      if (n > total) n = total;
      loaderCount.textContent = n;
      loaderBar.style.width = n + '%';
      if (n >= total) {
        clearInterval(timer);
        loaderGreeting.classList.add('show');
        playChime();
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1700);
      }
    }, 22);
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

      const fullName = (data.user.firstName + ' ' + data.user.lastName).trim() || data.user.username;
      runLoader(greetingFor(fullName));
    } catch (err) {
      showError(err.message || 'That username and password combination is not recognized.');
      submitBtn.disabled = false;
      submitLabel.textContent = 'Sign In';
    }
  });
})();
