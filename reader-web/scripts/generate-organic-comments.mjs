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

// Load authentic bespoke comments from bespoke-comments.json
const bespokePath = path.resolve('scripts/bespoke-comments.json');
const BESPOKE_MAP = fs.existsSync(bespokePath) ? JSON.parse(fs.readFileSync(bespokePath, 'utf8')) : {};

const finalCatalog = {};

for (const file of files) {
  const content = JSON.parse(fs.readFileSync(path.join(chaptersDir, file), 'utf8'));
  const chNum = content.chapterNumber;
  const chId = content.id;

  let comments = [];

  if (BESPOKE_MAP[chNum] && BESPOKE_MAP[chNum].comments) {
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
}

const destWeb = path.resolve('src/data/novels/kyudo-senpai/comments.json');
const destMobile = path.resolve('../reader-mobile/src/data/novels/kyudo-senpai/comments.json');

fs.writeFileSync(destWeb, JSON.stringify(finalCatalog, null, 2), 'utf8');
fs.writeFileSync(destMobile, JSON.stringify(finalCatalog, null, 2), 'utf8');

console.log(`✅ Synced bespoke comments for ${Object.keys(finalCatalog).length} chapters!`);
for (const [id, data] of Object.entries(finalCatalog)) {
  console.log(`  - ${id} (${data.title}): ${data.commentsCount} comments`);
}
