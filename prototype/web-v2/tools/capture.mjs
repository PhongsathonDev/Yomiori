/**
 * Capture comparable before/after screenshots with Chrome DevTools Protocol.
 *
 *   node prototype/web-v2/tools/capture.mjs --set=after
 *   node prototype/web-v2/tools/capture.mjs          # both apps
 *
 * Requires the dev servers:
 *   reader-web            http://localhost:5173/
 *   prototype/web-v2      http://127.0.0.1:5180/
 *
 * The script writes PNGs to prototype/web-v2/evidence/ and prints page metrics.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const prototypeDir = path.resolve(here, '..');
const outDir = path.join(prototypeDir, 'evidence');
const chromeBin = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((candidate) => fs.existsSync(candidate));

if (!chromeBin) throw new Error('Chrome or Edge was not found.');

const args = process.argv.slice(2);
const onlyArg = args.find((arg) => arg.startsWith('--set='));
const only = onlyArg ? onlyArg.split('=')[1] : 'both';

const APPS = {
  before: {
    base: 'http://localhost:5173/#',
    seed: (theme) =>
      `localStorage.setItem('novel_reader_theme', ${JSON.stringify(theme)});` +
      `localStorage.setItem('novel_current_id','kyudo-senpai');` +
      `localStorage.setItem('novel_last_chapter_id','ch-01');` +
      `localStorage.setItem('novel_reader_font','prompt');` +
      `localStorage.setItem('novel_reader_font_size','18');` +
      `localStorage.setItem('novel_reader_line_height','1.85');` +
      `localStorage.setItem('novel_reader_dialogue_style','vn_card');`,
    settingsSelector: '[title="ตั้งค่าตัวอักษรและหน้าจอ"]',
  },
  after: {
    base: 'http://127.0.0.1:5180/#',
    seed: (theme) =>
      `localStorage.setItem('yomiori_v2_prefs', JSON.stringify({theme:${JSON.stringify(theme)},font:'serif',size:18,leading:1.9,dialogue:'avatar'}));` +
      `localStorage.removeItem('yomiori_v2_progress');`,
    settingsSelector: '[data-action="open-settings"]',
  },
};

const shots = [
  { set: 'both', name: 'shelf-light', route: '/', theme: 'light', viewport: 'desktop', fullPage: true },
  { set: 'both', name: 'shelf-dark', route: '/', theme: 'dark', viewport: 'desktop' },
  { set: 'both', name: 'shelf-sepia', route: '/', theme: 'sepia', viewport: 'desktop' },
  { set: 'both', name: 'detail-light', route: '/novel/kyudo-senpai', theme: 'light', viewport: 'desktop', fullPage: true },
  { set: 'both', name: 'reader-light', route: '/novel/kyudo-senpai/read/ch-01', theme: 'light', viewport: 'desktop' },
  { set: 'both', name: 'reader-dark', route: '/novel/kyudo-senpai/read/ch-01', theme: 'dark', viewport: 'desktop' },
  { set: 'both', name: 'reader-sepia', route: '/novel/kyudo-senpai/read/ch-01', theme: 'sepia', viewport: 'desktop' },
  { set: 'both', name: 'settings-light', route: '/', theme: 'light', viewport: 'desktop', settings: true },
  { set: 'both', name: 'shelf-light', route: '/', theme: 'light', viewport: 'mobile', fullPage: true },
  { set: 'both', name: 'shelf-dark', route: '/', theme: 'dark', viewport: 'mobile' },
  { set: 'both', name: 'detail-light', route: '/novel/kyudo-senpai', theme: 'light', viewport: 'mobile' },
  { set: 'both', name: 'reader-light', route: '/novel/kyudo-senpai/read/ch-01', theme: 'light', viewport: 'mobile' },
  { set: 'both', name: 'reader-dark', route: '/novel/kyudo-senpai/read/ch-01', theme: 'dark', viewport: 'mobile' },
  { set: 'both', name: 'settings-light', route: '/', theme: 'light', viewport: 'mobile', settings: true },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, mobile: false },
  mobile: { width: 390, height: 844, mobile: true, deviceScaleFactor: 1 },
};

class CDP {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.ws = new WebSocket(url);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      const key = message.method;
      const listeners = this.listeners.get(key) || [];
      for (const listener of listeners) listener(message.params, message.sessionId);
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  once(method, sessionId, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const listener = (params, eventSession) => {
        if (sessionId && eventSession !== sessionId) return;
        clearTimeout(timer);
        const list = this.listeners.get(method) || [];
        this.listeners.set(method, list.filter((item) => item !== listener));
        resolve(params);
      };

      const timer = setTimeout(() => {
        const list = this.listeners.get(method) || [];
        this.listeners.set(method, list.filter((item) => item !== listener));
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);

      this.listeners.set(method, [...(this.listeners.get(method) || []), listener]);
    });
  }

  close() {
    this.ws.close();
  }
}

async function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      /* keep waiting */
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`HTTP endpoint did not start: ${url}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'yomiori-capture-'));
  const port = 9333;

  const chrome = spawn(
    chromeBin,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let cdp;
  try {
    await waitForHttp(`http://127.0.0.1:${port}/json/version`);
    const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
    cdp = new CDP(version.webSocketDebuggerUrl);
    await cdp.open();

    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Network.enable', {}, sessionId);
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);

    const metrics = [];

    for (const [setName, app] of Object.entries(APPS)) {
      if (only !== 'both' && only !== setName) continue;

      for (const shot of shots) {
        if (shot.set !== 'both' && shot.set !== setName) continue;

        const viewport = VIEWPORTS[shot.viewport];
        await cdp.send(
          'Emulation.setDeviceMetricsOverride',
          {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: viewport.deviceScaleFactor || 1,
            mobile: Boolean(viewport.mobile),
          },
          sessionId,
        );

        const loaded = cdp.once('Page.loadEventFired', sessionId, 8000);
        await cdp.send('Page.navigate', { url: `${app.base}${shot.route}` }, sessionId);
        await loaded.catch(() => {});

        const reloaded = cdp.once('Page.loadEventFired', sessionId);
        await cdp.send(
          'Runtime.evaluate',
          { expression: `${app.seed(shot.theme)} 'seeded';`, awaitPromise: false },
          sessionId,
        );
        await cdp.send('Page.reload', { ignoreCache: true }, sessionId);
        await reloaded;
        await sleep(250);

        await cdp.send(
          'Runtime.evaluate',
          {
            expression: `(async () => {
              await document.fonts.ready;
              document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
              const images = Promise.all([...document.images].map((img) => img.complete ? img.decode().catch(() => {}) : new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
              })));
              await Promise.race([images, new Promise((resolve) => setTimeout(resolve, 2500))]);
              window.scrollTo(0, 0);
            })()`,
            awaitPromise: true,
          },
          sessionId,
        );

        if (shot.settings) {
          await cdp.send(
            'Runtime.evaluate',
            { expression: `document.querySelector(${JSON.stringify(app.settingsSelector)})?.click();` },
            sessionId,
          );
          await sleep(450);
        }

        const pageMetrics = await cdp.send(
          'Runtime.evaluate',
          {
            expression: `(() => {
              const nav = performance.getEntriesByType('navigation')[0];
              return {
                domNodes: document.querySelectorAll('*').length,
                documentHeight: document.documentElement.scrollHeight,
                viewportWidth: innerWidth,
                viewportHeight: innerHeight,
                loadMs: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
                domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
                scripts: [...document.scripts].reduce((sum, s) => sum + (s.src ? 0 : s.textContent.length), 0),
                title: document.title,
              };
            })()`,
            returnByValue: true,
          },
          sessionId,
        );

        let clip;
        if (shot.fullPage) {
          const layout = await cdp.send('Page.getLayoutMetrics', {}, sessionId);
          const size = layout.cssContentSize;
          clip = { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 };
        }

        const screenshot = await cdp.send(
          'Page.captureScreenshot',
          {
            format: 'jpeg',
            quality: 85,
            captureBeyondViewport: Boolean(shot.fullPage),
            fromSurface: true,
            ...(clip ? { clip } : {}),
          },
          sessionId,
        );

        const filename = `${setName}-${shot.name}-${shot.viewport}.jpg`;
        fs.writeFileSync(path.join(outDir, filename), Buffer.from(screenshot.data, 'base64'));
        metrics.push({ set: setName, shot: shot.name, viewport: shot.viewport, theme: shot.theme, ...pageMetrics.result.value, file: filename });
        console.log(`Captured ${filename}`);
      }
    }

    const metricsFile = path.join(outDir, 'metrics.json');
    const previous = fs.existsSync(metricsFile) ? JSON.parse(fs.readFileSync(metricsFile, 'utf8')) : [];
    const capturedSets = new Set(metrics.map((entry) => entry.set));
    const merged = [...previous.filter((entry) => !capturedSets.has(entry.set)), ...metrics];
    fs.writeFileSync(metricsFile, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${metrics.length} screenshots and metrics.json`);
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
    await sleep(300);
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
    } catch {
      /* Chrome may still hold the profile for a moment on Windows. */
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
