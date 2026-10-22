// Shared application shell: sidebar, topbar, mobile nav, toasts, modals.
// Injected into every authenticated page so the chrome stays identical
// across the app; each page's own <main> content remains real static HTML.

// Profile picture for the account holder. Served from the same origin, so it
// satisfies the strict `img-src 'self'` CSP. If the file is missing the
// avatar falls back to the account holder's initials.
const PROFILE_IMAGE = '/images/kevin.jpg';

const ICONS = {
  dashboard: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  accounts: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></svg>',
  cards: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>',
  transfer: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h13l-4-4"/><path d="M17 17H4l4 4"/></svg>',
  activity: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>',
  statements: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/></svg>',
  rewards: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M8.5 12.5 7 22l5-3 5 3-1.5-9.5"/></svg>',
  notifications: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  profile: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
  bell: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  home: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: 'dashboard.html', icon: 'dashboard' },
  { key: 'accounts', label: 'Accounts', href: 'accounts.html', icon: 'accounts' },
  { key: 'cards', label: 'Cards', href: 'cards.html', icon: 'cards' },
  { key: 'transfer', label: 'Transfer', href: 'transfer.html', icon: 'transfer' },
  { key: 'transactions', label: 'Activity', href: 'transactions.html', icon: 'activity' },
  { key: 'statements', label: 'Statements', href: 'statements.html', icon: 'statements' },
  { key: 'rewards', label: 'Rewards', href: 'rewards.html', icon: 'rewards' },
];

const NAV_ITEMS_LOWER = [
  { key: 'notifications', label: 'Notifications', href: 'notifications.html', icon: 'notifications' },
  { key: 'profile', label: 'Profile & Settings', href: 'profile.html', icon: 'profile' },
];

const MOBILE_TABS = [
  { key: 'dashboard', label: 'Home', href: 'dashboard.html', icon: 'home' },
  { key: 'accounts', label: 'Accounts', href: 'accounts.html', icon: 'accounts' },
  { key: 'transfer', label: 'Transfer', href: 'transfer.html', icon: 'transfer' },
  { key: 'cards', label: 'Cards', href: 'cards.html', icon: 'cards' },
  { key: 'profile', label: 'Profile', href: 'profile.html', icon: 'profile' },
];

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function initials(firstName, lastName) {
  return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
}

// The account holder's display name, e.g. "Kevin Lutolf".
function fullNameOf(user) {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
}

// Renders the profile picture inside a .avatar element, falling back to the
// account holder's initials whenever the image cannot be loaded.
function applyAvatar(el, user) {
  if (!el) return;
  const fallback = initials(user && user.firstName, user && user.lastName);
  const name = fullNameOf(user);

  el.textContent = '';
  el.classList.remove('avatar-text');

  const img = document.createElement('img');
  img.className = 'avatar-img';
  img.alt = name || 'Profile picture';
  img.addEventListener('error', () => {
    img.remove();
    el.textContent = fallback;
    el.classList.add('avatar-text');
  });
  img.src = PROFILE_IMAGE;
  el.appendChild(img);
}

function navLinkHtml(item, activeKey) {
  const active = item.key === activeKey ? ' active' : '';
  return `<a href="${item.href}" class="${active.trim()}">${ICONS[item.icon]}<span>${item.label}</span></a>`;
}

function buildSidebar(activeKey, user) {
  const userBlock = user ? `
    <div class="sidebar-user">
      <span class="avatar" id="sidebar-avatar"></span>
      <span class="sidebar-user-name">${escapeHtml(fullNameOf(user))}</span>
    </div>` : '';

  return `
    <button class="sidebar-close" id="sidebar-close" type="button" aria-label="Close navigation menu">&times;</button>
    <div class="brand"><span class="brand-mark">N</span><span>Northstar Financial</span></div>
    ${userBlock}
    <nav class="sidebar-nav">
      ${NAV_ITEMS.map((item) => navLinkHtml(item, activeKey)).join('')}
      <div class="sidebar-divider"></div>
      ${NAV_ITEMS_LOWER.map((item) => navLinkHtml(item, activeKey)).join('')}
    </nav>
    <div class="sidebar-footer">
      <button class="signout-btn" id="signout-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
        <span>Sign out</span>
      </button>
    </div>
  `;
}

function buildMobileTabbar(activeKey) {
  return MOBILE_TABS.map((item) => {
    const active = item.key === activeKey ? ' active' : '';
    return `<a href="${item.href}" class="${active.trim()}">${ICONS[item.icon]}<span>${item.label}</span></a>`;
  }).join('');
}

// The compact mobile header carries no static markup for the account holder,
// so the avatar / name chip is created on demand and filled in once the
// signed-in user is known.
function ensureMobileUserChip() {
  const topbar = document.querySelector('.mobile-topbar');
  if (!topbar) return null;

  let avatarEl = document.getElementById('mobile-avatar');
  if (avatarEl) return avatarEl;

  const chip = document.createElement('a');
  chip.href = 'profile.html';
  chip.className = 'mobile-user-chip';
  chip.setAttribute('aria-label', 'Profile and settings');

  avatarEl = document.createElement('span');
  avatarEl.className = 'avatar';
  avatarEl.id = 'mobile-avatar';
  chip.appendChild(avatarEl);

  const nameEl = document.createElement('span');
  nameEl.className = 'user-chip-name';
  nameEl.id = 'mobile-user-chip-name';
  chip.appendChild(nameEl);

  topbar.appendChild(chip);
  return avatarEl;
}

const Toast = {
  ensureStack() {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  },
  show(message, type = 'info') {
    const stack = this.ensureStack();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  },
  success(message) { this.show(message, 'success'); },
  error(message) { this.show(message, 'error'); },
  info(message) { this.show(message, 'info'); },
};

async function initShell(activeKey, pageTitle) {
  const user = await Northstar.requireAuth();
  if (!user) return null;

  const sidebarSlot = document.getElementById('sidebar-slot');
  if (sidebarSlot) sidebarSlot.innerHTML = buildSidebar(activeKey, user);

  const topbarTitle = document.getElementById('topbar-title');
  if (topbarTitle) topbarTitle.textContent = pageTitle;

  const userChipName = document.getElementById('user-chip-name');
  if (userChipName) userChipName.textContent = fullNameOf(user);

  const avatarEl = document.getElementById('user-avatar');
  applyAvatar(avatarEl, user);

  const sidebarAvatarEl = document.getElementById('sidebar-avatar');
  applyAvatar(sidebarAvatarEl, user);

  const mobileAvatarEl = ensureMobileUserChip();
  applyAvatar(mobileAvatarEl, user);

  const mobileUserChipName = document.getElementById('mobile-user-chip-name');
  if (mobileUserChipName) mobileUserChipName.textContent = fullNameOf(user);

  const mobileTabbar = document.getElementById('mobile-tabbar-slot');
  if (mobileTabbar) mobileTabbar.innerHTML = buildMobileTabbar(activeKey);

  document.querySelectorAll('.signout-btn, #signout-btn').forEach((btn) => {
    btn.addEventListener('click', () => Northstar.logout());
  });

  refreshNotificationDot();

  document.title = `${pageTitle} — Northstar Financial`;

  return user;
}

async function refreshNotificationDot() {
  try {
    const data = await Northstar.get('/api/notifications');
    const hasUnread = (data.notifications || []).some((n) => !n.isRead);
    document.querySelectorAll('.bell-dot').forEach((dot) => {
      dot.classList.toggle('show', hasUnread);
    });
  } catch (err) {
    // silently ignore — the bell dot is a non-critical enhancement
  }
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function skeletonRows(n) {
  return Array.from({ length: n }).map(() => '<div class="skeleton-row"></div>').join('');
}

function emptyState(icon, title, message) {
  return `<div class="state-block"><div class="state-icon">${icon}</div><div class="state-title">${title}</div><div class="state-message">${message}</div></div>`;
}

function errorState(message, withRetry) {
  const retryBtn = withRetry ? '<button class="btn btn-outline btn-sm mt-16 js-retry-btn" type="button">Try again</button>' : '';
  return `<div class="state-block"><div class="state-icon">&#9888;</div><div class="state-title">Something went wrong</div><div class="state-message">${escapeHtml(message)}</div>${retryBtn}</div>`;
}
