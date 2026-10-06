// Shared fetch() wrapper. Attaches the CSRF token (stored in sessionStorage
// after login) to every mutating request as the X-CSRF-Token header.

const Northstar = (() => {
  function getCsrfToken() {
    return sessionStorage.getItem('ns_csrf') || '';
  }

  function setCsrfToken(token) {
    if (token) sessionStorage.setItem('ns_csrf', token);
  }

  function clearSession() {
    sessionStorage.removeItem('ns_csrf');
    sessionStorage.removeItem('ns_user');
  }

  async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = Object.assign({}, options.headers || {});

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      headers['X-CSRF-Token'] = getCsrfToken();
    }

    const response = await fetch(path, {
      method,
      headers,
      credentials: 'same-origin',
      body: options.body,
    });

    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (response.status === 401) {
      clearSession();
      if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = 'login.html';
      }
    }

    if (!response.ok) {
      const message = (data && data.error) || 'Something went wrong. Please try again.';
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function get(path) {
    return request(path, { method: 'GET' });
  }

  function post(path, body) {
    return request(path, { method: 'POST', body: JSON.stringify(body || {}) });
  }

  async function requireAuth() {
    try {
      const data = await get('/api/auth/me');
      setCsrfToken(data.csrfToken);
      sessionStorage.setItem('ns_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      window.location.href = 'login.html';
      return null;
    }
  }

  async function logout() {
    try {
      await post('/api/auth/logout', {});
    } catch (err) {
      // ignore
    }
    clearSession();
    window.location.href = 'login.html';
  }

  return {
    get, post, request, getCsrfToken, setCsrfToken, clearSession, requireAuth, logout,
  };
})();
