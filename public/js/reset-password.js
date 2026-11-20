(function () {
  const form = document.getElementById('reset-form');
  const errorBox = document.getElementById('reset-error');
  const submitBtn = document.getElementById('reset-submit');
  const submitLabel = document.getElementById('reset-submit-label');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordHint = document.getElementById('password-hint');

  const email = sessionStorage.getItem('reset_email');
  const tempToken = sessionStorage.getItem('reset_temp_token');

  if (!email || !tempToken) {
    window.location.href = 'forgot-password.html';
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add('show');
  }

  function hideError() {
    errorBox.classList.remove('show');
  }

  function validatePassword(password) {
    const checks = [
      { test: password.length >= 8, label: 'At least 8 characters' },
      { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
      { test: /[a-z]/.test(password), label: 'One lowercase letter' },
      { test: /[0-9]/.test(password), label: 'One number' },
      { test: /[^A-Za-z0-9]/.test(password), label: 'One special character' },
    ];
    return checks;
  }

  passwordInput.addEventListener('input', () => {
    const checks = validatePassword(passwordInput.value);
    const failed = checks.filter(c => !c.test);
    if (passwordInput.value && failed.length > 0) {
      passwordHint.style.display = 'block';
      passwordHint.className = 'form-hint form-hint-err';
      passwordHint.textContent = 'Password needs: ' + failed.map(c => c.label).join(', ');
    } else if (passwordInput.value && failed.length === 0) {
      passwordHint.style.display = 'block';
      passwordHint.className = 'form-hint form-hint-ok';
      passwordHint.textContent = 'Strong password';
    } else {
      passwordHint.style.display = 'none';
    }
  });

  confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
      confirmPasswordInput.setCustomValidity('Passwords do not match');
    } else {
      confirmPasswordInput.setCustomValidity('');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!password || !confirmPassword) {
      showError('Please fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    const checks = validatePassword(password);
    if (checks.some(c => !c.test)) {
      showError('Password does not meet requirements.');
      return;
    }

    submitBtn.disabled = true;
    submitLabel.innerHTML = '<span class="spinner"></span>';

    try {
      const csrfData = await Northstar.get('/api/auth/csrf-token');
      Northstar.setCsrfToken(csrfData.csrfToken);

      await Northstar.post('/api/auth/reset-password', {
        email,
        tempToken,
        password,
        confirmPassword,
      });

      // Clear session storage
      sessionStorage.removeItem('reset_email');
      sessionStorage.removeItem('reset_temp_token');

      // Redirect to login with success message
      window.location.href = 'login.html?reset=success';
    } catch (err) {
      showError(err.message || 'Failed to reset password. Please try again.');
      submitBtn.disabled = false;
      submitLabel.textContent = 'Reset password';
    }
  });
})();