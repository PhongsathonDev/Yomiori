import fs from 'fs';
import path from 'path';

const charactersPath = 'src/data/novels/kyudo-senpai/characters.json';
const charactersData = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));
const validCharacterIds = new Set(charactersData.map(c => c.id));
// Also add 'unknown' or any generic if allowed, but we want to detect if unknown exists
console.log('Known character IDs:', Array.from(validCharacterIds));

const rawDir = '../novels_source/kyudo-senpai/raw_chapters';
const chaptersDir = 'src/data/novels/kyudo-senpai/chapters';

function cleanText(str) {
  return str
    .replace(/^#.*$/gm, '')
    .replace(/^By\s+.*$/gm, '')
    .replace(/^AI-POWERED.*$/gm, '')
    .replace(/[\r\n\t\s]+/g, '')
    .replace(/[“”"']/g, '')
    .replace(/[——–-]/g, '')
    .trim();
}

const rawFiles = fs.readdirSync(rawDir);
const report = [];

for (let chNum = 1; chNum <= 25; chNum++) {
  const padNum = String(chNum).padStart(2, '0');
  const jsonPath = path.join(chaptersDir, `ch-${padNum}.json`);
  
  // Find raw file
  const rawFile = rawFiles.find(f => {
    const match = f.match(/^Ch[._](\d+)/i);
    return match && parseInt(match[1], 10) === chNum;
  });

  if (!rawFile) {
    report.push({ chNum, error: `Raw file for Ch.${chNum} not found` });
    continue;
  }
  if (!fs.existsSync(jsonPath)) {
    report.push({ chNum, error: `JSON file ${jsonPath} not found` });
    continue;
  }

  const rawPath = path.join(rawDir, rawFile);
  const rawContent = fs.readFileSync(rawPath, 'utf8');
  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const rawClean = cleanText(rawContent);
  const blocks = jsonContent.blocks || [];
  
  const jsonAllText = blocks
    .filter(b => b.type === 'narration' || b.type === 'dialogue')
    .map(b => b.text || '')
    .join('');
  const jsonClean = cleanText(jsonAllText);

  const rawLen = rawClean.length;
  const jsonLen = jsonClean.length;
  const ratio = ((jsonLen / (rawLen || 1)) * 100).toFixed(2);
  const diffChars = Math.abs(rawLen - jsonLen);

  const unknownSpeakers = [];
  const invalidSpeakerIds = [];
  const missingNames = [];

  let narrationCount = 0;
  let dialogueCount = 0;
  let sceneBreakCount = 0;

  blocks.forEach((b, idx) => {
    if (b.type === 'narration') narrationCount++;
    else if (b.type === 'dialogue') {
      dialogueCount++;
      if (!b.speakerId || b.speakerId === 'unknown') {
        unknownSpeakers.push({ blockId: b.id, text: b.text });
      } else if (!validCharacterIds.has(b.speakerId)) {
        invalidSpeakerIds.push({ blockId: b.id, speakerId: b.speakerId, text: b.text });
      }
      if (!b.speakerName) {
        missingNames.push({ blockId: b.id, text: b.text });
      }
    } else if (b.type === 'scene_break') {
      sceneBreakCount++;
    }
  });

  report.push({
    chNum,
    id: jsonContent.id,
    title: jsonContent.title,
    blocksCount: blocks.length,
    narrationCount,
    dialogueCount,
    sceneBreakCount,
    rawChars: rawLen,
    jsonChars: jsonLen,
    ratio: `${ratio}%`,
    diffChars,
    isFidelityPass: parseFloat(ratio) >= 97 && parseFloat(ratio) <= 103,
    unknownSpeakers,
    invalidSpeakerIds,
    missingNames
  });
}

console.log(JSON.stringify(report, null, 2));
