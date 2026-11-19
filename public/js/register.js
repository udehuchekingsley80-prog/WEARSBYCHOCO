(function () {
  const form = document.getElementById('register-form');
  const errorBox = document.getElementById('register-error');
  const submitBtn = document.getElementById('register-submit');
  const submitLabel = document.getElementById('register-submit-label');
  const passwordInput = document.getElementById('password');
  const passwordHint = document.getElementById('password-hint');
  const confirmPasswordInput = document.getElementById('confirmPassword');

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

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (data.password !== data.confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    const checks = validatePassword(data.password);
    if (checks.some(c => !c.test)) {
      showError('Password does not meet requirements.');
      return;
    }

    submitBtn.disabled = true;
    submitLabel.innerHTML = '<span class="spinner"></span>';

    try {
      const csrfData = await Northstar.get('/api/auth/csrf-token');
      Northstar.setCsrfToken(csrfData.csrfToken);

      const resp = await Northstar.post('/api/auth/register', {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        password: data.password,
        marketing: !!data.marketing,
      });

      Northstar.setCsrfToken(resp.csrfToken);
      sessionStorage.setItem('ns_user', JSON.stringify(resp.user));

      window.location.href = 'dashboard.html';
    } catch (err) {
      showError(err.message || 'Registration failed. Please try again.');
      submitBtn.disabled = false;
      submitLabel.textContent = 'Create account';
    }
  });
})();