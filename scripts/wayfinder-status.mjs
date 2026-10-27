import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = new URL('../.wayfinder/issues/', import.meta.url);
const mapId = process.argv[2];
const showAll = process.argv.includes('--all');
if (!/^WF-\d+$/.test(mapId ?? '')) {
  console.error('Usage: node scripts/wayfinder-status.mjs <map-id> [--all]');
  process.exit(1);
}

const issues = new Map();
for (const filename of (await readdir(directory)).sort()) {
  if (!filename.endsWith('.md')) continue;
  const url = new URL(filename, directory);
  const body = await readFile(url, 'utf8');
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(body)?.[1] ?? '';
  const fields = Object.fromEntries([...frontmatter.matchAll(/^([a-z_]+):[ \t]*(.*)$/gm)].map(match => [match[1], match[2].trim()]));
  const dependencySection = body.split(/^## Blocked by\r?$/m)[1]?.split(/^## /m)[0] ?? '';
  const blockers = [...dependencySection.matchAll(/\]\((WF-\d+)\.md\)/g)].map(match => match[1]);
  issues.set(fields.id, { ...fields, blockers, path: fileURLToPath(url) });
}

const map = issues.get(mapId);
if (!map || map.labels !== 'wayfinder:map') {
  console.error('The requested map does not exist.');
  process.exit(1);
}

console.log(map.title);
let count = 0;
for (const issue of issues.values()) {
  if (issue.parent !== mapId) continue;
  const unresolved = issue.blockers.filter(id => issues.get(id)?.state !== 'closed');
  const frontier = issue.state === 'open' && !issue.assignee && unresolved.length === 0;
  if (!showAll && !frontier) continue;
  count++;
  console.log(`\n${issue.title} (${issue.labels}; ${issue.state}; ${issue.assignee || 'unclaimed'})`);
  console.log(`  ${issue.path}`);
  for (const blocker of unresolved) console.log(`  Blocked by: ${issues.get(blocker)?.title ?? 'Missing dependency'}`);
}
if (!count) console.log('No matching tickets.');
