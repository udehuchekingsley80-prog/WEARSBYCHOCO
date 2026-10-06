// Local development helper ONLY. The app's own Express server runs
// at http://localhost:3000. If a page is opened on the loopback
// (localhost / 127.0.0.1) on some other port — e.g. a VS Code
// Live Server preview — bounce to the real server, because the
// /api endpoints only exist there.
//
// On ANY other hostname (Netlify, a deployed domain, a phone, a
// LAN IP, ...) this script does nothing, so the static site loads
// on every device. It never redirects visitors away from another
// domain.
(function () {
  var expectedHost = 'localhost';
  var expectedPort = '3000';

  // Opened straight from the filesystem (a double-clicked file):
  // the app needs its own server. Show a hint and stop.
  if (window.location.protocol === 'file:') {
    document.write(
      '<div style="font-family:sans-serif;padding:40px;max-width:560px;margin:0 auto;">'
      + '<h2>Wrong way to open this page</h2>'
      + '<p>This app needs its own server running. In a terminal, run <code>npm start</code> '
      + 'in the project folder, then open <code>http://localhost:3000/login.html</code>.</p>'
      + '</div>',
    );
    window.stop();
    return;
  }

  var host = window.location.hostname;

  // Only the loopback can be on the "wrong port". Any other
  // hostname is a real deployment — leave it completely alone.
  if (host !== 'localhost' && host !== '127.0.0.1') {
    return;
  }

  if (window.location.port !== expectedPort) {
    // A plain static server on the project root serves these pages
    // under /public/, but the Express server serves them at /.
    var path = window.location.pathname.replace(/^\/public\//, '/');
    window.location.replace('http://' + expectedHost + ':' + expectedPort + path + window.location.search);
  }
})();
