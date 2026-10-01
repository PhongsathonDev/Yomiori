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

function copyDataFiles(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  const allowedExts = ['.json', '.webp', '.png', '.jpg', '.jpeg', '.svg'];
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDataFiles(srcPath, destPath);
    } else if (entry.isFile() && allowedExts.some(ext => entry.name.toLowerCase().endsWith(ext))) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDataFiles(srcDataDir, distDataDir);
console.log('✅ Exported JSON chapters, images & metadata to dist/data for Mobile App CDN.');

// Generate chapter manifest for each novel so mobile app can dynamically discover all available chapters
const novelsDir = path.join(distDataDir, 'novels');
if (fs.existsSync(novelsDir)) {
  const novels = fs.readdirSync(novelsDir, { withFileTypes: true });
  for (const n of novels) {
    if (n.isDirectory()) {
      const chaptersDir = path.join(novelsDir, n.name, 'chapters');
      if (fs.existsSync(chaptersDir)) {
        const chapterFiles = fs.readdirSync(chaptersDir)
          .filter((f) => f.startsWith('ch-') && f.endsWith('.json'))
          .sort((a, b) => {
            const numA = parseInt(a.replace('ch-', '').replace('.json', ''), 10);
            const numB = parseInt(b.replace('ch-', '').replace('.json', ''), 10);
            return numA - numB;
          });

        const chapterList = [];
        for (const file of chapterFiles) {
          try {
            const content = JSON.parse(fs.readFileSync(path.join(chaptersDir, file), 'utf8'));
            chapterList.push({
              id: content.id || file.replace('.json', ''),
              chapterNumber: content.chapterNumber,
              title: content.title || `ตอนที่ ${content.chapterNumber}`,
            });
          } catch {
            const num = parseInt(file.replace('ch-', '').replace('.json', ''), 10);
            chapterList.push({
              id: file.replace('.json', ''),
              chapterNumber: num,
              title: `ตอนที่ ${num}`,
            });
          }
        }

        let illustrations = [];
        const illustJsonPath = path.join(novelsDir, n.name, 'illustrations.json');
        if (fs.existsSync(illustJsonPath)) {
          try {
            illustrations = JSON.parse(fs.readFileSync(illustJsonPath, 'utf8'));
          } catch (e) {
            console.warn(`Failed to parse illustrations.json for ${n.name}:`, e.message);
          }
        }

        let characters = [];
        const charJsonPath = path.join(novelsDir, n.name, 'characters.json');
        if (fs.existsSync(charJsonPath)) {
          try {
            characters = JSON.parse(fs.readFileSync(charJsonPath, 'utf8'));
          } catch (e) {
            console.warn(`Failed to parse characters.json for ${n.name}:`, e.message);
          }
        }

        const manifest = {
          novelId: n.name,
          totalAvailable: chapterList.length,
          chapters: chapterList,
          illustrations,
          characters,
          updatedAt: new Date().toISOString(),
        };

        fs.writeFileSync(
          path.join(novelsDir, n.name, 'manifest.json'),
          JSON.stringify(manifest, null, 2),
          'utf8'
        );
        console.log(`✅ Generated manifest.json for ${n.name}: ${chapterList.length} chapters.`);
      }
    }
  }
}
