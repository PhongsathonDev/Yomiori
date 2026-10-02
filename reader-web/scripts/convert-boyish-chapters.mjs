#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { verifyChapter } from './verify-conversion.mjs';

const NOVEL_ID = 'boyish-friend';
const NOVEL_TITLE = '[18+] เรื่องราวของการพรากเพื่อนสนิทสาวที่น่ารักอันดับสองในห้อง มาเป็นของตัวเองด้วยทริปทัศนศึกษาสองคืนสามวัน';
const SCRIPT_DIR = import.meta.dirname;
const RAW_DIR = path.resolve(SCRIPT_DIR, '../../novels_source', NOVEL_ID, 'raw_chapters');
const DATA_DIR = path.resolve(SCRIPT_DIR, '../src/data/novels', NOVEL_ID, 'chapters');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const rawFiles = fs
  .readdirSync(RAW_DIR)
  .filter((f) => f.endsWith('.md') && /^Ch[._]\d+/i.test(f))
  .sort((a, b) => {
    const numA = parseFloat(a.match(/^Ch[._](\d+(?:\.\d+)?)/i)[1]);
    const numB = parseFloat(b.match(/^Ch[._](\d+(?:\.\d+)?)/i)[1]);
    return numA - numB;
  });

function detectSpeaker(line, prevNarration, nextNarration, lastSpeaker) {
  const text = line.trim();
  const prev = prevNarration ? prevNarration.trim() : '';
  const next = nextNarration ? nextNarration.trim() : '';
  const context = `${prev} ${next}`;

  // Heuristic 1: Explicit mentions in adjacent narration
  if (context.includes('อายะพูด') || context.includes('อายะถาม') || context.includes('อายะตอบ') ||
      context.includes('อายะส่งเสียง') || context.includes('อายะกระซิบ') || context.includes('อายะคราง') ||
      context.includes('อายะว่า') || context.includes('อายะหัวเราะ') || context.includes('อายะบ่น') ||
      context.includes('เสียงของอายะ') || context.includes('อายะเอ่ย') || context.includes('อายะร้อง') ||
      context.includes('อายะสะอื้น') || context.includes('อายะพึมพำ')) {
    return { id: 'aya', name: 'มินะโทริ อายะ' };
  }

  if (context.includes('ฉันพูด') || context.includes('ฉันถาม') || context.includes('ฉันตอบ') ||
      context.includes('ฉันกระซิบ') || context.includes('ฉันเอ่ย') || context.includes('ฉันเลยพูด') ||
      context.includes('เสียงของฉัน') || context.includes('ฉันบ่น') || context.includes('ฉันร้อง') ||
      context.includes('ฉันหัวเราะ') || context.includes('ฉันพึมพำ')) {
    return { id: 'protagonist', name: 'โบยัน (ตัวเอก)' };
  }

  if (context.includes('โทกิตะพูด') || context.includes('โทกิตะถาม') || context.includes('โทกิตะตอบ') ||
      context.includes('โทกิตะว่า') || context.includes('เสียงของโทกิตะ')) {
    return { id: 'tokita', name: 'โทกิตะ' };
  }

  if (context.includes('พวกนั้นตกใจ') || context.includes('พวกในกลุ่ม') || context.includes('เพื่อนร่วมชั้น') ||
      context.includes('เด็กผู้ชายในห้อง') || context.includes('เพื่อนๆ') || context.includes('เพื่อนร่วมห้อง')) {
    return { id: 'classmate', name: 'เพื่อนร่วมชั้น' };
  }

  if (context.includes('มัคคุเทศก์') || context.includes('คนขับ')) {
    return { id: 'guide', name: 'มัคคุเทศก์' };
  }

  // Heuristic 2: Vocatives in dialogue
  if (text.includes('เจ้าคนเหม่อ') || text.includes('โบยัน')) {
    if (context.includes('กลุ่ม') || context.includes('พวก') || text.includes('เฮ้ย') || text.includes('พวกเรา')) {
      return { id: 'classmate', name: 'เพื่อนร่วมชั้น' };
    }
    return { id: 'aya', name: 'มินะโทริ อายะ' };
  }

  if (text.startsWith('“อายะ') || text.startsWith('"อายะ') || text.includes('นะ อายะ') || text.includes('อายะ เป็นไร')) {
    return { id: 'protagonist', name: 'โบยัน (ตัวเอก)' };
  }

  // Heuristic 3: Alternation in 2-person dialogue
  if (lastSpeaker && (lastSpeaker === 'aya' || lastSpeaker === 'protagonist')) {
    if (lastSpeaker === 'aya') {
      return { id: 'protagonist', name: 'โบยัน (ตัวเอก)' };
    } else {
      return { id: 'aya', name: 'มินะโทริ อายะ' };
    }
  }

  // Default fallback
  return { id: 'protagonist', name: 'โบยัน (ตัวเอก)' };
}

export function convertChapterFile(rf) {
  const rawPath = path.join(RAW_DIR, rf);
  const rawContent = fs.readFileSync(rawPath, 'utf8');

  const matchNum = rf.match(/^Ch[._](\d+(?:\.\d+)?)/i);
  const chapterNumber = parseFloat(matchNum[1]);
  const numStr = String(chapterNumber).includes('.') ? String(chapterNumber) : String(chapterNumber).padStart(2, '0');
  const jsonFileName = `ch-${numStr}.json`;
  const jsonPath = path.join(DATA_DIR, jsonFileName);

  const lines = rawContent.split(/\r?\n/);
  let title = '';
  const contentLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      if (!title) {
        title = line.replace(/^#+\s*/, '').trim();
      }
      continue;
    }
    if (line.startsWith('By ') || line.startsWith('AI-POWERED')) {
      continue;
    }
    contentLines.push(lines[i]);
  }

  if (!title) {
    title = rf.replace(/^Ch[._]\d+[._]/i, '').replace('.md', '');
  }

  const blocks = [];
  let blockCounter = 1;
  let lastSpeaker = null;

  for (let i = 0; i < contentLines.length; i++) {
    const rawLine = contentLines[i].trim();
    if (!rawLine) continue;

    const isDialogue = /^[“"「]/.test(rawLine);

    if (isDialogue) {
      const prevNarration = i > 0 && !/^[“"「]/.test(contentLines[i - 1].trim()) ? contentLines[i - 1] : '';
      const nextNarration = i < contentLines.length - 1 && !/^[“"「]/.test(contentLines[i + 1].trim()) ? contentLines[i + 1] : '';
      const speaker = detectSpeaker(rawLine, prevNarration, nextNarration, lastSpeaker);
      lastSpeaker = speaker.id;

      blocks.push({
        id: `b-${blockCounter++}`,
        type: 'dialogue',
        speakerId: speaker.id,
        speakerName: speaker.name,
        text: rawLine,
      });
    } else {
      blocks.push({
        id: `b-${blockCounter++}`,
        type: 'narration',
        text: rawLine,
      });
    }
  }

  const chapterData = {
    id: `ch-${numStr}`,
    novelId: NOVEL_ID,
    chapterNumber,
    title,
    novelTitle: NOVEL_TITLE,
    blocks,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(chapterData, null, 2), 'utf8');

  // Run verify
  const result = verifyChapter(rawPath, jsonPath);
  return { chapterNumber, jsonFileName, result };
}

// Parse args
const startArg = process.argv[2] ? parseFloat(process.argv[2]) : 6;
const endArg = process.argv[3] ? parseFloat(process.argv[3]) : 14;

console.log(`\n======================================================`);
console.log(`🚀 Yomiori Conversion Batch [boyish-friend] Ch.${startArg} - Ch.${endArg}`);
console.log(`======================================================\n`);

const targetFiles = rawFiles.filter(f => {
  const match = f.match(/^Ch[._](\d+(?:\.\d+)?)/i);
  if (!match) return false;
  const num = parseFloat(match[1]);
  return num >= startArg && num <= endArg;
});

const results = [];
for (const rf of targetFiles) {
  const res = convertChapterFile(rf);
  if (res) {
    results.push(res);
    const { chapterNumber, jsonFileName, result } = res;
    const statusIcon = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`[Ch.${chapterNumber}] -> ${jsonFileName} | ${statusIcon} | Ratio: ${result.ratio}% | Diff: ${result.diffChars} chars | Blocks: ${result.blocksCount} (Dia: ${result.dialogueCount}, Nar: ${result.narrationCount})`);
  }
}

// Regenerate chapters/index.ts with ALL existing json chapters
const allJsonFiles = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.startsWith('ch-') && f.endsWith('.json'))
  .sort((a, b) => {
    const numA = parseFloat(a.replace('ch-', '').replace('.json', ''));
    const numB = parseFloat(b.replace('ch-', '').replace('.json', ''));
    return numA - numB;
  });

const allExported = allJsonFiles.map(file => {
  const rawNum = file.replace('ch-', '').replace('.json', '');
  const varName = `ch${rawNum.replace('.', '_')}`;
  return { varName, file: `./${file}` };
});

const indexContent = `// Auto-generated chapters index for boyish-friend
${allExported.map(e => `import ${e.varName} from '${e.file}';`).join('\n')}
import type { Chapter } from '../../../../types';

export const boyishChapters: Chapter[] = [
${allExported.map(e => `  ${e.varName} as Chapter,`).join('\n')}
];
`;

fs.writeFileSync(path.join(DATA_DIR, 'index.ts'), indexContent, 'utf8');
console.log(`\n✅ Generated chapters/index.ts with total ${allJsonFiles.length} chapters.`);
console.log(`======================================================\n`);
