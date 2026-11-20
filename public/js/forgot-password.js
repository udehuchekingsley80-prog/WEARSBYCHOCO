(function () {
  const form = document.getElementById('forgot-form');
  const errorBox = document.getElementById('forgot-error');
  const submitBtn = document.getElementById('forgot-submit');
  const submitLabel = document.getElementById('forgot-submit-label');
  const emailInput = document.getElementById('email');

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

    const email = emailInput.value.trim().toLowerCase();
    if (!email) {
      showError('Please enter your email address.');
      return;
    }

    submitBtn.disabled = true;
    submitLabel.innerHTML = '<span class="spinner"></span>';

    try {
      const csrfData = await Northstar.get('/api/auth/csrf-token');
      Northstar.setCsrfToken(csrfData.csrfToken);

      await Northstar.post('/api/auth/forgot-password', { email });

      // Store email for next page
      sessionStorage.setItem('reset_email', email);
      window.location.href = 'verify-code.html';
    } catch (err) {
      showError(err.message || 'Something went wrong. Please try again.');
      submitBtn.disabled = false;
      submitLabel.textContent = 'Send verification code';
    }
  });
})();