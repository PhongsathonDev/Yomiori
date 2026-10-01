import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');

if (fs.existsSync(indexPath)) {
  let indexHtml = fs.readFileSync(indexPath, 'utf8');

  // Insert redirect handler for GitHub Pages non-hash URLs
  const redirectScript = `
  <script>
    (function() {
      // Auto-redirect GitHub Pages SPA paths to HashRouter
      var pathname = window.location.pathname;
      var repoPrefix = '/Yomiori';
      var cleanPath = pathname;
      if (cleanPath.toLowerCase().startsWith(repoPrefix.toLowerCase())) {
        cleanPath = cleanPath.slice(repoPrefix.length);
      }
      if (cleanPath && cleanPath !== '/' && cleanPath !== '/index.html') {
        window.location.replace(repoPrefix + '/#' + cleanPath + window.location.search);
      } else {
        window.location.replace(repoPrefix + '/#/');
      }
    })();
  </script>
`;

  // Inject at the top of <head>
  const notFoundHtml = indexHtml.replace('<head>', `<head>${redirectScript}`);
  fs.writeFileSync(notFoundPath, notFoundHtml, 'utf8');
  console.log('✅ Generated 404.html with SPA hash redirect for GitHub Pages.');
} else {
  console.warn('⚠️ dist/index.html not found, skipping 404.html generation.');
}

// Export raw JSON data to dist/data for Mobile App CDN
const srcDataDir = path.resolve('src/data');
const distDataDir = path.join(distDir, 'data');

function copyJsonFiles(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyJsonFiles(srcPath, destPath);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyJsonFiles(srcDataDir, distDataDir);
console.log('✅ Exported JSON chapters & metadata to dist/data for Mobile App CDN.');
