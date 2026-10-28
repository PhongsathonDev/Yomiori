import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import model from './wayfinder-model.cjs';

const directory = new URL('../.wayfinder/issues/', import.meta.url);
const mapId = process.argv[2];
const showAll = process.argv.includes('--all');
if (!/^WF-\d+$/.test(mapId ?? '')) {
  console.error('Usage: node scripts/wayfinder-status.mjs <map-id> [--all]');
  process.exit(1);
}

const entries = [];
for (const filename of (await readdir(directory)).sort()) {
  if (!filename.endsWith('.md')) continue;
  const url = new URL(filename, directory);
  const body = await readFile(url, 'utf8');
  entries.push({ ...model.parse(body), path: fileURLToPath(url) });
}

const graph = model.build(entries);
if (graph.errors.length) { console.error(graph.errors.join('\n')); process.exit(1); }
const issues = graph.byId;

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
  for (const companion of issue.companions) console.log(`  Work with: ${issues.get(companion)?.title ?? 'Missing companion'}`);
}
if (!count) console.log('No matching tickets.');
