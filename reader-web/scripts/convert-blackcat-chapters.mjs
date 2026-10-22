#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Converts the raw Nekopost markdown of "black-cat-hangout" into reader JSON.
 * Speaker assignment is explicit per paragraph index so nothing is guessed.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.resolve(__dirname, '../../novels_source/black-cat-hangout/raw_chapters');
const OUT_DIR = path.resolve(__dirname, '../src/data/novels/black-cat-hangout/chapters');

const NOVEL_ID = 'black-cat-hangout';
const NOVEL_TITLE = '[WN] พอเก็บแมวดำมาเลี้ยง บ้านผมก็กลายเป็นแหล่งรวมตัวของสองสาวสวยไปซะแล้ว';

const characters = {
  takumi: 'นากาโนะ ทาคุมิ',
  hina: 'อามาโนะ ฮินะ',
  mizuki: 'โคคาเงะ มิซึกิ',
};

const chapters = [
  {
    number: 1,
    file: 'Ch_01_อามาโนะ ฮินะ กับ โคคาเงะ มิซึกิ.md',
    out: 'ch-01.json',
    speakers: {
      3: 'hina',
      22: 'mizuki',
      32: 'hina',
      36: 'mizuki',
      37: 'hina',
      38: 'mizuki',
      39: 'hina',
      40: 'mizuki',
      45: 'hina',
      46: 'mizuki',
      47: 'hina',
      48: 'mizuki',
    },
  },
  {
    number: 2,
    file: 'Ch_02_ผม ลูกแมว และคุณโคคาเงะ.md',
    out: 'ch-02.json',
    speakers: {
      2: 'takumi',
      6: 'takumi',
      11: 'takumi',
      14: 'takumi',
      21: 'takumi',
      33: 'mizuki',
      39: 'takumi',
      42: 'mizuki',
      43: 'takumi',
      44: 'mizuki',
      45: 'takumi',
      52: 'takumi',
      56: 'mizuki',
      57: 'takumi',
      62: 'mizuki',
      66: 'takumi',
      67: 'mizuki',
    },
  },
  {
    number: 3,
    file: 'Ch_03_คุณโคคาเงะที่ป้อนอาหารลูกแมว กับตัวผมที่คอยเฝ้ามอง.md',
    out: 'ch-03.json',
    speakers: {
      0: 'takumi',
      1: 'mizuki',
      2: 'takumi',
      10: 'mizuki',
      12: 'takumi',
      15: 'takumi',
      19: 'mizuki',
      20: 'takumi',
      29: 'mizuki',
      34: 'mizuki',
      40: 'mizuki',
      44: 'takumi',
      45: 'mizuki',
      46: 'takumi',
    },
  },
];

const HEADER_RE = /^(#\s|By\s|Published:\s|Source:\s|Ch\.\d+\s)/;

function splitParagraphs(raw) {
  const body = raw
    .split(/\r?\n/)
    .filter((line) => !HEADER_RE.test(line.trim()))
    .join('\n');
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

for (const chapter of chapters) {
  const rawPath = path.join(RAW_DIR, chapter.file);
  if (!fs.existsSync(rawPath)) throw new Error(`Raw chapter not found: ${rawPath}`);
  const raw = fs.readFileSync(rawPath, 'utf8');
  const titleLine = raw.split(/\r?\n/).find((l) => l.startsWith('# ')) || '# Ch.' + chapter.number;
  const title = titleLine.replace(/^#\s*/, '').trim();
  const paragraphs = splitParagraphs(raw);

  const blocks = [];
  const usedSpeakers = new Set();

  paragraphs.forEach((text, index) => {
    const isDialogue = text.startsWith('“');
    if (isDialogue) {
      const speakerId = chapter.speakers[index];
      if (!speakerId) {
        throw new Error(`${chapter.file}: dialogue at paragraph ${index} has no speaker: ${text.slice(0, 40)}`);
      }
      usedSpeakers.add(index);
      blocks.push({
        id: `b-${blocks.length + 1}`,
        type: 'dialogue',
        speakerId,
        speakerName: characters[speakerId],
        text,
      });
    } else {
      blocks.push({
        id: `b-${blocks.length + 1}`,
        type: 'narration',
        text,
      });
    }
  });

  for (const index of Object.keys(chapter.speakers).map(Number)) {
    if (!usedSpeakers.has(index)) {
      throw new Error(`${chapter.file}: speaker mapped at paragraph ${index}, but it is not a dialogue paragraph`);
    }
  }

  const json = {
    id: `ch-${String(chapter.number).padStart(2, '0')}`,
    novelId: NOVEL_ID,
    chapterNumber: chapter.number,
    title,
    novelTitle: NOVEL_TITLE,
    blocks,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, chapter.out), JSON.stringify(json, null, 2) + '\n', 'utf8');
  const dialogueCount = blocks.filter((b) => b.type === 'dialogue').length;
  console.log(`${chapter.out}: ${blocks.length} blocks (${dialogueCount} dialogue)`);
}
