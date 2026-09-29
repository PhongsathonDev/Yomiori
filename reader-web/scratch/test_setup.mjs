import fs from 'node:fs';
import path from 'node:path';

const characters = JSON.parse(
  fs.readFileSync('d:/Yomiori/reader-web/src/data/novels/kyudo-senpai/characters.json', 'utf8')
);

console.log('Loaded characters:', characters.map(c => c.id).join(', '));
