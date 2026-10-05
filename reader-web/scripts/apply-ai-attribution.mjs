import fs from 'fs';
import path from 'path';
import { prepareChapterForAI } from './prepare-ai-chapter.mjs';

const characters = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../src/data/novels/kyudo-senpai/characters.json'), 'utf8'));

function findChar(id) {
  const c = characters.find(x => x.id === id);
  if (!c) {
    if (id === 'clerk') return { id: 'clerk', name: 'พนักงาน' };
    if (id === 'meroriru') return { id: 'meroriru', name: 'เมโรริรุ' };
    if (id === 'student') return { id: 'student', name: 'นักเรียน' };
    if (id === 'basketball_guy') return { id: 'basketball_guy', name: 'สมาชิกชมรมบาสเกตบอล' };
    if (id === 'date') return { id: 'date', name: 'ดาเตะ ริฮิโตะ' };
    return { id, name: id };
  }
  return { id: c.id, name: c.name };
}

const chaptersDir = path.resolve(import.meta.dirname, '../src/data/novels/kyudo-senpai/chapters');

export function applyAIAttribution(chNum, speakerMap, dryRun = false) {
  const prep = prepareChapterForAI(chNum);
  if (!prep) throw new Error(`Could not prepare chapter ${chNum}`);

  const { title, rawParagraphs, dialogues } = prep;
  const blocks = [];
  let blockIndex = 1;



  let currentDialogueIndex = 0;

  for (let i = 0; i < rawParagraphs.length; i++) {
    const para = rawParagraphs[i];
    const quotes = para.match(/“[^”]+”/g);

    if (para.startsWith('“') && para.endsWith('”') && quotes && quotes.length === 1) {
      const d = dialogues[currentDialogueIndex++];
      const spkId = speakerMap[d.id];
      if (!spkId) throw new Error(`Missing speaker for ${d.id} in Ch.${chNum}: "${d.text}"`);

      const charInfo = findChar(spkId);
      blocks.push({
        id: `b${chNum}-${blockIndex++}`,
        type: 'dialogue',
        speakerId: charInfo.id,
        speakerName: charInfo.name,
        text: para,
      });
    } else if (para.startsWith('“') && quotes && quotes.length > 1) {
      for (let q of quotes) {
        const d = dialogues[currentDialogueIndex++];
        const spkId = speakerMap[d.id];
        if (!spkId) throw new Error(`Missing speaker for ${d.id} in Ch.${chNum}: "${d.text}"`);

        const charInfo = findChar(spkId);
        blocks.push({
          id: `b${chNum}-${blockIndex++}`,
          type: 'dialogue',
          speakerId: charInfo.id,
          speakerName: charInfo.name,
          text: q,
        });
      }
    } else {
      blocks.push({
        id: `b${chNum}-${blockIndex++}`,
        type: 'narration',
        text: para,
      });
    }
  }

  // Text fidelity check
  const rawClean = rawParagraphs.join('').replace(/\s+/g, '');
  const jsonClean = blocks.slice(1).map(b => b.text).join('').replace(/\s+/g, '');
  if (rawClean !== jsonClean) {
    throw new Error(`Text fidelity violation in Ch.${chNum}! Lengths: raw=${rawClean.length}, json=${jsonClean.length}`);
  }

  const result = {
    id: `ch-${String(chNum).padStart(2, '0')}`,
    novelId: 'kyudo-senpai',
    chapterNumber: chNum,
    title,
    novelTitle: '(WN) รุ่นพี่สาวสวยจากชมรมยิงธนู ผมนอนในห้องของผมโดยที่ท้องของเธอเปิดโล่ง',
    blocks
  };

  if (!dryRun) {
    const pad = String(chNum).padStart(2, '0');
    const outPath = path.join(chaptersDir, `ch-${pad}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  }

  return result;
}
