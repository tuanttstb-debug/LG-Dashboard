const fs = require('fs');
const path = require('path');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LG Dashboard</title>
  <script>
    var base = '/LG-Dashboard';
    var p = window.location.pathname.replace(base, '') || '/';
    sessionStorage.setItem('__spa_redirect', p + window.location.search + window.location.hash);
    window.location.replace(base + '/');
  </script>
</head>
<body></body>
</html>`;

fs.writeFileSync(path.join('out', '404.html'), html, 'utf8');
console.log('✓ out/404.html replaced with SPA redirect');
