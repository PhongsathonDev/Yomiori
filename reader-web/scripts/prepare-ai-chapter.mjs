import fs from 'fs';
import path from 'path';

const rawDir = path.resolve(import.meta.dirname, '../../novels_source/kyudo-senpai');

export function prepareChapterForAI(chNum) {
  const files = fs.readdirSync(rawDir);
  const rawFile = files.find(f => {
    const m = f.match(/^Ch[._](\d+)/i);
    return m && parseInt(m[1], 10) === chNum;
  });

  if (!rawFile) return null;

  const rawPath = path.join(rawDir, rawFile);
  const rawContent = fs.readFileSync(rawPath, 'utf8');

  let title = `ตอนที่ ${chNum}`;
  const titleMatch = rawContent.match(/^#\s*(Ch[._]\d+.*?)$/m);
  if (titleMatch) title = titleMatch[1].trim();

  const lines = rawContent.split(/\r?\n/);
  const paragraphs = [];
  let current = [];

  for (let l of lines) {
    l = l.trim();
    if (!l) {
      if (current.length) {
        paragraphs.push(current.join(' '));
        current = [];
      }
      continue;
    }
    if (l.startsWith('#') || l.startsWith('By ') || l.startsWith('AI-POWERED')) continue;
    if (paragraphs.length === 0 && (l === title || l.startsWith(`Ch.${chNum}`) || l.startsWith(`Ch_${chNum}`) || l.startsWith(`ตอนที่ ${chNum}`))) continue;
    current.push(l);
  }
  if (current.length) paragraphs.push(current.join(' '));

  const dialogues = [];
  const annotatedTextLines = [];
  let dCount = 1;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const quotes = para.match(/“[^”]+”/g);

    if (para.startsWith('“') && para.endsWith('”') && quotes && quotes.length === 1) {
      const dId = `d${dCount++}`;
      dialogues.push({ id: dId, paraIndex: i, text: para });
      annotatedTextLines.push(`[${dId}] ${para}`);
    } else if (para.startsWith('“') && quotes && quotes.length > 1) {
      let annotatedPara = para;
      for (const q of quotes) {
        const dId = `d${dCount++}`;
        dialogues.push({ id: dId, paraIndex: i, text: q });
        annotatedPara = annotatedPara.replace(q, `[${dId}] ${q}`);
      }
      annotatedTextLines.push(annotatedPara);
    } else {
      annotatedTextLines.push(para);
    }
  }

  return {
    chNum,
    title,
    rawParagraphs: paragraphs,
    dialogues,
    annotatedText: annotatedTextLines.join('\n\n')
  };
}

if (process.argv[2]) {
  const ch = parseInt(process.argv[2], 10);
  const res = prepareChapterForAI(ch);
  if (res) {
    console.log(`=== Chapter ${ch}: ${res.dialogues.length} dialogues ===\n`);
    console.log(res.annotatedText);
  }
}
