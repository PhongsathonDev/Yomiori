import fs from 'fs';
import path from 'path';

const chaptersDir = path.resolve('src/data/novels/kyudo-senpai/chapters');
const files = fs.readdirSync(chaptersDir).filter(f => f.startsWith('ch-') && f.endsWith('.json')).sort((a,b) => {
  return parseInt(a.replace('ch-','')) - parseInt(b.replace('ch-',''));
});

const AVATAR_COLORS = [
  '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', 
  '#ef4444', '#06b6d4', '#6366f1', '#14b8a6', '#f97316',
  '#e11d48', '#7c3aed', '#0284c7', '#059669', '#d97706'
];

const USER_POOL = [
  { name: 'MochiReader', badge: 'แฟนคลับรุ่นพี่' },
  { name: 'KuroNeko_99', badge: 'ผู้สังเกตการณ์' },
  { name: 'SenpaiLover', badge: 'สายฟินขอบเตียง' },
  { name: 'KyudoArcher', badge: 'กองอวยรุ่นพี่' },
  { name: 'SleepyOwl', badge: 'โอตาคุยามดึก' },
  { name: 'MeiFanClub', badge: 'ทีมพี่เมอิ' },
  { name: 'CoffeeAddict', badge: 'สายชงเข้ม' },
  { name: 'NightNovelist', badge: 'คนชอบความฟิน' },
  { name: 'SakuraRain', badge: 'สายหวาน' },
  { name: 'ToyaWingman', badge: 'ตัวแทนหมู่บ้าน' },
  { name: 'BushiAppreciator', badge: 'สายภาพประกอบ' },
  { name: 'VanillaLatte', badge: 'สายฮีลใจ' },
  { name: 'ReadingAt3AM', badge: 'นักอ่านใต้ผ้าห่ม' },
  { name: 'FluffyCloud', badge: 'สมาคมคนรักสาวคูล' },
  { name: 'HeartbeatRhythm', badge: 'จิกหมอนขาด' },
  { name: 'ShionProtector', badge: 'กองกำลังปกป้องรุ่นพี่' },
  { name: 'AyamoriSenpai', badge: 'ชมรมยิงธนู' },
  { name: 'NoSleepTonight', badge: 'สายลงแดง' },
  { name: 'Kuroba_K', badge: undefined },
  { name: 'Ploy_Mini', badge: undefined },
  { name: 'ZeroTwo_Fan', badge: undefined },
  { name: 'CatLover2024', badge: undefined },
  { name: 'Anon_883', badge: undefined }
];

// Major climax / highlight chapters
const PEAK_CHAPTERS = new Set([0, 2, 3, 6, 8, 11, 16, 17, 21, 24, 31, 37, 41, 47, 51, 52, 61, 64, 71, 72]);
const MEDIUM_CHAPTERS = new Set([1, 4, 5, 7, 9, 10, 12, 13, 15, 18, 19, 23, 27, 29, 30, 33, 34, 43, 45, 50, 54, 56, 59, 60, 62, 63, 66, 67, 70]);

// Handcrafted, authentic bespoke comment clusters with threads
const BESPOKE_MAP = {
  0: {
    comments: [
      {
        username: 'BushiAppreciator',
        badge: 'สายภาพประกอบ',
        text: 'ภาพสีรุ่นพี่ริโนะโคตรสวยยยย ลายเส้น อ.บูชิ คือเดอะเบสต์มากกก!',
        likes: 184,
        timeAgo: '2 วันก่อน',
        isPinned: true,
        replies: [
          { username: 'SenpaiLover', badge: 'สายฟินขอบเตียง', text: 'เห็นด้วยยย หน้าท้องขาวเนียนคือดาเมจแรงมากกก 🫠', likes: 45, timeAgo: '1 วันก่อน' },
          { username: 'MochiReader', badge: 'แฟนคลับรุ่นพี่', text: 'รูปเดตงานเทศกาลชุดยูกาตะก็น่ารักไม่ไหววว', likes: 28, timeAgo: '1 วันก่อน' }
        ]
      },
      { username: 'VanillaLatte', badge: 'คนชอบความฟิน', text: 'เปิดมาด้วยแกลเลอรีภาพแบบนี้คือคุ้มค่าตื่นมาอ่านมาก เตรียมหมอนไว้จิกเรียบร้อย!', likes: 92, timeAgo: '3 วันก่อน' },
      { username: 'ReadingAt3AM', badge: 'โอตาคุยามดึก', text: 'เห็นรูปตอนนอนหลับแล้วใจบางเลย... โทยะนายต้องอดทนขนาดไหนเนี่ย 5555', likes: 67, timeAgo: '5 วันก่อน' },
      { username: 'ZeroTwo_Fan', text: 'ลายเส้นดีงามมากกกกก ❤️✨', likes: 19, timeAgo: '5 วันก่อน' },
      { username: 'Anon_883', text: 'สวยยยยยยยยยยย', likes: 4, timeAgo: '1 สัปดาห์ก่อน' },
      { username: 'CatLover2024', text: '10/10 ตั้งแต่ยังไม่ได้เริ่มอ่านเนื้อเรื่องเลยครับบ', likes: 12, timeAgo: '1 สัปดาห์ก่อน' }
    ]
  },
  1: {
    comments: [
      {
        username: 'KuroNeko_99',
        badge: 'ผู้สังเกตการณ์',
        text: 'ยืนรอไฟแดงยังยืดหลังตรงเป๊ะ สมเป็นตัวแทนชมรมยิงธนูจริงๆ 5555 สง่างามเกินไปแล้ว',
        likes: 112,
        timeAgo: '4 ชม. ที่แล้ว',
        isPinned: true,
        replies: [
          { username: 'ToyaWingman', badge: 'ตัวแทนหมู่บ้าน', text: 'เปรียบเทียบว่าเหมือนยืนรอรับใบประกาศเกียรติคุณ โคตรลั่น 5555', likes: 36, timeAgo: '3 ชม. ที่แล้ว' }
        ]
      },
      { username: 'SweetTooth', badge: 'สายฮีลใจ', text: 'ชอบความที่พระเอกแอบมองแล้วรู้สึกสะดุดตากับความเฉียบคมของรุ่นพี่ บรรยากาศตอนเช้าละมุนสุดๆ', likes: 45, timeAgo: '6 ชม. ที่แล้ว' },
      { username: 'SleepyOwl', badge: 'โอตาคุยามดึก', text: 'จุดเริ่มต้นของตำนานอีเวนต์กลางดึก! เตรียมเข้าสู่ความสนุกแล้วสิเนี่ย', likes: 23, timeAgo: '12 ชม. ที่แล้ว' },
      { username: 'Ploy_Mini', text: 'เปิดเรื่องน่าสนใจมากกก สำนวนลื่นไหลดีจัง', likes: 8, timeAgo: '1 วันก่อน' }
    ]
  },
  2: {
    comments: [
      {
        username: 'MochiReader',
        badge: 'แฟนคลับรุ่นพี่',
        text: 'ซื้อเครื่องดื่มชูกำลังเกือบ 7,000 เยน แต่ลืมมือถือจนอดสะสมแต้ม 55555 รุ่นพี่โคตรเด๋อเลยยย!',
        likes: 215,
        timeAgo: '3 ชม. ที่แล้ว',
        isPinned: true,
        replies: [
          { username: 'CoffeeAddict', badge: 'สายชงเข้ม', text: 'หมดกันลุคสาวคูลสุดเพอร์เฟกต์ตอนเช้า 555555 แต่แบบนี้น่ารักกว่าเยอะ!', likes: 64, timeAgo: '2 ชม. ที่แล้ว' }
        ]
      },
      {
        username: 'ToyaWingman',
        badge: 'ตัวแทนหมู่บ้าน',
        text: 'โทยะนายฉลาดมากที่โทรหาพี่สาวเพื่อพิสูจน์ความบริสุทธิ์ใจ แต่พี่สาวดันคิดว่าพาแฟนมาเปิดตัว 5555555',
        likes: 178,
        timeAgo: '5 ชม. ที่แล้ว',
        replies: [
          { username: 'MeiFanClub', badge: 'ทีมพี่เมอิ', text: '“น้องชายสุดที่รักดันมีแฟนปริศนา ร้องไห้ครั้งที่สองเลยนะ!?” พี่เมอิคือเดอะแบกความฮา 555', likes: 82, timeAgo: '4 ชม. ที่แล้ว' }
        ]
      },
      { username: 'NightNovelist', badge: 'สายฟินขอบเตียง', text: 'โทยะช่วยถือถุงหนักๆ สองใบจนไหล่จะหลุด สุภาพบุรุษตัวจริงแถมแอบชอบรอยยิ้มอิดโรยของรุ่นพี่ด้วยยย', likes: 94, timeAgo: '6 ชม. ที่แล้ว' },
      { username: 'HeartbeatRhythm', badge: 'จิกหมอนขาด', text: 'จังหวะที่รุ่นพี่สบตาแล้วชะงัก “!?” นี่มันอะไรกันครับท่านผู้โช้มมม!', likes: 58, timeAgo: '8 ชม. ที่แล้ว' },
      { username: 'Kuroba_K', text: '555555555555555555', likes: 14, timeAgo: '12 ชม. ที่แล้ว' },
      { username: 'ReadingAt3AM', text: 'ไหล่ขวาโทยะ: ฉันกำลังจะตายยยย', likes: 31, timeAgo: '1 วันก่อน' },
      { username: 'NoSleepTonight', text: 'รีบอ่านต่อตอน 3 ทันที ไม่รอแล้วววว', likes: 7, timeAgo: '1 วันก่อน' }
    ]
  },
  3: {
    comments: [
      {
        username: 'KyudoArcher',
        badge: 'แฟนคลับรุ่นพี่',
        text: '“คิดว่าบางทีอาจจะได้คุยกันก็ได้ เลยจำไว้น่ะ” กรี๊ดดดดดดดดดดดดดดดดดดดดด ดาเมจทะลุหลอดดด!!',
        likes: 298,
        timeAgo: '1 ชม. ที่แล้ว',
        isPinned: true,
        replies: [
          { username: 'SenpaiLover', badge: 'สายฟินขอบเตียง', text: 'เขินจนตัวบิดเป็นเกลียววว นี่มันแอบเล็งเขาไว้แต่แรกชัดๆ เลยรุ่นพี่!', likes: 115, timeAgo: '45 นาทีที่แล้ว' },
          { username: 'SakuraRain', badge: 'สายหวาน', text: 'รุ่นน้องเล่นเกม FPS เก่งใครเขาจะไปจำถ้าไม่ได้สนใจเขาอยู่ 555555', likes: 76, timeAgo: '30 นาทีที่แล้ว' }
        ]
      },
      {
        username: 'ToyaWingman',
        badge: 'ตัวแทนหมู่บ้าน',
        text: 'โทยะใส่กุญแจมือตัวเองเพื่อแสดงความบริสุทธิ์ใจจนรุ่นพี่ขำกลิ้งตัวงอ 555555555555 นายทำไปได้ยังไงเนี่ยยยย',
        likes: 242,
        timeAgo: '2 ชม. ที่แล้ว',
        replies: [
          { username: 'KuroNeko_99', badge: 'ผู้สังเกตการณ์', text: 'รุ่นพี่บอก "ตรงกันข้ามเลยต่างหาก สภาพเธอตอนนี้ยิ่งดูน่าสงสัยกว่าเดิมอีกนะ" 55555', likes: 98, timeAgo: '1 ชม. ที่แล้ว' }
        ]
      },
      { username: 'MeiFanClub', badge: 'ทีมพี่เมอิ', text: 'พี่เมอิใส่หน้ากากอสูรออกมาต้อนรับแขก 55555555 แถมขู่จะแปลงร่างเป็นสาวน้อยเวทมนตร์อีก กาวไม่ไหว', likes: 165, timeAgo: '3 ชม. ที่แล้ว' },
      { username: 'CoffeeAddict', badge: 'สายชงเข้ม', text: 'รุ่นพี่อวดวิชาไอคิโดทั้งที่เพิ่งหายเวียนหัว น่ารักเป็นบ้า! แล้วของตอบแทนที่ว่านี่คืออะไรกันแน่น้าาา', likes: 120, timeAgo: '4 ชม. ที่แล้ว' },
      { username: 'NoSleepTonight', badge: 'สายลงแดง', text: 'ตัดจบแบบนี้คืนนี้ไม่ต้องนอนแล้วมั้งงง สงสัยจนไม่ต้องพึ่งคาเฟอีนตามที่โทยะบอกจริงๆ 555', likes: 88, timeAgo: '5 ชม. ที่แล้ว' },
      { username: 'ZeroTwo_Fan', text: 'ตายยยยยยยยยยยยยยยยยยยย 🫠🫠🫠🫠', likes: 42, timeAgo: '6 ชม. ที่แล้ว' },
      { username: 'Ploy_Mini', text: 'เขินแก้มแตกกกกกกกกกกก', likes: 35, timeAgo: '7 ชม. ที่แล้ว' },
      { username: 'Anon_883', text: '55555555555555555555555555555', likes: 12, timeAgo: '12 ชม. ที่แล้ว' },
      { username: 'FluffyCloud', text: 'ตอนนี้คือครบรสมาก ทั้งฮา ทั้งฟิน ทั้งน่ารัก สมบูรณ์แบบสุดๆ!', likes: 24, timeAgo: '1 วันก่อน' },
      { username: 'CatLover2024', text: 'รอตอนต่อไปไม่ไหวแล้วววว', likes: 6, timeAgo: '2 วันก่อน' }
    ]
  },
  6: {
    comments: [
      {
        username: 'SakuraRain',
        badge: 'สายหวาน',
        text: 'สัญญาชั่วคราวแต่รู้สึกเหมือนสัญญาตลอดชีพเลยนะ รุ่นพี่วางแผนมาอย่างดีใช่ไหมสารภาพมาซะดีๆ!',
        likes: 180,
        timeAgo: '1 วันก่อน',
        isPinned: true,
        replies: [
          { username: 'SenpaiLover', badge: 'สายฟินขอบเตียง', text: 'ช็อตนี้คือพระเอกตกหลุมพรางอย่างสมบูรณ์แบบแล้วครับ 5555', likes: 52, timeAgo: '1 วันก่อน' }
        ]
      },
      { username: 'ToyaWingman', badge: 'ตัวแทนหมู่บ้าน', text: 'มีพี่เมอิเป็นคนกลางคอยการันตีความปลอดภัย 5555 โคตรตลก', likes: 84, timeAgo: '1 วันก่อน' },
      { username: 'Kuroba_K', text: 'ยินดีด้วยกับการเริ่มต้นความสัมพันธ์ลับๆ ของทั้งสองคน! 🎉', likes: 33, timeAgo: '2 วันก่อน' },
      { username: 'NoSleepTonight', text: 'ลุยยยยยยยยยยยยยยยยยยยยยยยยย', likes: 15, timeAgo: '2 วันก่อน' },
      { username: 'Anon_883', text: '5555555555555', likes: 3, timeAgo: '3 วันก่อน' }
    ]
  },
  8: {
    comments: [
      {
        username: 'SenpaiLover',
        badge: 'สายฟินขอบเตียง',
        text: 'หน้าท้องขาวๆ ที่เปิดโล่งนั่น... ดาเมจทะลุจอมาก โทยะนายทนได้ยังไงวะเนี่ย เป็นฉันคงหัวใจวายไปแล้วววว 🫠🫠',
        likes: 260,
        timeAgo: '1 วันก่อน',
        isPinned: true,
        replies: [
          { username: 'ReadingAt3AM', badge: 'นักอ่านใต้ผ้าห่ม', text: 'ความขาวเนียน + จังหวะหายใจสม่ำเสมอนี่มันเกินต้านจริงๆ ครับคุณตำรวจ!', likes: 89, timeAgo: '1 วันก่อน' },
          { username: 'ToyaWingman', badge: 'ตัวแทนหมู่บ้าน', text: 'โทยะนั่งเกร็งจนแทบไม่กล้าหายใจ 5555555 สู้เขาไอ้น้องชาย!', likes: 62, timeAgo: '20 ชม. ที่แล้ว' }
        ]
      },
      { username: 'VanillaLatte', badge: 'สายฮีลใจ', text: 'รุ่นพี่หลับปุ๋ยสบายใจเฉิบเลย พอได้นอนพักแบบนี้แล้วคงผ่อนคลายจริงๆ อบอุ่นหัวใจจัง', likes: 110, timeAgo: '1 วันก่อน' },
      { username: 'HeartbeatRhythm', badge: 'จิกหมอนขาด', text: 'กรี๊ดดดดดดดดดดดดดด หมอนขาดไปสิบใบแล้วววววววววววววว', likes: 78, timeAgo: '2 วันก่อน' },
      { username: 'ZeroTwo_Fan', text: 'ตายยยยยยยยยยยยยยยยยยยยยยยยยยยยยยยยยยย', likes: 45, timeAgo: '2 วันก่อน' },
      { username: 'Ploy_Mini', text: 'เขินนนนนนนนนน ไม่ไหวแล้วววววว 😭❤️', likes: 38, timeAgo: '2 วันก่อน' },
      { username: 'Anon_883', text: 'ดีย์มากกกกกกกก', likes: 9, timeAgo: '3 วันก่อน' },
      { username: 'NoSleepTonight', text: 'ตอนต่อไปด่วนนนนนนนนนนนนนน', likes: 16, timeAgo: '3 วันก่อน' }
    ]
  },
  17: {
    comments: [
      {
        username: 'ShionProtector',
        badge: 'กองกำลังปกป้องรุ่นพี่',
        text: 'น้องชิออนมาแล้ววววว! ซิสคอนตัวแม่พร้อมบวกทุกคนที่เข้าใกล้พี่สาว 55555555 โคตรหวง!',
        likes: 230,
        timeAgo: '3 วันก่อน',
        isPinned: true,
        replies: [
          { username: 'ToyaWingman', badge: 'ตัวแทนหมู่บ้าน', text: 'โทยะเจอบอสประจำด่านเข้าแล้วววว สวดมนต์รอเลย 5555', likes: 72, timeAgo: '2 วันก่อน' }
        ]
      },
      { username: 'MeiFanClub', badge: 'ทีมพี่เมอิ', text: 'ชิออน vs เมอิ ถ้าสองคนนี้เจอกันบ้านแตกแน่นอน 555555', likes: 145, timeAgo: '3 วันก่อน' },
      { username: 'KuroNeko_99', text: 'น้องสาวสายหวงพี่นี่มันของดีจริงๆ สายตาเย็นชาคู่นั้นทำใจสั่นเลยยย', likes: 62, timeAgo: '4 วันก่อน' },
      { username: 'Ploy_Mini', text: 'ชิออนน่าร้ากกกกกกกกก แต่แอบน่ากลัว 555', likes: 28, timeAgo: '4 วันก่อน' },
      { username: 'Anon_883', text: 'โทยะ: ฉันทำอะไรผิดดดด 55555', likes: 19, timeAgo: '5 วันก่อน' }
    ]
  },
  61: {
    comments: [
      {
        username: 'SenpaiLover',
        badge: 'สายฟินขอบเตียง',
        text: 'เดตงานเทศกาลโรงเรียนนนน!! ชุดยูกาตะรุ่นพี่ริโนะคือสะกดทุกสายตาจริงๆ สวยสะกดโลกกกก ✨',
        likes: 285,
        timeAgo: '4 วันก่อน',
        isPinned: true,
        replies: [
          { username: 'SakuraRain', badge: 'สายหวาน', text: 'จังหวะเดินคู่กันแล้วคนรอบข้างหันมามองเป็นตาเดียวคือฟินมากกก โทยะเท่ขึ้นเยอะเลย!', likes: 95, timeAgo: '3 วันก่อน' }
        ]
      },
      { username: 'HeartbeatRhythm', badge: 'จิกหมอนขาด', text: 'จับมือกันแล้ววววววววววววว เขินจนตัวแตกกกกกกก!', likes: 142, timeAgo: '4 วันก่อน' },
      { username: 'VanillaLatte', text: 'ฉากนี้คือที่สุดของมุกงานโรงเรียนแล้วววว ชอบคู่นี้จังงงง', likes: 45, timeAgo: '5 วันก่อน' },
      { username: 'CatLover2024', text: 'หวานจนตัดขาแล้วจ้าาา', likes: 12, timeAgo: '5 วันก่อน' }
    ]
  },
  64: {
    comments: [
      {
        username: 'MochiReader',
        badge: 'แฟนคลับรุ่นพี่',
        text: 'ในที่สุดดดดดดดดดดดดดดดดดดดดดดดดด สารภาพรักแล้วววววววววววววววววววววววววววววววว!',
        likes: 312,
        timeAgo: '1 วันก่อน',
        isPinned: true,
        replies: [
          { username: 'KyudoArcher', badge: 'กองอวยรุ่นพี่', text: 'กราบไรท์เตอร์ในที่สุดโมเมนต์นี้ก็มาถึงงงง รอมาตั้งแต่อ่านตอนที่ 1!', likes: 112, timeAgo: '20 ชม. ที่แล้ว' },
          { username: 'SenpaiLover', badge: 'สายฟินขอบเตียง', text: 'ใจฟูไม่ไหวววว เป็นการสารภาพรักที่ละมุนและจริงใจที่สุดในโลก!', likes: 89, timeAgo: '18 ชม. ที่แล้ว' }
        ]
      },
      { username: 'ToyaWingman', badge: 'ตัวแทนหมู่บ้าน', text: 'ในที่สุดโทยะก็เป็นลูกผู้ชายเต็มตัวแล้วโว้ยยยย ยินดีด้วยทั้งสองคนนน!', likes: 175, timeAgo: '1 วันก่อน' },
      { username: 'MeiFanClub', badge: 'ทีมพี่สาว', text: 'เมอิต้องจัดงานฉลองใหญ่แล้ววววว 55555 เลี้ยงไอศกรีมทั้งบ้าน!', likes: 98, timeAgo: '1 วันก่อน' },
      { username: 'Ploy_Mini', text: 'น้ำตาจะไหลลลล อ่านแล้วยิ้มแก้มจะแตกกกกกกกก', likes: 64, timeAgo: '1 วันก่อน' }
    ]
  },
  72: {
    comments: [
      {
        username: 'MochiReader',
        badge: 'แฟนคลับรุ่นพี่',
        text: 'จบได้ประทับใจและอบอุ่นหัวใจมากกก ขอบคุณสำหรับนิยายดีๆ เรื่องนี้นะคะ จะจำเรื่องนี้ไว้ในใจตลอดไปเลย 🌸',
        likes: 345,
        timeAgo: '1 สัปดาห์ก่อน',
        isPinned: true,
        replies: [
          { username: 'VanillaLatte', badge: 'สายฮีลใจ', text: 'รู้สึกเหมือนได้เติบโตไปพร้อมกับโทยะและรุ่นพี่ริโนะจริงๆ ขอบคุณมากๆ ครับ', likes: 120, timeAgo: '6 วันก่อน' }
        ]
      },
      { username: 'ToyaWingman', badge: 'ตัวแทนหมู่บ้าน', text: 'ยินดีกับปลายทางของทั้งคู่ เป็นเรื่องราวที่ฟีลกู๊ดและมีความสุขมากๆ', likes: 198, timeAgo: '1 สัปดาห์ก่อน' },
      { username: 'ShionProtector', badge: 'กองกำลังปกป้องรุ่นพี่', text: 'ถึงจะจบแล้ว แต่ชิออนจังก็คงยังแอบหวงพี่สาวต่อไปเรื่อยๆ แหละเนอะ 5555', likes: 87, timeAgo: '1 สัปดาห์ก่อน' },
      { username: 'KyudoArcher', text: 'ยกให้เป็น Masterpiece แนว Rom-Com ในดวงใจเลยครับ ❤️', likes: 76, timeAgo: '2 สัปดาห์ก่อน' },
      { username: 'CatLover2024', text: 'ประทับใจมากกกก ขอบคุณครับบบ', likes: 25, timeAgo: '2 สัปดาห์ก่อน' }
    ]
  }
};

// Variety of short reactions (slang, laughs, expressions)
const SHORT_REACTIONS = [
  '555555555555555555',
  '5555555 ลั่นเลย',
  'เขินจนตัวบิดดดดดดดดด >///<',
  'ตายสงบศพสีชมพู 🫠',
  'ฟินนนนนน มดขึ้นจอหมดแล้ว',
  'กรี๊ดดดดดดดดดดดดด',
  'น่ารักเกินไปแล้ววววววววว',
  'โทยะนายมันแน่มาก 5555',
  'รุ่นพี่คือน่ารักไม่ไหวววว',
  'ตัดจบแบบนี้ได้งายยยยยยย',
  'ขออีก 10 ตอนด่วนๆ ครับบ',
  'อ่านจบยิ้มแก้มแทบแตก ❤️',
  'อิ่มความสุขจนล้นออกปากก',
  'ใจฟูมากกกกก',
  '555555 จังหวะนี้ไม่ได้ป่ะ'
];

const MEDIUM_REACTIONS = [
  'ชอบเคมีของคู่นี้มากกก มีความค่อยเป็นค่อยไปแต่ใจฟูสุดๆ',
  'บทสนทนาธรรมดาแต่ทำไมเราอ่านแล้วยิ้มไม่หุบเลยเนี่ย',
  'พี่เมอิออกมากี่ทีก็แย่งซีนตลอด 55555 ขำความพี่สาว',
  'จังหวะนี้คือดีมากกกก อ่านแล้วหยุดไม่ได้เลย',
  'เป็นนิยายที่อ่านแล้วฮีลใจมากๆ ผ่อนคลายสุดๆ',
  'ชอบมโนและความคิดในใจของโทยะมาก เปรียบเทียบอะไรแต่ละอย่าง 555',
  'รุ่นพี่ริโนะลุคนี้คือดาเมจแรงเกินต้านจริงๆ ครับบ',
  'ความสัมพันธ์ค่อยๆ พัฒนาขึ้นทีละนิด ดีต่อใจมากๆ'
];

const TIME_VARIANTS = [
  'เมื่อ 5 นาทีที่แล้ว', 'เมื่อ 18 นาทีที่แล้ว', 'เมื่อ 42 นาทีที่แล้ว',
  '1 ชม. ที่แล้ว', '2 ชม. ที่แล้ว', '4 ชม. ที่แล้ว', '6 ชม. ที่แล้ว',
  'เมื่อวานนี้', '2 วันก่อน', '4 วันก่อน', '1 สัปดาห์ก่อน', '2 สัปดาห์ก่อน'
];

// Seeded pseudorandom
function pseudoRand(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const finalCatalog = {};

for (const file of files) {
  const content = JSON.parse(fs.readFileSync(path.join(chaptersDir, file), 'utf8'));
  const chNum = content.chapterNumber;
  const chId = content.id;

  let comments = [];

  // 1. If bespoke comments exist, use them as base
  if (BESPOKE_MAP[chNum]) {
    comments = BESPOKE_MAP[chNum].comments.map((b, idx) => ({
      id: `c-${chNum}-${idx + 1}`,
      username: b.username,
      avatarColor: AVATAR_COLORS[(chNum * 3 + idx) % AVATAR_COLORS.length],
      badge: b.badge,
      text: b.text,
      likes: b.likes,
      timeAgo: b.timeAgo,
      isUser: false,
      userLiked: false,
      isPinned: b.isPinned || false,
      replies: b.replies ? b.replies.map((r, rIdx) => ({
        id: `c-${chNum}-${idx + 1}-r${rIdx + 1}`,
        username: r.username,
        avatarColor: AVATAR_COLORS[(chNum * 5 + rIdx + 2) % AVATAR_COLORS.length],
        badge: r.badge,
        text: r.text,
        likes: r.likes,
        timeAgo: r.timeAgo,
        isUser: false,
        userLiked: false
      })) : undefined
    }));
  }

  // Determine target count based on tier
  let targetCount;
  if (PEAK_CHAPTERS.has(chNum)) {
    targetCount = 10 + Math.floor(pseudoRand(chNum * 13) * 6); // 10 - 15 comments
  } else if (MEDIUM_CHAPTERS.has(chNum)) {
    targetCount = 5 + Math.floor(pseudoRand(chNum * 17) * 4);  // 5 - 8 comments
  } else {
    targetCount = 2 + Math.floor(pseudoRand(chNum * 23) * 3);  // 2 - 4 comments
  }

  const allText = (content.blocks || []).map(b => b.text || '').join(' ');
  let idx = comments.length;
  let userOffset = (chNum * 7) % USER_POOL.length;

  while (comments.length < targetCount) {
    idx++;
    const user = USER_POOL[(userOffset + idx) % USER_POOL.length];
    let text = '';

    const isShort = pseudoRand(chNum * 50 + idx) > 0.45;
    if (isShort) {
      text = SHORT_REACTIONS[Math.floor(pseudoRand(chNum * 83 + idx) * SHORT_REACTIONS.length)];
    } else {
      text = MEDIUM_REACTIONS[Math.floor(pseudoRand(chNum * 97 + idx) * MEDIUM_REACTIONS.length)];
    }

    // Power law likes: top ones have high, lower ones have few
    let likes = 0;
    if (idx === 1 && comments.length === 0) {
      likes = 45 + Math.floor(pseudoRand(chNum * 19 + idx) * 80);
    } else if (idx <= 3) {
      likes = 12 + Math.floor(pseudoRand(chNum * 23 + idx) * 25);
    } else if (pseudoRand(chNum * 31 + idx) > 0.4) {
      likes = 1 + Math.floor(pseudoRand(chNum * 7 + idx) * 8);
    } else {
      likes = 0;
    }

    const timeAgo = TIME_VARIANTS[Math.floor(pseudoRand(chNum * 43 + idx) * TIME_VARIANTS.length)];

    // Add optional reply on high-engagement chapters for the top comment
    let replies;
    if (idx === 1 && PEAK_CHAPTERS.has(chNum) && pseudoRand(chNum * 67) > 0.3) {
      const replyUser = USER_POOL[(userOffset + idx + 3) % USER_POOL.length];
      const replyTexts = [
        'จริงงงง คิดเหมือนกันเลย 555',
        'ตอนอ่านฉากนี้คือแทบกรี๊ดเหมือนกันครับ',
        'เห็นด้วย 100% เลยยย',
        '55555555555 จี้มาก',
        'รอโมเมนต์นี้มานานมากกกกก'
      ];
      replies = [{
        id: `c-${chNum}-${idx}-r1`,
        username: replyUser.name,
        avatarColor: AVATAR_COLORS[(chNum * 9 + 4) % AVATAR_COLORS.length],
        badge: replyUser.badge,
        text: replyTexts[Math.floor(pseudoRand(chNum * 89) * replyTexts.length)],
        likes: Math.floor(likes * 0.35),
        timeAgo: 'เมื่อสักครู่',
        isUser: false,
        userLiked: false
      }];
    }

    comments.push({
      id: `c-${chNum}-${idx}`,
      username: user.name,
      avatarColor: AVATAR_COLORS[(chNum * 3 + idx) % AVATAR_COLORS.length],
      badge: user.badge,
      text,
      likes,
      timeAgo,
      isUser: false,
      userLiked: false,
      isPinned: idx === 1 && likes > 40,
      replies
    });
  }

  // Sort
  comments.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.likes - a.likes;
  });

  finalCatalog[chId] = {
    chapterId: chId,
    chapterNumber: chNum,
    title: content.title,
    commentsCount: comments.length,
    comments
  };
}

const destWeb = path.resolve('src/data/novels/kyudo-senpai/comments.json');
const destMobile = path.resolve('../reader-mobile/src/data/novels/kyudo-senpai/comments.json');

fs.writeFileSync(destWeb, JSON.stringify(finalCatalog, null, 2), 'utf8');
fs.writeFileSync(destMobile, JSON.stringify(finalCatalog, null, 2), 'utf8');

console.log('✅ Generated natural organic comments for all 73 chapters!');
const counts = Object.values(finalCatalog).map(c => c.commentsCount);
const minC = Math.min(...counts);
const maxC = Math.max(...counts);
const avgC = (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1);
console.log(`📊 Statistics: Min=${minC}, Max=${maxC}, Avg=${avgC} comments per chapter.`);
