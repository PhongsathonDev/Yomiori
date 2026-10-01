import fs from 'fs';
import path from 'path';

const rawDir = path.resolve('../novels_source/kyudo-senpai/raw_chapters');
const chaptersDir = path.resolve('src/data/novels/kyudo-senpai/chapters');

const rawFiles = fs.readdirSync(rawDir).filter(f => f.endsWith('.md') && /^Ch[._]\d+/i.test(f)).sort((a,b) => {
  const numA = parseInt(a.match(/^Ch[._](\d+)/i)[1], 10);
  const numB = parseInt(b.match(/^Ch[._](\d+)/i)[1], 10);
  return numA - numB;
});

let totalNonEmptyRawLines = 0;
let totalConvertedBlocks = 0;
const anomalies = [];

for (const rawFile of rawFiles) {
  const match = rawFile.match(/^Ch[._](\d+)/i);
  if (!match) continue;
  const num = parseInt(match[1], 10);
  const pad = String(num).padStart(2, '0');
  const jsonPath = path.join(chaptersDir, `ch-${pad}.json`);
  if (!fs.existsSync(jsonPath)) {
    anomalies.push({ chapter: num, error: 'JSON missing' });
    continue;
  }

  const rawLines = fs.readFileSync(path.join(rawDir, rawFile), 'utf8')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('---'));

  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const blocks = (jsonContent.blocks || []).filter(b => b.type === 'narration' || b.type === 'dialogue');

  totalNonEmptyRawLines += rawLines.length;
  totalConvertedBlocks += blocks.length;

  const rawCharCount = rawLines.join('').replace(/[「」『』\s\-\*—]/g, '').length;
  const jsonCharCount = blocks.map(b => b.text).join('').replace(/[「」『』\s\-\*—]/g, '').length;

  const ratio = rawCharCount > 0 ? (jsonCharCount / rawCharCount) : 1;
  // If ratio deviates by more than 2%
  if (ratio < 0.98 || ratio > 1.02) {
    anomalies.push({ chapter: num, rawCharCount, jsonCharCount, ratio: ratio.toFixed(4) });
  }
}

console.log(JSON.stringify({
  checkedRawChapters: rawFiles.length,
  totalNonEmptyRawLines,
  totalConvertedBlocks,
  anomaliesCount: anomalies.length,
  anomalies
}, null, 2));
