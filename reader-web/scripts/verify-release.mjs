import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { hash, readJson, invariant, writeJson } from './conversion-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function listFiles(directory, prefix) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = `${prefix}/${entry.name}`;
    return entry.isDirectory() ? listFiles(path.join(directory, entry.name), relative) : [relative];
  });
}

export function writeRelease(dist, commit = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()) {
  const files = [...listFiles(path.join(dist, 'data'), 'data'), ...listFiles(path.join(dist, 'illustrations'), 'illustrations')]
    .filter(file => file !== 'data/release.json').sort().map(file => ({ path: file, sha256: hash(fs.readFileSync(path.join(dist, file))) }));
  const release = { version: 1, commit, files };
  writeJson(path.join(dist, 'data/release.json'), release);
  return release;
}

export async function verifyRelease(dist, baseUrl, { fetchImpl = fetch, attempts = 12, wait = delay, interval = 5000, concurrency = 6 } = {}) {
  const expected = readJson(path.join(dist, 'data/release.json'));
  const base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  invariant(['https:', 'http:'].includes(base.protocol), 'Release URL must use HTTP(S)');
  const get = async (relative, retries, validate) => {
    let lastError;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const url = new URL(relative.split('/').map(encodeURIComponent).join('/'), base); url.searchParams.set('release', expected.commit);
        const response = await fetchImpl(url, { signal: AbortSignal.timeout(20000), cache: 'no-store' });
        invariant(response.ok, `HTTP ${response.status}: ${relative}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        validate(bytes); return;
      } catch (error) { lastError = error; if (attempt + 1 < retries) await wait(interval); }
    }
    throw lastError;
  };
  await get('data/release.json', attempts, bytes => {
    invariant(JSON.stringify(JSON.parse(bytes)) === JSON.stringify(expected), 'CDN still serves a different commit/release inventory');
  });
  let cursor = 0, checked = 0;
  const workers = await Promise.allSettled(Array.from({ length: concurrency }, async () => {
    while (cursor < expected.files.length) {
      const file = expected.files[cursor++];
      await get(file.path, Math.min(attempts, 3), bytes => invariant(hash(bytes) === file.sha256, `CDN checksum mismatch: ${file.path}`));
      checked++;
    }
  }));
  const failed = workers.filter(worker => worker.status === 'rejected');
  invariant(failed.length === 0, failed.map(worker => worker.reason.message).join('\n'));
  return { commit: expected.commit, checkedFiles: checked };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [baseUrl, dist = 'dist'] = process.argv.slice(2);
  if (!baseUrl) { console.error('Usage: verify-release.mjs <CDN base URL> [dist directory]'); process.exitCode = 1; }
  else verifyRelease(path.resolve(dist), baseUrl).then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
