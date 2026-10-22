// Single source of truth for the backend base URL used by every
// API call in this app (see js/api.js).
//
// Leave it empty ('') — the default — and the browser calls the API
// on the same origin as the page. That works with the Express server
// and (via the Netlify proxy in netlify.toml) with the site hosted at
// https://northstarfinancial.netlify.app. When the backend is deployed
// to its own host, set it once here (no trailing slash), e.g.:
//   var API_BASE = 'https://api.northstarfinancial.example.com';
var API_BASE = '';
