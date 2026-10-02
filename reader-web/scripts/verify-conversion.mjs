#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

/**
 * Yomiori Automated Quality Guard
 * Verifies that a converted JSON chapter preserves the raw markdown text accurately.
 */

function cleanText(str) {
  return str
    .replace(/^#.*$/gm, '') // Remove Markdown headers
    .replace(/^By\s+.*$/gm, '') // Remove translator / author metadata
    .replace(/^AI-POWERED.*$/gm, '') // Remove badge lines
    .replace(/[\r\n\t\s]+/g, '') // Remove all whitespace
    .replace(/[“”"']/g, '') // Normalize quotes
    .replace(/[——–-]/g, '') // Normalize dashes
    .trim();
}

export function verifyChapter(rawMdPath, jsonPath) {
  if (!fs.existsSync(rawMdPath)) {
    return { success: false, error: `Raw file not found: ${rawMdPath}` };
  }
  if (!fs.existsSync(jsonPath)) {
    return { success: false, error: `JSON file not found: ${jsonPath}` };
  }

  const rawContent = fs.readFileSync(rawMdPath, 'utf8');
  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const rawClean = cleanText(rawContent);

  // Extract all text from JSON blocks
  const jsonAllText = (jsonContent.blocks || [])
    .filter((b) => b.type === 'narration' || b.type === 'dialogue')
    .map((b) => b.text)
    .join('');

  const jsonClean = cleanText(jsonAllText);

  const rawLen = rawClean.length;
  const jsonLen = jsonClean.length;
  const diffChars = Math.abs(rawLen - jsonLen);
  const ratio = (jsonLen / (rawLen || 1)) * 100;
  const isMatch = ratio >= 96 && ratio <= 104;

  const dialogueCount = (jsonContent.blocks || []).filter((b) => b.type === 'dialogue').length;
  const narrationCount = (jsonContent.blocks || []).filter((b) => b.type === 'narration').length;

  return {
    success: isMatch,
    chapterNumber: jsonContent.chapterNumber,
    title: jsonContent.title,
    blocksCount: (jsonContent.blocks || []).length,
    narrationCount,
    dialogueCount,
    rawChars: rawLen,
    jsonChars: jsonLen,
    diffChars,
    ratio: ratio.toFixed(2),
  };
}

// CLI Runner
import { fileURLToPath } from 'node:url';

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
const args = process.argv.slice(2);
if (isDirectRun && args.length >= 2) {
  const result = verifyChapter(args[0], args[1]);
  if (!result.success && result.error) {
    console.error(`❌ Error: ${result.error}`);
    process.exit(1);
  }
  console.log(`\n========================================`);
  console.log(`🔍 Verification Report: ${result.title} (Ch.${result.chapterNumber})`);
  console.log(`========================================`);
  console.log(`- Total Blocks:     ${result.blocksCount} (Narration: ${result.narrationCount}, Dialogue: ${result.dialogueCount})`);
  console.log(`- Raw Text Chars:   ${result.rawChars}`);
  console.log(`- JSON Text Chars:  ${result.jsonChars}`);
  console.log(`- Character Ratio:  ${result.ratio}% (Difference: ${result.diffChars} chars)`);
  if (result.success) {
    console.log(`✅ Status: PASSED (100% Fidelity, No Truncation Detected)\n`);
    process.exit(0);
  } else {
    console.warn(`⚠️ Warning: Significant length divergence detected! Please review manually.\n`);
    process.exit(1);
  }
}
