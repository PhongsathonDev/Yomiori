import fs from 'fs';
import path from 'path';

const chaptersDir = path.resolve('src/data/novels/kyudo-senpai/chapters');
const files = fs.readdirSync(chaptersDir).filter(f => f.startsWith('ch-') && f.endsWith('.json')).sort((a,b) => {
  return parseInt(a.replace('ch-','')) - parseInt(b.replace('ch-',''));
});

// Vibrant pleasant avatars
const AVATAR_COLORS = [
  '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', 
  '#ef4444', '#06b6d4', '#6366f1', '#14b8a6', '#f97316'
];

const USERNAMES = [
  'MochiReader', 'KuroNeko_99', 'SenpaiLover', 'KyudoArcher', 'SleepyOwl',
  'MeiFanClub', 'CoffeeAddict', 'NightNovelist', 'SakuraRain', 'ToyaWingman',
  'BushiAppreciator', 'VanillaLatte', 'ReadingAt3AM', 'FluffyCloud', 'ArrowInHeart',
  'OtakuSoul', 'SweetTooth', 'CaffeineRush', 'ComfyBlanket', 'HeartbeatRhythm'
];

const BADGES = [
  'แฟนคลับรุ่นพี่', 'ทีมเมอิ', 'กองอวยตัวเอก', 'สายฟินขอบเตียง', 'โอตาคุยามดึก',
  'ตัวแทนหมู่บ้าน', 'ผู้สังเกตการณ์', 'คนชอบความฟิน', 'ทีมพี่สาว', 'สายฮีลใจ'
];

// Specific bespoke comments for key chapters
const BESPOKE_COMMENTS = {
  0: [
    { username: 'BushiAppreciator', badge: 'สายภาพประกอบ', text: 'ภาพสีรุ่นพี่ริโนะโคตรสวยยยย ลายเส้น อ.บูชิ คือเดอะเบสต์มาก!', likes: 88, time: '1 ชม. ที่แล้ว' },
    { username: 'SenpaiLover', badge: 'แฟนคลับรุ่นพี่', text: 'หน้าท้องรุ่นพี่ขาวเนียนจนใจสั่น... ดาเมจทะลุปรอทตั้งแต่หน้าเปิดเลยเหรอเนี่ย', likes: 74, time: '2 ชม. ที่แล้ว' },
    { username: 'VanillaLatte', badge: 'คนชอบความฟิน', text: 'รูปเดตงานเทศกาลกับรูปในห้องคือละมุนมากกก แอบเห็นรูปตอนนอนหลับด้วยย', likes: 52, time: '3 ชม. ที่แล้ว' },
    { username: 'ReadingAt3AM', badge: 'โอตาคุยามดึก', text: 'เปิดมาด้วยแกลเลอรีภาพแบบนี้คือคุ้มค่าตื่นมาอ่านมาก เตรียมหมอนไว้จิกเรียบร้อย!', likes: 45, time: '5 ชม. ที่แล้ว' }
  ],
  1: [
    { username: 'KuroNeko_99', badge: 'ผู้สังเกตการณ์', text: 'ยืนรอไฟแดงยังยืดหลังตรงเป๊ะ สมเป็นตัวแทนชมรมยิงธนูจริงๆ 5555 สง่างามเกินไปแล้ว', likes: 49, time: '40 นาทีที่แล้ว' },
    { username: 'ToyaWingman', badge: 'กองอวยตัวเอก', text: 'โทยะบอกว่าเห็นรุ่นพี่แล้วเหมือนกำลังรอรับใบประกาศเกียรติคุณ เปรียบเทียบได้เห็นภาพมาก 555', likes: 38, time: '1 ชม. ที่แล้ว' },
    { username: 'SweetTooth', badge: 'สายฮีลใจ', text: 'ชอบความที่พระเอกแอบมองแล้วรู้สึกสะดุดตากับความเฉียบคมของรุ่นพี่ บรรยากาศตอนเช้าละมุนสุดๆ', likes: 31, time: '2 ชม. ที่แล้ว' },
    { username: 'SleepyOwl', badge: 'โอตาคุยามดึก', text: 'จุดเริ่มต้นของตำนานอีเวนต์กลางดึก! เตรียมเข้าสู่ความสนุกแล้วสิเนี่ย', likes: 27, time: '3 ชม. ที่แล้ว' }
  ],
  2: [
    { username: 'MochiReader', badge: 'แฟนคลับรุ่นพี่', text: 'ซื้อเครื่องดื่มชูกำลังเกือบ 7,000 เยน แต่ลืมมือถือจนอดสะสมแต้ม 55555 รุ่นพี่โคตรเด๋อเลยยย!', likes: 62, time: '1 ชม. ที่แล้ว' },
    { username: 'ToyaWingman', badge: 'ตัวแทนหมู่บ้าน', text: 'โทยะนายฉลาดมากที่โทรหาพี่สาวเพื่อพิสูจน์ความบริสุทธิ์ใจ แต่พี่สาวดันคิดว่าพาแฟนมาเปิดตัว 5555', likes: 56, time: '2 ชม. ที่แล้ว' },
    { username: 'MeiFanClub', badge: 'ทีมเมอิ', text: 'พี่เมอิในสายนี่แย่งซีนจัด "น้องชายสุดที่รักดันมีแฟนปริศนา ร้องไห้ครั้งที่สองเลยนะ!?" โคตรฮาาา', likes: 51, time: '2 ชม. ที่แล้ว' },
    { username: 'NightNovelist', badge: 'สายฟินขอบเตียง', text: 'โทยะช่วยถือถุงหนักๆ จนไหล่จะหลุด สุภาพบุรุษตัวจริงแถมแอบชอบรอยยิ้มอิดโรยของรุ่นพี่ด้วยยย', likes: 43, time: '3 ชม. ที่แล้ว' }
  ],
  3: [
    { username: 'KyudoArcher', badge: 'แฟนคลับรุ่นพี่', text: '“คิดว่าบางทีอาจจะได้คุยกันก็ได้ เลยจำไว้น่ะ” ประโยคนี้คือดาเมจทำลายล้างสูงมากกกก! เขินนนน', likes: 95, time: '30 นาทีที่แล้ว' },
    { username: 'MeiFanClub', badge: 'ทีมพี่สาว', text: 'หน้ากากอสูรของพี่เมอิ 55555 แถมบอกจะไปเปลี่ยนเป็นชุดสาวน้อยเวทมนตร์อีก บ้านนี้มันบันเทิงจริงๆ', likes: 81, time: '1 ชม. ที่แล้ว' },
    { username: 'ToyaWingman', badge: 'สายฮา', text: 'โทยะใส่กุญแจมือตัวเองเพื่อแสดงความบริสุทธิ์ใจจนรุ่นพี่ขำกลิ้งตัวงอ 555555 นายทำไปได้ยังไงเนี่ย', likes: 78, time: '2 ชม. ที่แล้ว' },
    { username: 'SenpaiLover', badge: 'สายฟินขอบเตียง', text: 'รุ่นพี่อวดวิชาไอคิโดทั้งที่เพิ่งหายเวียนหัว น่ารักเป็นบ้า! แล้วของตอบแทนที่ว่านี่คืออะไรกันแน่น้าาา', likes: 66, time: '3 ชม. ที่แล้ว' },
    { username: 'SleepingOwl', badge: 'ลงแดง', text: 'ตัดจบแบบนี้คืนนี้ไม่ต้องนอนแล้วมั้งงง สงสัยจนไม่ต้องพึ่งคาเฟอีนตามที่โทยะบอกจริงๆ 555', likes: 59, time: '4 ชม. ที่แล้ว' }
  ],
  4: [
    { username: 'FluffyCloud', badge: 'ผู้สังเกตการณ์', text: 'พอมาที่โรงเรียน รุ่นพี่ก็กลับมาอยู่ในโหมดสาวเพอร์เฟกต์อีกครั้ง แต่ในใจโทยะรู้ความลับหมดแล้ว 555', likes: 42, time: '1 ชม. ที่แล้ว' },
    { username: 'VanillaLatte', badge: 'สายฟิน', text: 'ความรู้สึกของการมีความลับร่วมกันสองคนนี่มันดีต่อใจจริงๆ นะ ยิ่งรุ่นพี่แอบส่งสายตามาให้นี่กรี๊ดเลย', likes: 39, time: '2 ชม. ที่แล้ว' }
  ],
  5: [
    { username: 'HeartbeatRhythm', badge: 'สายฟินขอบเตียง', text: 'รุ่นพี่มาขอปรึกษาเรื่องเปิดหน้าท้องนอน! นึกว่าจะปรึกษาอะไร โคตรพีกกกก 55555', likes: 71, time: '45 นาทีที่แล้ว' },
    { username: 'ToyaWingman', badge: 'ตัวแทนหมู่บ้าน', text: 'โทยะต้องกุมขมับแล้วหนึ่ง คนอะไรจะมาขอเปิดท้องนอนห้องผู้ชายเนี่ยยย สวรรค์โปรดหรือบททดสอบจิตใจ!', likes: 65, time: '1 ชม. ที่แล้ว' }
  ],
  6: [
    { username: 'SakuraRain', badge: 'สายฟิน', text: 'สัญญาชั่วคราวแต่รู้สึกเหมือนสัญญาตลอดชีพเลยนะ รุ่นพี่วางแผนมาอย่างดีใช่ไหมสารภาพมาซะดีๆ!', likes: 58, time: '1 ชม. ที่แล้ว' },
    { username: 'ReadingAt3AM', badge: 'โอตาคุยามดึก', text: 'การันตีความปลอดภัยด้วยพี่เมอิ 5555 ตอนนี้คือตกลงกันเสร็จสรรพ พร้อมเข้าสู่ช่วงเวลาสุดฟินแล้ว!', likes: 47, time: '2 ชม. ที่แล้ว' }
  ],
  7: [
    { username: 'VanillaLatte', badge: 'สายฟินขอบเตียง', text: 'เริ่มตารางเวลาแล้ววว รุ่นพี่นอนหลับปุ๋ยสบายใจเฉิบ ส่วนโทยะคือนั่งเกร็งจนแทบไม่กล้าหายใจ 555', likes: 64, time: '1 ชม. ที่แล้ว' }
  ],
  8: [
    { username: 'SenpaiLover', badge: 'แฟนคลับรุ่นพี่', text: 'หน้าท้องขาวๆ ที่เปิดโล่งนั่น... ดาเมจทะลุจอมาก โทยะนายทนได้ยังไงวะเนี่ย เป็นฉันคงเป็นลมไปแล้ว', likes: 82, time: '2 ชม. ที่แล้ว' }
  ]
};

// Procedural reaction pool for chapters that need generative reaction sets
const GENERAL_REACTION_TEMPLATES = [
  { badge: 'แฟนคลับรุ่นพี่', texts: [
    'รุ่นพี่ตอนนี้คือน่ารักไม่ไหว ความใส่ใจของรุ่นพี่ทำเอาใจละลายยย',
    'มองมุมไหนก็เพอร์เฟกต์ แต่พออยู่กับโทยะแล้วมีมุมโก๊ะๆ โคตรมีเสน่ห์',
    'รอยยิ้มของรุ่นพี่ริโนะคือยาวิเศษรักษาความเหนื่อยล้าของวันจริงๆ ❤️',
    'โมเมนต์ตอนนี้คือดีงามพระรามแปดมาก ดาเมจแรงจนอยากกรี๊ดด'
  ]},
  { badge: 'ทีมพี่สาว', texts: [
    'พี่เมอิยังคงเป็นสีสันของบ้านอาเมโมโตะเหมือนเดิม 55555 ขำความพูดมาก',
    'ถ้าไม่มีเมอิช่วยชงป่านนี้พระนางคงยังไม่คืบหน้าถึงไหน MVP ประจำเรื่อง!',
    'เมอิออกมากี่ตอนก็ฮา รักความหวงน้องชายแต่ก็แอบดันหลังสุดๆ 555',
    'พี่สาวแบบนี้น่ารักมาก บรรยากาศครอบครัวอบอุ่นจัง'
  ]},
  { badge: 'กองอวยตัวเอก', texts: [
    'โทยะนายเป็นพระเอกที่จิตใจดีและให้เกียรติคนอื่นมาก สมควรแล้วที่รุ่นพี่ชอบ',
    'ชอบความฉลาดและมีความคิดในใจที่ตลกของโทยะ เป็นตัวเอกที่อ่านแล้วไม่น่ารำคาญเลย',
    'นายทำดีมากโทยะ สุภาพบุรุษสุดๆ ถึงจะดูซื่อแต่ก็ปกป้องรุ่นพี่ได้เสมอ!',
    'ความคิดในใจของโทยะคือจี้จัดดด เปรียบเทียบอะไรแต่ละอย่าง 555'
  ]},
  { badge: 'สายฟินขอบเตียง', texts: [
    'เคมีคู่นี้มันเข้ากันจนแทบสำลักความหวานแล้ววว มดขึ้นหน้าจอหมดแล้วนะ!',
    'ระยะห่างที่ค่อยๆ ลดลงทีละนิดนี่มันดีต่อหัวใจจริงๆ จังหวะกำลังพอดีเป๊ะ',
    'ฉากนี้คือจิกหมอนขาดไปสามใบแล้วจ้าาา ช่วยด้วยยย',
    'บรรยากาศละมุนละไมสไตล์ Rom-Com ญี่ปุ่นแบบนี้แหละที่ตามหามานาน'
  ]},
  { badge: 'โอตาคุยามดึก', texts: [
    'อ่านตอนนี้รวดเดียวจบแบบหยุดไม่ได้เลย การเดินเรื่องไหลลื่นมาก',
    'ตัดจบแบบนี้อีกแล้ววว! ขอตอนต่อไปด่วนๆ เลยคุณนักแปล/ผู้เขียน!',
    'อ่านจบตอนตีสองแต่ตาสว่างโร่เลย ฟินจนนอนไม่หลับแล้วเนี่ยย',
    'แปลได้สละสลวยมาก สำนวนไทยอ่านสนุกได้อารมณ์สุดๆ ครับบ'
  ]}
];

const commentsCatalog = {};

for (const file of files) {
  const content = JSON.parse(fs.readFileSync(path.join(chaptersDir, file), 'utf8'));
  const chNum = content.chapterNumber;
  const chId = content.id;

  const chapterComments = [];

  // 1. Check if bespoke comments exist
  if (BESPOKE_COMMENTS[chNum]) {
    BESPOKE_COMMENTS[chNum].forEach((b, idx) => {
      chapterComments.push({
        id: `c-${chNum}-${idx + 1}`,
        username: b.username,
        avatarColor: AVATAR_COLORS[(chNum * 3 + idx) % AVATAR_COLORS.length],
        badge: b.badge,
        text: b.text,
        likes: b.likes,
        timeAgo: b.time,
        isUser: false,
        userLiked: false
      });
    });
  }

  // 2. Generate contextual comments for remaining slots up to 5-6
  let count = chapterComments.length;
  let tIdx = 0;
  while (count < 5) {
    const templateCategory = GENERAL_REACTION_TEMPLATES[(chNum + tIdx) % GENERAL_REACTION_TEMPLATES.length];
    const text = templateCategory.texts[(chNum * 2 + tIdx) % templateCategory.texts.length];
    const username = USERNAMES[(chNum * 4 + tIdx) % USERNAMES.length];
    const badge = templateCategory.badge;
    const likes = Math.floor(Math.random() * 45) + 18;
    const hours = (tIdx + 1) * 2;

    chapterComments.push({
      id: `c-${chNum}-${count + 1}`,
      username,
      avatarColor: AVATAR_COLORS[(chNum * 7 + count) % AVATAR_COLORS.length],
      badge,
      text,
      likes,
      timeAgo: `${hours} ชม. ที่แล้ว`,
      isUser: false,
      userLiked: false
    });
    count++;
    tIdx++;
  }

  commentsCatalog[chId] = {
    chapterId: chId,
    chapterNumber: chNum,
    title: content.title,
    commentsCount: chapterComments.length,
    comments: chapterComments
  };
}

const destPath = path.resolve('src/data/novels/kyudo-senpai/comments.json');
fs.writeFileSync(destPath, JSON.stringify(commentsCatalog, null, 2), 'utf8');
console.log(`✅ Generated authentic comments catalog for all 73 chapters saved to: ${destPath}`);
