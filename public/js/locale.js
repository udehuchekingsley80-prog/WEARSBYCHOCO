// Auto-detect language and currency on new devices
(function() {
  const STORAGE_KEY = 'ns_locale';
  const DEVICE_KEY = 'ns_device_id';
  
  function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(DEVICE_KEY, deviceId);
    }
    return deviceId;
  }
  
  function detectLocale() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // First visit or new device
    const lang = navigator.language || navigator.userLanguage || 'en-US';
    const langCode = lang.toLowerCase().split('-')[0];
    
    // Map languages to locales
    const localeMap = {
      'de': { lang: 'de', currency: 'EUR', symbol: '€' },
      'fr': { lang: 'fr', currency: 'EUR', symbol: '€' },
      'es': { lang: 'es', currency: 'EUR', symbol: '€' },
      'it': { lang: 'it', currency: 'EUR', symbol: '€' },
      'nl': { lang: 'nl', currency: 'EUR', symbol: '€' },
      'pt': { lang: 'pt', currency: 'EUR', symbol: '€' },
      'en': { lang: 'en', currency: 'EUR', symbol: '€' }, // Default to EUR as requested
    };
    
    const locale = localeMap[langCode] || { lang: 'en', currency: 'EUR', symbol: '€' };
    localeMap[langCode] = locale; // Ensure EUR
    
    const config = {
      language: locale.lang,
      currency: 'EUR',
      symbol: '€',
      detected: true,
      deviceId: getDeviceId()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return config;
  }
  
  window.NSLocale = detectLocale();
  
  // Auto-apply language attributes
  if (window.NSLocale.language && document.documentElement) {
    document.documentElement.lang = window.NSLocale.language;
  }
})();
