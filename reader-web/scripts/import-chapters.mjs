#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

/**
 * Yomiori Novel Pipeline Manager
 * Inspects raw Markdown chapters from novels_source and tracks conversion status for both Web and Mobile CDN.
 */

const SCRIPT_DIR = import.meta.dirname;
const NOVEL_ID = process.argv[3] || 'kyudo-senpai';
const RAW_DIR = path.resolve(SCRIPT_DIR, '../../novels_source', NOVEL_ID, 'raw_chapters');
const DATA_DIR = path.resolve(SCRIPT_DIR, '../src/data/novels', NOVEL_ID, 'chapters');
const CHARACTERS_PATH = path.resolve(SCRIPT_DIR, '../src/data/novels', NOVEL_ID, 'characters.json');

if (!fs.existsSync(RAW_DIR)) {
  console.error(`❌ Raw chapters directory not found: ${RAW_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read raw chapter files
const rawFiles = fs
  .readdirSync(RAW_DIR)
  .filter((f) => f.endsWith('.md') && /^Ch[._]\d+/i.test(f))
  .sort((a, b) => {
    const numA = parseInt(a.match(/^Ch[._](\d+)/i)[1], 10);
    const numB = parseInt(b.match(/^Ch[._](\d+)/i)[1], 10);
    return numA - numB;
  });

// Read existing JSON chapters
const jsonFiles = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.startsWith('ch-') && f.endsWith('.json'));

const jsonChapterNumbers = new Set(
  jsonFiles.map((f) => parseInt(f.replace('ch-', '').replace('.json', ''), 10))
);

const mode = process.argv[2] || '--status';

if (mode === '--status' || mode === '-s') {
  console.log(`\n======================================================`);
  console.log(`📚 Yomiori Chapter Pipeline Status [${NOVEL_ID}]`);
  console.log(`======================================================`);
  console.log(`Total raw chapters found:      ${rawFiles.length}`);
  console.log(`Converted to JSON (Live/App):  ${jsonFiles.length}`);
  console.log(`Pending conversion:            ${rawFiles.length - jsonFiles.length}`);
  console.log(`------------------------------------------------------`);

  const pending = [];
  const ready = [];

  for (const rf of rawFiles) {
    const num = parseInt(rf.match(/^Ch[._](\d+)/i)[1], 10);
    const titleMatch = rf.replace(/^Ch[._]\d+[._]/i, '').replace('.md', '');
    if (jsonChapterNumbers.has(num)) {
      ready.push({ num, title: titleMatch });
    } else {
      pending.push({ num, title: titleMatch, file: rf });
    }
  }

  console.log(`\n✅ Ready & Live (${ready.length} chapters): Ch.1 to Ch.${Math.max(...ready.map(r => r.num))}`);
  if (pending.length > 0) {
    console.log(`\n⏳ Next chapters in queue to convert (${pending.length} chapters):`);
    pending.slice(0, 10).forEach((p) => {
      console.log(`   - Ch.${p.num}: ${p.title}`);
    });
    if (pending.length > 10) {
      console.log(`   ... and ${pending.length - 10} more chapters (up to Ch.${pending[pending.length - 1].num})`);
    }
  } else {
    console.log(`\n🎉 All chapters are converted and up-to-date!`);
  }
  console.log(`======================================================\n`);
} else if (mode === '--audit' || mode === '-a') {
  console.log(`\n🔍 Auditing all ${jsonFiles.length} converted chapters...`);
  import('./audit-all-chapters.mjs');
} else {
  console.log(`Usage:`);
  console.log(`  node scripts/import-chapters.mjs --status   (Check ready vs pending chapters)`);
  console.log(`  node scripts/import-chapters.mjs --audit    (Audit text fidelity & character speakers)`);
}
