import { readFile, readdir, writeFile } from 'node:fs/promises';
import model from './wayfinder-model.cjs';

const root = new URL('../', import.meta.url);
const issueDir = new URL('.wayfinder/issues/', root);
const items = await Promise.all((await readdir(issueDir)).filter(name => /^WF-\d+\.md$/.test(name)).sort().map(async name =>
  model.parse(await readFile(new URL(name, issueDir), 'utf8'), `https://github.com/PhongsathonDev/Yomiori/blob/main/.wayfinder/issues/${name}`)));
const { errors } = model.build(items);
if (errors.length) throw Error(errors.join('\n'));
const path = new URL('tasks.html', root);
const html = await readFile(path, 'utf8');
const safe = text => text.replace(/</g, '\\u003c');
const core = await readFile(new URL('scripts/wayfinder-model.cjs', root), 'utf8');
const next = html.replace(/<!-- GENERATED START -->[\s\S]*?<!-- GENERATED END -->/, () => `<!-- GENERATED START -->\n<script id="task-model">\n${core}\n</script>\n<script id="task-snapshot" type="application/json">${safe(JSON.stringify(items))}</script>\n<!-- GENERATED END -->`);
if (!html.includes('<!-- GENERATED START -->')) throw Error('Missing dashboard generation markers');
if (process.argv.includes('--check')) {
  if (html !== next) throw Error('tasks.html ไม่ตรงกับ tracker/model: รัน node scripts/update-task-dashboard.mjs');
  console.log(`Dashboard/tracker validated: ${items.length} issues`);
} else {
  await writeFile(path, next);
  console.log(`Updated standalone dashboard: ${items.length} issues`);
}
