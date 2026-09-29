import fs from 'node:fs';
import path from 'node:path';

// Load existing helper functions
import { verifyChapter } from '../scripts/verify-conversion.mjs';

function parseChapter(rawFile, chapterNum, chapterId, title, dialogueMap) {
  const content = fs.readFileSync(rawFile, 'utf8');
  const lines = content.split(/\r?\n/);
  
  const blocks = [];
  let blockIdx = 1;

  let inHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Skip metadata headers
    if (inHeader) {
      if (rawLine.startsWith('#') || rawLine.startsWith('Ch.') || rawLine.startsWith('By ') || rawLine.startsWith('AI-POWERED')) {
        continue;
      }
      inHeader = false;
    }

    // Scene break
    if (rawLine === '◆' || rawLine === '***' || rawLine === '---' || rawLine === '===') {
      blocks.push({
        id: `b${chapterNum}-${blockIdx++}`,
        type: 'scene_break',
        symbol: rawLine
      });
      continue;
    }

    // Check if dialogue
    const isQuote = (rawLine.startsWith('“') || rawLine.startsWith('"')) && (rawLine.endsWith('”') || rawLine.endsWith('"'));
    if (isQuote) {
      const match = dialogueMap(rawLine, blockIdx, blocks);
      blocks.push({
        id: `b${chapterNum}-${blockIdx++}`,
        type: 'dialogue',
        speakerId: match.speakerId,
        speakerName: match.speakerName,
        text: rawLine
      });
    } else {
      blocks.push({
        id: `b${chapterNum}-${blockIdx++}`,
        type: 'narration',
        text: rawLine
      });
    }
  }

  return {
    id: chapterId,
    novelId: 'kyudo-senpai',
    chapterNumber: chapterNum,
    title,
    novelTitle: '(WN) รุ่นพี่สาวสวยจากชมรมยิงธนู ผมนอนในห้องของผมโดยที่ท้องของเธอเปิดโล่ง',
    blocks
  };
}

// ---------------- Chapter 4 ----------------
function mapCh4(line, idx, blocks) {
  if (line.includes('ง่วงชะมัด')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line === '“อรุณสวัสดิ์”') return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('วันนี้ก็มาไวเหมือนเดิม')) return { speakerId: 'basketball_guy', speakerName: 'เพื่อนชมรมบาสฯ' };
  if (line.includes('อยู่ที่บ้านมันไม่มีอะไรทำ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ช่วงนี้เป็นไงบ้าง')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เปิดประเด็นได้มั่วซั่ว')) return { speakerId: 'basketball_guy', speakerName: 'เพื่อนชมรมบาสฯ' };
  if (line.includes('โดนรุ่นพี่เคี่ยวหนัก')) return { speakerId: 'basketball_guy', speakerName: 'เพื่อนชมรมบาสฯ' };
  if (line.includes('พวกชมรมกีฬานี่ลำบาก')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('จริงที่สุด แค่เป็นเด็ก ม.ปลาย')) return { speakerId: 'basketball_guy', speakerName: 'เพื่อนชมรมบาสฯ' };
  if (line.includes('คงลำบากน่าดูเลยเนอะ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('พวกรุ่นพี่น่ารำคาญก็จริง')) return { speakerId: 'basketball_guy', speakerName: 'เพื่อนชมรมบาสฯ' };
  if (line.includes('งั้นเหรอ อ๊ะ ช่วงนี้ผมลอง')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('อะไรวะ ของผู้หญิงๆ')) return { speakerId: 'basketball_guy', speakerName: 'เพื่อนชมรมบาสฯ' };
  if (line === '“แต่?”') return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ร้านนวดที่อาเมโมโตะเคยแนะนำ')) return { speakerId: 'basketball_guy', speakerName: 'เพื่อนชมรมบาสฯ' };
  if (line.includes('แอบได้ยินนะว่ามองน้ำมันหอมระเหย')) return { speakerId: 'girls_whisper', speakerName: 'นักเรียนหญิง A' };
  if (line.includes('ของที่มีกลิ่นหอมน่ะ')) return { speakerId: 'girls_whisper', speakerName: 'นักเรียนหญิง B' };
  if (line.includes('ไม่ได้ถามพวกเธอสักหน่อย')) return { speakerId: 'basketball_guy', speakerName: 'เพื่อนชมรมบาสฯ' };
  if (line.includes('มีอะไร?')) return { speakerId: 'shion', speakerName: 'วาตานูกิ ชิออน' };
  if (line.includes('ไม่มีอะไรหรอก วาตานูกิซัง')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('จะเตือนไว้ก่อนแล้วกัน')) return { speakerId: 'shion', speakerName: 'วาตานูกิ ชิออน' };
  if (line.includes('พูดเรื่องอะไรเนี่ย')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ไม่ต้องทำเป็นไก๋หรอก')) return { speakerId: 'shion', speakerName: 'วาตานูกิ ชิออน' };
  if (line.includes('ฮะๆ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ไม่ได้ตั้งใจจะทำตัวเป็นผู้บริหาร')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('บอกว่าอย่ามายุ่งกับฉัน')) return { speakerId: 'shion', speakerName: 'วาตานูกิ ชิออน' };
  if (line.includes('พอจะมีญาติเรียนอยู่ที่โรงเรียนเรา')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ทำไมถึงถามเรื่องนั้นตอนนี้')) return { speakerId: 'shion', speakerName: 'วาตานูกิ ชิออน' };
  if (line.includes('ได้คุยกับรุ่นพี่ที่มีนามสกุลเดียวกัน')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('นั่นพี่สาวฉันเอง')) return { speakerId: 'shion', speakerName: 'วาตานูกิ ชิออน' };
  if (line.includes('เอาจริงดิครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('จัดการบริหารห้องเรียนไปโดยไม่ต้องนับฉัน')) return { speakerId: 'shion', speakerName: 'วาตานูกิ ชิออน' };
  
  return { speakerId: 'extra', speakerName: 'เสียงคนอื่น' };
}

// ---------------- Chapter 5 ----------------
function mapCh5(line, idx, blocks) {
  if (line.includes('ฉันขอตามไปด้วยคนได้ไหม')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('อูรูชิบาระ... โคตะ?')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ฉันมีเรื่องอยากจะคุยกับอาเมโมโตะ')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('ไม่ต้องเกร็งกับคนอย่างผมขนาดนั้น')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ขอบใจนะ พอดีอาเมโมโตะดูเป็นผู้ใหญ่')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('งั้นค่อยๆ ปรับตัวให้หายเกร็ง')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ขอตรงที่ไม่มีคนนะ')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('ปรึกษาเรื่องความรัก')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('แน่นอนสิ!')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('ดูเก็บความลับเก่ง')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('สวัสดีครับ ประธาน')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('ทักทายได้แข็งขันเหมือนเดิม')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ตอนนี้พอมีเวลาไหมจ๊ะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('อูรูชิบาระชวนผมก่อน')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ให้สิทธิ์ประธานก่อนเลย')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('ขอบใจที่ยกช่วงเวลาให้จ้ะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ไม่ได้เจอกันตั้งแต่เมื่อคืนเนอะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ขอส่งคำนั้นคืนให้เลยครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('โดนสวนกลับมาซะแรงเชียว')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('เรื่อง ‘ของตอบแทน’ ที่พูดไว้')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line === '“อ๊ะ ครับ”') return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('คิดไม่ออก ก็เลยแวะมาถามตรงๆ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ตรงเกินไปแล้วมั้งครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('รุ่นน้องที่มีเสน่ห์')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('เจอกันยังไม่ถึงวันเลย')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เธอคาดหวังอะไรจากฉัน')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ถามเรื่องที่ตอบยากจัง')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ช่วยบอกเหตุผลที่รุ่นพี่วาตานูกิจำเป็นต้องใช้')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };

  return { speakerId: 'extra', speakerName: 'เสียงคนอื่น' };
}

// ---------------- Chapter 6 ----------------
function mapCh6(line, idx, blocks) {
  if (line.includes('มีสถานที่ที่เหมาะกับการคุยเรื่องลับๆ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('สนามยิงธนูอยู่นะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ไม่เคยรู้มาก่อนเลยครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ยินดีต้อนรับสมาชิกใหม่เสมอเลยนะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ขอปฏิเสธดีกว่าครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('อะไรกันเนี่ย')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('น่าเสียดายจังเนอะ แต่ถ้าอาเมโมโตะคุงมาเป็นสมาชิกชมรม')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ขอถามอีกครั้งนะครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('5,000 เยน')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ผมไม่ได้ทานของหวานเยอะ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ลองทานดูบางครั้งก็อร่อยนะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ช่วยเล่าเรื่องราวของรุ่นพี่')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('งั้นเหรอ...')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('อูรูชิบาระอุตส่าห์มาปรึกษาผม')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ไม่ใช่เรื่องที่จะต้องปิดบังผู้มีพระคุณ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ฉันเรียนไม่เก่งน่ะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('เอ๊ะ อย่างนั้นเหรอครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ถ้าไม่พึ่งเครื่องดื่มชูกำลัง')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('คนรอบข้างเอาแต่ยกยอ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('หัวไวคล่องแคล่วกว่านี้ก็คงดีเนอะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line === '“รุ่นพี่...”') return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เป็นเรื่องที่น่าเบื่อใช่ไหมล่ะจ๊ะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ผมได้ข้อมูลที่ต้องการมาเรียบร้อยแล้ว')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เอ๊ะ?')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('มาทำสัญญาชั่วคราวกันเถอะ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เธอก็ไม่เห็นต้องลำบากมาวิ่งออกกำลังกาย')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ผมจะวิ่งตีคู่ไปข้างๆ นี่แหละ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ตารางชีวิตปกติ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ขอร้องล่ะครับ ให้ผมวิ่งเถอะ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ความน่าเชื่อถือ?')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ก็คงไม่อยากเปลี่ยนวิถีชีวิต')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ถ้ามีความมุ่งมั่นขนาดนั้น')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('วอร์มร่างกายเรียบร้อยแล้วครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ส่วนใหญ่ก็ประมาณขาละ 5 กิโลเมตร')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('แปลว่า ไป-กลับ 10 กิโลเมตร')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ฉันจะผ่อนความเร็วลงให้เท่ากับอาเมโมโตะคุง')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };

  return { speakerId: 'extra', speakerName: 'เสียงคนอื่น' };
}

// Convert Ch 4
const ch4 = parseChapter(
  'd:/Yomiori/novels_source/kyudo-senpai/raw_chapters/Ch_04_อีเวนต์ทั่วไปในชีวิตประจำวัน.md',
  4,
  'ch-04',
  'Ch.4 — อีเวนต์ทั่วไปในชีวิตประจำวัน',
  mapCh4
);
fs.writeFileSync('d:/Yomiori/reader-web/src/data/novels/kyudo-senpai/chapters/ch-04.json', JSON.stringify(ch4, null, 2), 'utf8');

// Convert Ch 5
const ch5 = parseChapter(
  'd:/Yomiori/novels_source/kyudo-senpai/raw_chapters/Ch_05_การปรึกษาและการปรึกษา.md',
  5,
  'ch-05',
  'Ch.5 — การปรึกษาและการปรึกษา',
  mapCh5
);
fs.writeFileSync('d:/Yomiori/reader-web/src/data/novels/kyudo-senpai/chapters/ch-05.json', JSON.stringify(ch5, null, 2), 'utf8');

// Convert Ch 6
const ch6 = parseChapter(
  'd:/Yomiori/novels_source/kyudo-senpai/raw_chapters/Ch_06_คำแนะนำสัญญาชั่วคราว.md',
  6,
  'ch-06',
  'Ch.6 — คำแนะนำสัญญาชั่วคราว',
  mapCh6
);
fs.writeFileSync('d:/Yomiori/reader-web/src/data/novels/kyudo-senpai/chapters/ch-06.json', JSON.stringify(ch6, null, 2), 'utf8');

console.log('Chapters 4, 5, 6 converted successfully!');
