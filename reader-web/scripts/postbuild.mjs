import fs from 'node:fs';
import path from 'node:path';
import { invariant, readJson, validateStructure, validateRoster } from './conversion-core.mjs';
import { writeRelease } from './verify-release.mjs';

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
            const aa = readJson(path.join(chaptersDir, a));
            const bb = readJson(path.join(chaptersDir, b));
            return aa.chapterNumber - bb.chapterNumber || aa.id.localeCompare(bb.id);
          });

        const chapterList = [];
        for (const file of chapterFiles) {
          const content = readJson(path.join(chaptersDir, file));
          validateStructure(content);
          invariant(content.novelId === n.name && file === `${content.id}.json`, `Chapter identity mismatch: ${n.name}/${file}`);
          invariant(!chapterList.some(c => c.id === content.id), 'Duplicate chapter ID');
          chapterList.push({ id: content.id, chapterNumber: content.chapterNumber, title: content.title });
        }

        let illustrations = [];
        const illustJsonPath = path.join(novelsDir, n.name, 'illustrations.json');
        if (fs.existsSync(illustJsonPath)) {
          illustrations = readJson(illustJsonPath);
          invariant(Array.isArray(illustrations), `Invalid illustration metadata: ${n.name}`);
        }

        const charJsonPath = path.join(novelsDir, n.name, 'characters.json');
        const characters = readJson(charJsonPath);
        validateRoster(characters);

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
writeRelease(distDir);
