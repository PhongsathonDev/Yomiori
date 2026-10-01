#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const NOVEL_ID = 'kyudo-senpai';
const RAW_DIR = path.resolve('../novels_source', NOVEL_ID, 'raw_chapters');
const DATA_DIR = path.resolve('src/data/novels', NOVEL_ID, 'chapters');
const CHAR_PATH = path.resolve('src/data/novels', NOVEL_ID, 'characters.json');

const characters = JSON.parse(fs.readFileSync(CHAR_PATH, 'utf8'));

// Helper to find character by id or alias
function findChar(query) {
  if (!query) return null;
  const q = query.toLowerCase();
  return characters.find(
    (c) =>
      c.id.toLowerCase() === q ||
      c.name.toLowerCase().includes(q) ||
      (c.aliases && c.aliases.some((a) => a.toLowerCase().includes(q)))
  );
}

const rawFiles = fs.readdirSync(RAW_DIR);

function cleanTextForFidelity(str) {
  return str
    .replace(/^#.*$/gm, '')
    .replace(/^By\s+.*$/gm, '')
    .replace(/^AI-POWERED.*$/gm, '')
    .replace(/[\r\n\t\s]+/g, '')
    .replace(/[“”"']/g, '')
    .replace(/[——–-]/g, '')
    .trim();
}

export function convertChapter(chNum) {
  const pad = String(chNum).padStart(2, '0');
  const rawFile = rawFiles.find((f) => {
    const m = f.match(/^Ch[._](\d+)/i);
    return m && parseInt(m[1], 10) === chNum;
  });

  if (!rawFile) {
    console.error(`❌ Raw file for Ch.${chNum} not found.`);
    return null;
  }

  const rawPath = path.join(RAW_DIR, rawFile);
  const rawContent = fs.readFileSync(rawPath, 'utf8');

  // Extract title
  let title = `ตอนที่ ${chNum}`;
  const titleMatch = rawContent.match(/^#\s*(Ch[._]\d+.*?)$/m);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Split lines
  const lines = rawContent.split(/\r?\n/);
  const rawParagraphs = [];
  let currentPara = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (currentPara.length > 0) {
        rawParagraphs.push(currentPara.join(' '));
        currentPara = [];
      }
      continue;
    }
    // Skip headers and metadata lines
    if (line.startsWith('#') || line.startsWith('By ') || line.startsWith('AI-POWERED')) {
      continue;
    }
    currentPara.push(line);
  }
  if (currentPara.length > 0) {
    rawParagraphs.push(currentPara.join(' '));
  }

  const blocks = [];
  let blockIndex = 1;
  let lastSpeakerId = null;
  let activeParticipants = ['toya', 'rino'];

  for (let i = 0; i < rawParagraphs.length; i++) {
    const para = rawParagraphs[i];

    // Check scene break
    if (/^[◆❖*–—\-•\s]{3,}$/.test(para) || para === '◆ ◆ ◆' || para === '❖ ❖ ❖') {
      blocks.push({
        id: `b${chNum}-${blockIndex++}`,
        type: 'scene_break',
        symbol: para,
      });
      lastSpeakerId = null;
      continue;
    }

    // Check if paragraph is dialogue or contains dialogue lines
    // Often a paragraph might have multiple dialogue turns:
    // e.g. "“พูด 1”\n“พูด 2”" or inline
    const dialogueMatches = para.match(/“[^”]+”/g);

    if (para.startsWith('“') && para.endsWith('”') && dialogueMatches && dialogueMatches.length === 1) {
      // Pure single dialogue line
      const speaker = determineSpeaker(para, rawParagraphs, i, lastSpeakerId, activeParticipants);
      lastSpeakerId = speaker.id;
      if (!activeParticipants.includes(speaker.id)) {
        activeParticipants.push(speaker.id);
      }

      blocks.push({
        id: `b${chNum}-${blockIndex++}`,
        type: 'dialogue',
        speakerId: speaker.id,
        speakerName: speaker.name,
        text: para,
      });
    } else if (dialogueMatches && dialogueMatches.length > 1 && para.startsWith('“')) {
      // Paragraph with multiple back-to-back dialogue quotes
      // Split by quote
      let remaining = para;
      for (const quote of dialogueMatches) {
        const speaker = determineSpeaker(quote, rawParagraphs, i, lastSpeakerId, activeParticipants);
        lastSpeakerId = speaker.id;
        blocks.push({
          id: `b${chNum}-${blockIndex++}`,
          type: 'dialogue',
          speakerId: speaker.id,
          speakerName: speaker.name,
          text: quote,
        });
      }
    } else {
      // Narration block
      blocks.push({
        id: `b${chNum}-${blockIndex++}`,
        type: 'narration',
        text: para,
      });

      // Update scene context from narration
      if (para.includes('รุ่นพี่วาตานูกิ') || para.includes('ริโนะ')) {
        if (!activeParticipants.includes('rino')) activeParticipants.push('rino');
      }
      if (para.includes('เมอิ') || para.includes('พี่สาว')) {
        if (!activeParticipants.includes('mei')) activeParticipants.push('mei');
      }
      if (para.includes('ชิออน')) {
        if (!activeParticipants.includes('shion')) activeParticipants.push('shion');
      }
      if (para.includes('อายาโมริ')) {
        if (!activeParticipants.includes('ayamori')) activeParticipants.push('ayamori');
      }
      if (para.includes('อูรูชิบาระ') || para.includes('อุรุชิบาระ')) {
        if (!activeParticipants.includes('urushibara')) activeParticipants.push('urushibara');
      }
    }
  }

  const chapterData = {
    id: `ch-${pad}`,
    novelId: NOVEL_ID,
    chapterNumber: chNum,
    title,
    novelTitle: '(WN) รุ่นพี่สาวสวยจากชมรมยิงธนู ผมนอนในห้องของผมโดยที่ท้องของเธอเปิดโล่ง',
    blocks,
  };

  // Verify fidelity
  const rawClean = cleanTextForFidelity(rawContent);
  const jsonAllText = blocks
    .filter((b) => b.type === 'narration' || b.type === 'dialogue')
    .map((b) => b.text)
    .join('');
  const jsonClean = cleanTextForFidelity(jsonAllText);

  const ratio = (jsonClean.length / (rawClean.length || 1)) * 100;
  const isMatch = ratio >= 97 && ratio <= 103;

  return {
    chapterData,
    fidelity: {
      rawLen: rawClean.length,
      jsonLen: jsonClean.length,
      ratio: ratio.toFixed(2),
      isMatch,
      blocksCount: blocks.length,
      dialogueCount: blocks.filter((b) => b.type === 'dialogue').length,
      narrationCount: blocks.filter((b) => b.type === 'narration').length,
    },
  };
}

function determineSpeaker(quote, paragraphs, currentIndex, lastSpeakerId, activeParticipants) {
  const text = quote;
  const prevPara = currentIndex > 0 ? paragraphs[currentIndex - 1] : '';
  const nextPara = currentIndex < paragraphs.length - 1 ? paragraphs[currentIndex + 1] : '';

  // 1. Check preceding narration hints
  if (prevPara) {
    if (/รุ่นพี่วาตานูกิ|ริโนะ|ประธานชมรม|เธอ|รุ่นพี่/.test(prevPara) && /พูด|เอ่ย|ตอบ|ถาม|หัวเราะ|ยิ้ม|พึมพำ|กระซิบ|บ่น|ทัก/.test(prevPara)) {
      if (!/ผม.*(พูด|เอ่ย|ตอบ|ถาม)/.test(prevPara)) {
        return findChar('rino');
      }
    }
    if (/เมอิ|พี่สาว|พี่เมอิ/.test(prevPara) && /พูด|เอ่ย|ตอบ|ถาม|ร้อง|ชู|บ่น|ทัก/.test(prevPara)) {
      return findChar('mei');
    }
    if (/ชิออน/.test(prevPara) && /พูด|เอ่ย|ตอบ|ถาม|บ่น|ถอนหายใจ|ทัก/.test(prevPara)) {
      return findChar('shion');
    }
    if (/อายาโมริ/.test(prevPara) && /พูด|เอ่ย|ตอบ|ถาม|ทัก/.test(prevPara)) {
      return findChar('ayamori');
    }
    if (/อูรูชิบาระ|อุรุชิบาระ/.test(prevPara) && /พูด|เอ่ย|ตอบ|ถาม/.test(prevPara)) {
      return findChar('urushibara');
    }
    if (/ผม|ตัวผม/.test(prevPara) && /พูด|เอ่ย|ตอบ|ถาม|พึมพำ|ตะโกน|ทัก|แก้ตัว/.test(prevPara)) {
      return findChar('toya');
    }
  }

  // 2. In-dialogue characteristic phrases
  if (text.includes('อาเมโมโตะคุง') || text.includes('เมอิซัง') || text.includes('ชิออน')) {
    return findChar('rino');
  }
  if (text.includes('โทยะ') || text.includes('พี่สาว') || text.includes('น้องชาย') || text.includes('คุณวาตานูกิ')) {
    return findChar('mei');
  }
  if (text.includes('รุ่นพี่วาตานูกิ') || text.includes('พี่เมอิ') || text.includes('ครับ')) {
    return findChar('toya');
  }
  if (text.includes('รุ่นพี่อายาโมริ') || text.includes('อาเมโมโตะ')) {
    if (activeParticipants.includes('shion')) return findChar('shion');
    if (activeParticipants.includes('urushibara')) return findChar('urushibara');
  }

  // 3. Conversational Turn-Taking (Alternating dialogue)
  if (lastSpeakerId) {
    if (lastSpeakerId === 'toya') {
      // If Toya just spoke, opponent speaks
      const other = activeParticipants.find((p) => p !== 'toya') || 'rino';
      return findChar(other) || findChar('rino');
    } else {
      // If someone else spoke, likely Toya responds
      return findChar('toya');
    }
  }

  // Default fallback to Toya
  return findChar('toya');
}

// CLI Execution
const start = parseInt(process.argv[2] || '26', 10);
const end = parseInt(process.argv[3] || '40', 10);

console.log(`\n======================================================`);
console.log(`🚀 Yomiori Batch Chapter Conversion [Ch.${start} - Ch.${end}]`);
console.log(`======================================================`);

let successCount = 0;
for (let c = start; c <= end; c++) {
  const result = convertChapter(c);
  if (result) {
    const { chapterData, fidelity } = result;
    const destPath = path.join(DATA_DIR, `${chapterData.id}.json`);
    fs.writeFileSync(destPath, JSON.stringify(chapterData, null, 2), 'utf8');

    const statusIcon = fidelity.isMatch ? '✅' : '⚠️';
    console.log(
      `${statusIcon} Ch.${c}: ${fidelity.blocksCount} blocks (${fidelity.narrationCount} nar, ${fidelity.dialogueCount} dial) | Ratio: ${fidelity.ratio}%`
    );
    successCount++;
  }
}

console.log(`\n🎉 Successfully converted ${successCount} chapters!`);
console.log(`======================================================\n`);
