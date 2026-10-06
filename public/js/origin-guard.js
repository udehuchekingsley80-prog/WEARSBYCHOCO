// This app only works when served by its own Express server. If this page
// was opened any other way (a VS Code Live Server preview, a double-clicked
// file, a different port), redirect straight to the real server instead of
// showing a broken page — /api calls do not exist on any other origin.
(function () {
  var expectedOrigin = 'http://localhost:3000';

  if (window.location.protocol === 'file:') {
    document.write(
      '<div style="font-family:sans-serif;padding:40px;max-width:560px;margin:0 auto;">'
      + '<h2>Wrong way to open this page</h2>'
      + '<p>This app needs its own server running. In a terminal, run <code>npm start</code> '
      + 'in the project folder, then open '
      + '<a href="http://localhost:3000/login.html">http://localhost:3000/login.html</a>.</p>'
      + '</div>',
    );
    window.stop();
    return;
  }

  if (window.location.origin !== expectedOrigin) {
    var path = window.location.pathname.replace(/^\/public\//, '/');
    window.location.replace(expectedOrigin + path + window.location.search);
  }
})();
