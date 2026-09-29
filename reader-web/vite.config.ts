import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function localEditorPlugin(): Plugin {
  return {
    name: 'vite-plugin-local-editor',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const sendJson = (statusCode: number, data: any) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        const getBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        const dataDir = path.resolve(import.meta.dirname || process.cwd(), 'src/data');

        try {
          // 1. Health / Dev Status
          if (req.url === '/api/status' && req.method === 'GET') {
            return sendJson(200, {
              status: 'ok',
              mode: 'local-first',
              canEdit: true,
              dataDir,
            });
          }

          // 2. Save Novel Metadata
          if (req.url === '/api/save-novel' && req.method === 'POST') {
            const { novel } = await getBody();
            if (!novel || !novel.id) {
              return sendJson(400, { error: 'Missing novel data or id' });
            }

            const novelsPath = path.join(dataDir, 'novels.json');
            let novels: any[] = [];
            if (fs.existsSync(novelsPath)) {
              novels = JSON.parse(fs.readFileSync(novelsPath, 'utf-8'));
            }

            const idx = novels.findIndex((n) => n.id === novel.id);
            if (idx >= 0) {
              novels[idx] = { ...novels[idx], ...novel };
            } else {
              novels.push(novel);
            }

            fs.writeFileSync(novelsPath, JSON.stringify(novels, null, 2) + '\n', 'utf-8');
            return sendJson(200, { success: true, novel: novels[idx >= 0 ? idx : novels.length - 1] });
          }

          // 3. Save Characters
          if (req.url === '/api/save-characters' && req.method === 'POST') {
            const { novelId, characters } = await getBody();
            if (!novelId || !Array.isArray(characters)) {
              return sendJson(400, { error: 'Missing novelId or characters array' });
            }

            const charPath = path.join(dataDir, 'novels', novelId, 'characters.json');
            if (!fs.existsSync(path.dirname(charPath))) {
              fs.mkdirSync(path.dirname(charPath), { recursive: true });
            }

            fs.writeFileSync(charPath, JSON.stringify(characters, null, 2) + '\n', 'utf-8');
            return sendJson(200, { success: true, count: characters.length });
          }

          // 4. Save Single Chapter Block (Quick Fix)
          if (req.url === '/api/save-chapter-block' && req.method === 'POST') {
            const { novelId, chapterId, blockId, text, speakerId, speakerName, tone } = await getBody();
            if (!novelId || !chapterId || !blockId) {
              return sendJson(400, { error: 'Missing novelId, chapterId, or blockId' });
            }

            const chaptersDir = path.join(dataDir, 'novels', novelId, 'chapters');
            let targetFile = path.join(chaptersDir, `${chapterId}.json`);

            if (!fs.existsSync(targetFile) && fs.existsSync(chaptersDir)) {
              const files = fs.readdirSync(chaptersDir).filter((f) => f.endsWith('.json'));
              for (const f of files) {
                const content = JSON.parse(fs.readFileSync(path.join(chaptersDir, f), 'utf-8'));
                if (content.id === chapterId) {
                  targetFile = path.join(chaptersDir, f);
                  break;
                }
              }
            }

            if (!fs.existsSync(targetFile)) {
              return sendJson(404, { error: `Chapter file not found for ${chapterId}` });
            }

            const chapterData = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
            const blockIndex = chapterData.blocks.findIndex((b: any) => b.id === blockId);

            if (blockIndex === -1) {
              return sendJson(404, { error: `Block ${blockId} not found in chapter` });
            }

            const existingBlock = chapterData.blocks[blockIndex];
            chapterData.blocks[blockIndex] = {
              ...existingBlock,
              ...(text !== undefined ? { text } : {}),
              ...(speakerId !== undefined ? { speakerId } : {}),
              ...(speakerName !== undefined ? { speakerName } : {}),
              ...(tone !== undefined ? { tone } : {}),
            };

            fs.writeFileSync(targetFile, JSON.stringify(chapterData, null, 2) + '\n', 'utf-8');
            return sendJson(200, { success: true, updatedBlock: chapterData.blocks[blockIndex] });
          }

          // 5. Save Full Chapter
          if (req.url === '/api/save-chapter' && req.method === 'POST') {
            const { novelId, chapter } = await getBody();
            if (!novelId || !chapter || !chapter.id) {
              return sendJson(400, { error: 'Missing novelId or chapter.id' });
            }

            const chaptersDir = path.join(dataDir, 'novels', novelId, 'chapters');
            let targetFile = path.join(chaptersDir, `${chapter.id}.json`);

            if (!fs.existsSync(targetFile) && fs.existsSync(chaptersDir)) {
              const files = fs.readdirSync(chaptersDir).filter((f) => f.endsWith('.json'));
              for (const f of files) {
                const content = JSON.parse(fs.readFileSync(path.join(chaptersDir, f), 'utf-8'));
                if (content.id === chapter.id) {
                  targetFile = path.join(chaptersDir, f);
                  break;
                }
              }
            }

            fs.writeFileSync(targetFile, JSON.stringify(chapter, null, 2) + '\n', 'utf-8');
            return sendJson(200, { success: true, chapterId: chapter.id });
          }

          // Unhandled /api request
          sendJson(404, { error: 'Not found' });
        } catch (err: any) {
          sendJson(500, { error: err.message || 'Server error' });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), localEditorPlugin()],
});
