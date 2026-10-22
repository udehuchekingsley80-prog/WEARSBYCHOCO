// Off-canvas navigation drawer for phones and small tablets.
//
// The sidebar markup is injected asynchronously by app.js, so every listener
// here is delegated from the document rather than bound to elements that may
// not exist yet. The strict CSP (`script-src 'self'`) rules out inline
// handlers, so all of the wiring lives in this file.

(function () {
  'use strict';

  // Keep this in sync with the drawer breakpoint in css/style.css.
  const DRAWER_QUERY = '(max-width: 900px)';
  const OVERLAY_ID = 'nav-overlay';
  const TOGGLE_ID = 'nav-toggle';
  const CLOSE_ID = 'sidebar-close';

  const MENU_ICON =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>';

  function drawerMedia() {
    return window.matchMedia(DRAWER_QUERY);
  }

  // --- overlay ------------------------------------------------------------

  function ensureOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
    return overlay;
  }

  // --- hamburger ----------------------------------------------------------

  function ensureToggle() {
    let toggle = document.getElementById(TOGGLE_ID);
    if (toggle) return toggle;

    const topbar = document.querySelector('.mobile-topbar');
    if (!topbar) return null;

    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = TOGGLE_ID;
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-label', 'Open navigation menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'sidebar-slot');
    toggle.innerHTML = MENU_ICON;

    topbar.insertBefore(toggle, topbar.firstChild);
    return toggle;
  }

  // --- open / close -------------------------------------------------------

  function openDrawer() {
    ensureOverlay();
    document.body.classList.add('nav-open');
    // The root element carries the scroll lock; see the rule in style.css.
    document.documentElement.classList.add('nav-open');

    const toggle = document.getElementById(TOGGLE_ID);
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation menu');
    }

    const close = document.getElementById(CLOSE_ID);
    if (close) close.focus();
  }

  function closeDrawer() {
    if (!document.body.classList.contains('nav-open')) return;
    document.body.classList.remove('nav-open');
    document.documentElement.classList.remove('nav-open');

    const toggle = document.getElementById(TOGGLE_ID);
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    toggle.focus();
  }

  function toggleDrawer() {
    if (document.body.classList.contains('nav-open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  // --- wiring -------------------------------------------------------------

  function closestFrom(event, selector) {
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return null;
    return target.closest(selector);
  }

  function init() {
    ensureOverlay();
    ensureToggle();

    // Hamburger, drawer X, and drawer links are all delegated because the
    // sidebar is rendered by app.js after this file has run.
    document.addEventListener('click', (event) => {
      if (closestFrom(event, '#' + TOGGLE_ID)) {
        event.preventDefault();
        toggleDrawer();
        return;
      }

      if (closestFrom(event, '#' + CLOSE_ID)) {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (closestFrom(event, '.sidebar-nav a') && document.body.classList.contains('nav-open')) {
        closeDrawer();
      }
    });

    // Tapping the dimmed backdrop closes the drawer.
    const overlay = ensureOverlay();
    overlay.addEventListener('click', closeDrawer);

    // Escape closes the drawer.
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' && event.key !== 'Esc') return;
      if (!document.body.classList.contains('nav-open')) return;
      event.preventDefault();
      closeDrawer();
    });

    // Growing past the drawer breakpoint restores the static desktop
    // sidebar, so the drawer must not be left in the open state.
    const media = drawerMedia();
    const onBreakpointChange = (event) => {
      if (!event.matches) closeDrawer();
    };
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onBreakpointChange);
    } else if (typeof media.addListener === 'function') {
      media.addListener(onBreakpointChange);
    }

    window.addEventListener('resize', () => {
      if (!drawerMedia().matches) closeDrawer();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
