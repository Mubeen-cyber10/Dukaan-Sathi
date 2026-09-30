// Theme Initialization - Runs synchronously in <head> to prevent FOUC (Flash of Unstyled Content)
(function() {
  'use strict';
  var theme = 'light';
  try {
    var stored = localStorage.getItem('ds-theme');
    if (stored === 'dark' || stored === 'light') {
      theme = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }
  } catch (e) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
