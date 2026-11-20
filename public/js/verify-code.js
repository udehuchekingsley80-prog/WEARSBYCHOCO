(function () {
  const form = document.getElementById('verify-form');
  const errorBox = document.getElementById('verify-error');
  const submitBtn = document.getElementById('verify-submit');
  const submitLabel = document.getElementById('verify-submit-label');
  const codeInput = document.getElementById('code');
  const emailDisplay = document.getElementById('code-email-display');
  const resendBtn = document.getElementById('resend-btn');
  const resendLabel = document.getElementById('resend-label');
  const countdownEl = document.getElementById('resend-countdown');

  const email = sessionStorage.getItem('reset_email');
  if (email) {
    emailDisplay.textContent = email;
  } else {
    // If no email in storage, redirect to forgot password page
    window.location.href = 'forgot-password.html';
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add('show');
  }

  function hideError() {
    errorBox.classList.remove('show');
  }

  function startResendCountdown() {
    let seconds = 60;
    resendBtn.disabled = true;
    countdownEl.style.display = 'block';
    countdownEl.textContent = `Resend available in ${seconds}s`;

    const interval = setInterval(() => {
      seconds--;
      if (seconds > 0) {
        countdownEl.textContent = `Resend available in ${seconds}s`;
      } else {
        clearInterval(interval);
        resendBtn.disabled = false;
        countdownEl.style.display = 'none';
        resendLabel.textContent = 'Resend code';
      }
    }, 1000);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const code = codeInput.value.trim();
    if (!code || code.length !== 6) {
      showError('Please enter the 6-digit code.');
      return;
    }

    submitBtn.disabled = true;
    submitLabel.innerHTML = '<span class="spinner"></span>';

    try {
      const csrfData = await Northstar.get('/api/auth/csrf-token');
      Northstar.setCsrfToken(csrfData.csrfToken);

      const response = await Northstar.post('/api/auth/verify-reset-code', {
        email,
        code,
      });

      // Store temp token for next step
      if (response.tempToken) {
        sessionStorage.setItem('reset_temp_token', response.tempToken);
        window.location.href = 'reset-password.html';
      } else {
        showError('Verification successful but no token received. Please try again.');
        submitBtn.disabled = false;
        submitLabel.textContent = 'Verify code';
      }
    } catch (err) {
      showError(err.message || 'Invalid or expired code. Please try again.');
      submitBtn.disabled = false;
      submitLabel.textContent = 'Verify code';
    }
  });

  resendBtn.addEventListener('click', async () => {
    hideError();
    resendBtn.disabled = true;
    resendLabel.innerHTML = '<span class="spinner"></span>';

    try {
      const csrfData = await Northstar.get('/api/auth/csrf-token');
      Northstar.setCsrfToken(csrfData.csrfToken);

      await Northstar.post('/api/auth/resend-reset-code', { email });
      startResendCountdown();
    } catch (err) {
      showError(err.message || 'Could not resend code. Please try again.');
      resendBtn.disabled = false;
      resendLabel.textContent = 'Resend code';
    }
  });

  // Auto-focus code input
  codeInput.focus();
})();