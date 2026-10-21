(async function () {
  const user = await initShell('profile', 'Profile & Settings');
  if (!user) return;

  const loadingEl = document.getElementById('profile-loading');
  const form = document.getElementById('profile-form');
  const usernameInput = document.getElementById('profile-username');
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const phoneInput = document.getElementById('profile-phone');
  const errorBox = document.getElementById('profile-error');
  const submitBtn = document.getElementById('profile-submit');
  const submitLabel = document.getElementById('profile-submit-label');
  const avatarEl = document.getElementById('profile-avatar');
  const heroNameEl = document.getElementById('profile-hero-name');

  try {
    const data = await Northstar.get('/api/profile');
    usernameInput.value = data.user.username;
    nameInput.value = fullNameOf(data.user);
    emailInput.value = data.user.email;
    phoneInput.value = data.user.phone || '';
    if (heroNameEl) heroNameEl.textContent = fullNameOf(data.user);
    applyAvatar(avatarEl, data.user);
    loadingEl.style.display = 'none';
    form.style.display = 'block';
  } catch (err) {
    loadingEl.innerHTML = errorState(err.message, false);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    submitBtn.disabled = true;
    submitLabel.innerHTML = '<span class="spinner"></span>';

    try {
      await Northstar.post('/api/profile', {
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
      });
      Toast.success('Profile updated successfully.');
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = 'Save Changes';
    }
  });
})();
