import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fileHash, invariant, jsonHash, readJson, writeJson } from './conversion-core.mjs';

const reviewPath = (ctx, source) => path.join(ctx.stateDir, 'source-reviews', `${source.sourceId}.json`);
const isText = value => typeof value === 'string' && Boolean(value.trim());
const label = (ctx, source) => `${ctx.novelId}/${source.sourceId} (${source.file})`;

// Only v1 source revisions already certified at rollout are exempt. A converter
// running old code cannot grant an exemption by minting another v1 receipt.
const rolloutCommit = '79a6ce7b707fa47bb28c03721d856ad5fc1818a3';
const checkoutRoot = fileURLToPath(new URL('../../', import.meta.url));
const rolloutReceipts = new Map();

export function isGrandfatheredSource(ctx, source) {
  const file = `.conversion/${ctx.novelId}/receipts/${source.outputId}.json`;
  if (!rolloutReceipts.has(file)) {
    let receipt;
    try {
      receipt = JSON.parse(execFileSync('git', ['show', `${rolloutCommit}:${file}`], {
        cwd: checkoutRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      }));
    } catch (error) {
      if (error.status !== 128) throw error;
      try {
        execFileSync('git', ['cat-file', '-e', `${rolloutCommit}^{commit}`], { cwd: checkoutRoot, stdio: 'ignore' });
      } catch (cause) {
        throw new Error(`Cannot verify pre-rollout receipts; Git history must include ${rolloutCommit}`, { cause });
      }
    }
    rolloutReceipts.set(file, receipt);
  }
  const receipt = rolloutReceipts.get(file);
  return receipt?.version === 1 && receipt.sourceId === source.sourceId && receipt.sourceSha256 === source.sourceSha256;
}

export function warnOnShortSource(source, parsed) {
  const textChars = parsed.tokens.reduce((size, token) => size + (token.type === 'text' ? token.text.length : 0), 0);
  if (textChars >= 300) return null;
  return { sourceId: source.sourceId, file: source.file, code: 'short-source', textChars,
    illustrationCount: parsed.tokens.filter(token => token.type === 'illustration').length };
}

export function recordSourceReview(ctx, source, { sourceSha256, reference, reviewedBy, note }) {
  invariant(/^[0-9a-f]{64}$/.test(sourceSha256) && sourceSha256 === fileHash(source.sourcePath),
    `Source review SHA-256 is missing or stale for ${label(ctx, source)}; inspect and compare the current source again`);
  invariant([reference, reviewedBy, note].every(isText), 'Source review requires --reference, --reviewed-by and --reason');
  const review = { version: 1, sourceId: source.sourceId, sourceSha256,
    reference: reference.trim(), reviewedBy: reviewedBy.trim(), note: note.trim() };
  writeJson(reviewPath(ctx, source), review);
  return review;
}

export function requireSourceReview(ctx, source) {
  let review;
  const chapter = label(ctx, source);
  try { review = readJson(reviewPath(ctx, source)); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Missing source review for ${chapter}; compare upstream and run source-review`);
    throw new Error(`Unreadable source review for ${chapter}: ${error.message}`, { cause: error });
  }
  invariant(review?.version === 1 && review.sourceId === source.sourceId && review.sourceSha256 === source.sourceSha256 &&
    [review.reference, review.reviewedBy, review.note].every(isText),
  `Stale or invalid source review for ${chapter}; compare upstream and run source-review again`);
  return jsonHash(review);
}
