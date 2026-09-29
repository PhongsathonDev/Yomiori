import fs from 'node:fs';

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
    if (rawLine === '◆' || rawLine === '♦︎' || rawLine === '***' || rawLine === '---' || rawLine === '===') {
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

// ======================== Chapter 7 ========================
function mapCh7(line, idx, blocks) {
  if (line.includes('อีกนิดเดียวเท่านั้นนะอาเมโมโตะคุง')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ฮะ... ครับ...!')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ป้ายบอกทางตรงนั้นแหละ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('อึ่ก... อูโอโอโอโอโอโอโอโอ้!')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เหนื่อยหน่อยนะ อาเมโมโตะคุง! ยอดเยี่ยมมาก')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ขะ... ขอบ... คุณ... ครับ...')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เปล่าหรอก ทางนี้ต่างหากที่ต้องขอบคุณ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ร... รุ่นพี่... ผม ทำ... ได้...')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('อื้อ ทำได้ดีมากเลยจ้ะ!')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ขากลับอีก 5 กิโลเมตร มาวิ่งไปด้วยกันนะ!')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line === '“...?”') return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('แน่นอนว่าฉันจะลดความเร็วลงอีกนะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line === '“…………”') return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ขากลับก็จะพยายามครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เรื่องที่ปรึกษาน่ะ')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('อูรูชิบาระเหรอ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ตอนนี้คงรับมือไม่ไหว')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('รับทราบเลย!')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('โหมดหมดสภาพเหรอ?')) return { speakerId: 'girls_whisper', speakerName: 'นักเรียนหญิง' };
  if (line.includes('ไม่ค่อยสดใสเลยแฮะ?')) return { speakerId: 'classmate', speakerName: 'เพื่อนร่วมชั้น' };
  if (line.includes('เพิ่งเคยเห็นทำหน้าเหนื่อย')) return { speakerId: 'classmate', speakerName: 'เพื่อนร่วมชั้น' };
  if (line.includes('ไปร้องคาราโอเกะปลดปล่อย')) return { speakerId: 'classmate', speakerName: 'เพื่อนร่วมชั้น' };
  if (line.includes('เหนื่อยๆ อยู่จะให้ไปร้องเพลงเนี่ย')) return { speakerId: 'basketball_guy', speakerName: 'เพื่อนชมรมบาสฯ' };
  if (line.includes('ผู้ชายเนี่ยไม่เข้าใจอะไรเลยจริงๆ')) return { speakerId: 'girls_whisper', speakerName: 'นักเรียนหญิง' };
  if (line.includes('ฉันจะช่วยบิลด์อารมณ์มากกว่าเอง')) return { speakerId: 'classmate', speakerName: 'เพื่อนร่วมชั้น' };
  if (line.includes('ไม่กลับไปนั่งที่กันหรือไง')) return { speakerId: 'shion', speakerName: 'วาตานูกิ ชิออน' };
  if (line.includes('ถ้าอาเมโมโตะเหนื่อย ก็ปล่อยเขาไว้เฉยๆ')) return { speakerId: 'shion', speakerName: 'วาตานูกิ ชิออน' };
  if (line.includes('เป็นอย่างที่วาตานูกิซังพูดนั่นแหละ')) return { speakerId: 'classmate', speakerName: 'เพื่อนร่วมชั้น' };
  if (line.includes('ค่อยยังชั่วขึ้นหน่อยแล้วล่ะ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ขอบคุณนะที่เป็นห่วง')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('คำขอบคุณน่ะ ไม่จำเป็นหรอก')) return { speakerId: 'shion', speakerName: 'วาตานูกิ ชิออน' };
  if (line.includes('จะทานแล้วนะครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ตอนเรียนเป็นยังไงบ้าง?')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('เกือบจะหลับไปตั้งหลายรอบเลยครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ช่วงที่ต้องฝึกซ้อมอย่างหนัก ฉันเองก็มีบางครั้ง')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ถ้าเป็นรุ่นพี่วาตานูกิ ถึงจะเหนื่อยแค่ไหน')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('คิดถึงเรื่องของฉันขนาดนั้นเลยเหรอจ๊ะ?')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ทำเป็นรู้ดีไปได้')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ไม่อยากฟังบทเรียนข้ามไปจนตามไม่ทัน')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line === '“อย่างนั้นเหรอครับ”') return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line === '“อื้อ อย่างนั้นแหละจ้ะ”') return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ปริมาณอาหารกลางวัน มันไม่น้อยไปหน่อยเหรอครับ?')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ฉันเป็นพวกไม่ค่อยกินอาหารกลางวันน่ะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ถ้ารุ่นพี่ไม่กิน ผมเองก็ไม่ต้องการ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ไม่ต้องทำถึงขนาดนั้นก็ได้นะ?')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('เปล่าครับ ผมจะทำต่อ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ถ้าไม่ได้สัมผัสภาระเท่ากับรุ่นพี่')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ดื้อจังเลยนะจ๊ะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ตั้งแต่วิ่ง 10 กิโลเมตรเมื่อตอนเช้า')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('หลังเลิกเรียนจะทำยังไงล่ะ?')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ถ้าสร้างความเดือดร้อนก็ปฏิเสธได้เลยนะครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เปล่าหรอก พูดมาได้เลยจ้ะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ขอผมไปเฝ้ามองดูบรรยากาศในชมรมยิงธนูหน่อยได้ไหมครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };

  return { speakerId: 'extra', speakerName: 'เสียงคนอื่น' };
}

// ======================== Chapter 8 ========================
function mapCh8(line, idx, blocks) {
  if (line.includes('เมื่อกี้ฟอร์มหลุดนะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line === '“ค... ครับ!”') return { speakerId: 'extra', speakerName: 'นักเรียนปี 1' };
  if (line.includes('เอาใหม่ตั้งแต่แรก')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('เดี๋ยวฉันจะน้าวธนูให้ดูเป็นตัวอย่าง')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ข... ขา...!')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('สง่างามจังเลย')) return { speakerId: 'extra', speakerName: 'นักเรียนปี 1' };
  if (line.includes('พักได้ อีก 10 นาทีจะซ้อมต่อนะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ไม่นึกเลยว่าจะมาถึงชมรมยิงธนู!')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('ผมแค่มองดูมากกว่ามาทดลองเข้าชมรม')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ขนาดนายแค่มองดูยังวิดพื้นไปด้วยเลย')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('ยังไม่ได้ตัดสินใจว่าจะเข้าหรือเปล่า')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ขอขัดจังหวะคนสนิทกันหน่อยนะค้า~')) return { speakerId: 'ayamori', speakerName: 'อายาโมริ เอโกะ' };
  if (line.includes('รองประธานชมรม อายาโมริ เอโกะ ค่ะ~')) return { speakerId: 'ayamori', speakerName: 'อายาโมริ เอโกะ' };
  if (line.includes('น... นั่นสินะครับรุ่นพี่อายาโมริ!')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('ถ้าเป็นของแบบนี้ละก็เชิญครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line === '“...เห~”') return { speakerId: 'ayamori', speakerName: 'อายาโมริ เอโกะ' };
  if (line.includes('สมกับเป็นนายจริงๆ!')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('เคยมีประสบการณ์ยิงธนูมาก่อนเหรอจ๊ะ?')) return { speakerId: 'ayamori', speakerName: 'อายาโมริ เอโกะ' };
  if (line.includes('ตอนเล่นเกม FPS ด้วยกัน')) return { speakerId: 'urushibara', speakerName: 'อูรูชิบาระ โคตะ' };
  if (line.includes('กำลังประเมินฝีมือของพวกเราปีสอง')) return { speakerId: 'ayamori', speakerName: 'อายาโมริ เอโกะ' };
  if (line.includes('ไม่ได้มาสอดส่องเพื่อโชว์เทพ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ฉันจะเป็นตัวละครคู่แข่ง')) return { speakerId: 'ayamori', speakerName: 'อายาโมริ เอโกะ' };
  if (line.includes('แขนกุ้งแห้งแบบนี้มันดูมีพรสวรรค์ตรงไหน')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('วันนี้เพราะเธอแท้ๆ เลยนะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ช่วงนี้ซ้อมพื้นฐานบ่อย')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('อย่างนั้น... เหรอครับ... ค่อยยังชั่วหน่อยครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เหนื่อยหน่อยนะ อาเมโมโตะคุง ถ้าเหนื่อยจะนอนก่อนก็ได้นะ?')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('เปล่าครับ จะอยู่ด้วยจนจบ...')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เริ่มตั้งแต่สามทุ่ม ถ้ายาวสุดก็คงถึงตีหนึ่ง')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('อุตส่าห์มาอยู่เป็นเพื่อนกระทั่งตอนอ่านหนังสือ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('งั้นก็ เท่าที่ยังไหว...')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เสียงเหมือนคนจะหลับแล้วนะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('การอ่านหนังสือไปพลาง คุยสายกับรุ่นน้อง')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('งั้นเหรอครับ... นั่นสินะครับ...')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('การได้เฝ้ามองความพยายามของรุ่นพี่ที่งดงามขนาดนี้')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ส... สวย...!?')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ต้องทำแบบนี้ทุกวันเนี่ย สุดยอดไปเลยนะครับ... ดูเปล่งประกายจัง')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('อ๊ะ อาเม...!? อาเมโมโตะคุง!')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('เหมือนอย่างที่รุ่นพี่วาตานูกิคอยเฝ้ามองความพยายามของผม')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('อึก!')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ตั้งแต่พรุ่งนี้เป็นต้นไป ขอให้ผมได้ช่วยผ่อนแรง')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('หลับไปแล้วเหรอ? ...เอ๋ แย่แล้วสิ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };

  return { speakerId: 'extra', speakerName: 'เสียงคนอื่น' };
}

// ======================== Chapter 9 ========================
function mapCh9(line, idx, blocks) {
  if (line.includes('คืนนี้พี่จะไปปาร์ตี้ชุดนอน')) return { speakerId: 'mei', speakerName: 'อาเมโมโตะ เมอิ' };
  if (line.includes('อีกแล้วเหรอครับ? เดือนนี้รอบที่สี่แล้วมั้ง')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('พี่จะลองถามดูนะว่าพาน้องชายไปด้วยได้ไหม?')) return { speakerId: 'mei', speakerName: 'อาเมโมโตะ เมอิ' };
  if (line.includes('ทำเหมือนผมเป็นน้องชายตัวเล็กๆ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ไปกินนาเบะด้วยกัน~')) return { speakerId: 'mei', speakerName: 'อาเมโมโตะ เมอิ' };
  if (line.includes('ขอร้องล่ะครับ ผมจะทำหน้ายังไง')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ไม่เห็นต้องเกรงใจเลย อยากมาเมื่อไหร่ก็บอกได้ทันทีนะ!')) return { speakerId: 'mei', speakerName: 'อาเมโมโตะ เมอิ' };
  if (line.includes('ถ้าเห็นตัวจริง สงสัยจะผงะถอย')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('อรุณสวัสดิ์ครับ รุ่นพี่วาตานูกิ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line === '“!”') return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('อ... อื้ม อรุณสวัสดิ์นะ...')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line === '“...?”') return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('หัวใจเต้นไม่เป็นสับปะรดเลย...')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('ถ้าไม่สบาย หยุดเรียนพักผ่อนหน่อยดีกว่าไหมครับ?')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ม... ไม่หรอก! ไหวอยู่แล้วจ้ะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('เสียกิริยาไปซะได้ ไม่ต้องเป็นห่วงหรอกจ้ะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('เช็กเรื่องอะไรเหรอครับ?')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ขอบคุณสำหรับเรื่องเมื่อวานตลอดทั้งวันนะครับ')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('ไม่ว่าอะไรฉันก็พร้อมรับฟังทั้งนั้นแหละจ้ะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('คอร์สผ่อนคลายสุดพิเศษที่ผมคิดค้นขึ้นมา')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('เมื่อกี้ เธอชวนฉันไปบ้านเหรอ?')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('อย่างน้อยก็อยากให้รุ่นพี่ได้พักผ่อนฟื้นฟูร่างกาย')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('แล้วก็มารับเครื่องดื่มชูกำลังพวกนั้นคืนไปด้วย')) return { speakerId: 'toya', speakerName: 'อาเมโมโตะ โทยะ' };
  if (line.includes('วันศุกร์ชมรมหยุดพอดี งั้นวันนี้จะไปนะ')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };
  if (line.includes('มีอะไรกันเหรอ มายืนทำอะไรกันหน้าบ้านสองคนจ๊ะ?')) return { speakerId: 'mei', speakerName: 'อาเมโมโตะ เมอิ' };
  if (line.includes('สวัสดีจ้ะเมอิซัง! กำลังรออยู่พอดีเลย!')) return { speakerId: 'rino', speakerName: 'รุ่นพี่วาตานูกิ' };

  return { speakerId: 'extra', speakerName: 'เสียงคนอื่น' };
}

// Convert Ch 7
const ch7 = parseChapter(
  'd:/Yomiori/novels_source/kyudo-senpai/raw_chapters/Ch_07_เจริญรอยตามตารางเวลา ①.md',
  7,
  'ch-07',
  'Ch.7 — เจริญรอยตามตารางเวลา ①',
  mapCh7
);
fs.writeFileSync('d:/Yomiori/reader-web/src/data/novels/kyudo-senpai/chapters/ch-07.json', JSON.stringify(ch7, null, 2), 'utf8');

// Convert Ch 8
const ch8 = parseChapter(
  'd:/Yomiori/novels_source/kyudo-senpai/raw_chapters/Ch_08_เจริญรอยตามตารางเวลา ②.md',
  8,
  'ch-08',
  'Ch.8 — เจริญรอยตามตารางเวลา ②',
  mapCh8
);
fs.writeFileSync('d:/Yomiori/reader-web/src/data/novels/kyudo-senpai/chapters/ch-08.json', JSON.stringify(ch8, null, 2), 'utf8');

// Convert Ch 9
const ch9 = parseChapter(
  'd:/Yomiori/novels_source/kyudo-senpai/raw_chapters/Ch_09_เสียงหัวใจที่เต้นรัวนี้.md',
  9,
  'ch-09',
  'Ch.9 — เสียงหัวใจที่เต้นรัวนี้',
  mapCh9
);
fs.writeFileSync('d:/Yomiori/reader-web/src/data/novels/kyudo-senpai/chapters/ch-09.json', JSON.stringify(ch9, null, 2), 'utf8');

console.log('Chapters 7, 8, 9 converted successfully!');
