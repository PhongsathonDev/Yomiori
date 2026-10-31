/**
 * Capture the three UI directions with Chrome DevTools Protocol.
 *
 *   node prototype/ui-lab/tools/capture.mjs
 *
 * Starts its own headless Chrome; the UI Lab server must already be running at
 * http://127.0.0.1:5190/ui-lab/.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const labDir = path.resolve(here, '..');
const outDir = path.join(labDir, 'evidence');
const base = 'http://127.0.0.1:5191/ui-lab/';
const port = 9334;
const chromeBin = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((candidate) => fs.existsSync(candidate));

if (!chromeBin) throw new Error('Chrome or Edge was not found.');

const variants = {
  A: {
    page: 'a-andon.html',
    key: 'ui_lab_A_prefs',
    theme: 'light',
    openDetail: `document.querySelector('[data-book="kyudo-senpai"]').click()`,
    openReader: `document.querySelectorAll('[data-detail-chapters] .a-chapter-row')[1].click()`,
    openSettings: `document.querySelector('[data-screen="reader"] [data-open-settings]')?.click() || document.querySelector('[data-open-settings]').click()`,
    openToc: `document.querySelector('[data-open-toc]').click()`,
    close: `document.querySelector('dialog[open]')?.close()`,
    ready: 'ชั้นหนังสือ',
  },
  B: {
    page: 'b-engawa.html',
    key: 'ui_lab_B_prefs',
    theme: 'dark',
    openDetail: `document.querySelector('[data-detail="kyudo-senpai"]').click()`,
    openReader: `document.querySelectorAll('[data-detail-chapters] .b-chapter')[1].click()`,
    openSettings: `document.querySelector('[data-screen="reader"] [data-open-settings]')?.click() || document.querySelector('[data-open-settings]').click()`,
    openToc: `document.querySelector('[data-open-toc]').click()`,
    close: `document.querySelector('dialog[open]')?.close()`,
    ready: 'อ่านค้างไว้',
  },
  C: {
    page: 'c-zine.html',
    key: 'ui_lab_C_prefs',
    theme: 'sepia',
    openDetail: `document.querySelector('[data-book="kyudo-senpai"]').click()`,
    openReader: `document.querySelectorAll('[data-detail-chapters] .c-check')[1].click()`,
    openSettings: `document.querySelector('[data-screen="reader"] [data-open-settings]')?.click() || document.querySelector('[data-open-settings]').click()`,
    openToc: `document.querySelector('[data-open-toc]').click()`,
    close: `document.querySelector('dialog[open]')?.close()`,
    ready: 'ชั้นวางของฉัน',
  },
  D: {
    page: 'd-desk.html',
    key: 'ui_lab_D_prefs',
    theme: 'light',
    openDetail: `document.querySelector('.d-book-row')?.click()`,
    openReader: `document.querySelectorAll('[data-detail-chapters] .d-chapter')[1].click()`,
    openSettings: `document.querySelector('[data-screen="reader"] [data-open-settings]')?.click() || document.querySelector('[data-open-settings]').click()`,
    openToc: `document.querySelector('[data-open-toc]').click()`,
    close: `document.querySelector('dialog[open]')?.close()`,
    ready: 'ชั้นหนังสือ',
  },
  E: {
    page: 'e-room.html',
    key: 'ui_lab_E_prefs',
    theme: 'sepia',
    openDetail: `document.querySelector('[data-detail="kyudo-senpai"]')?.click()`,
    openReader: `document.querySelectorAll('[data-detail-chapters] .e-chapter')[1].click()`,
    openSettings: `document.querySelector('[data-screen="reader"] [data-open-settings]')?.click() || document.querySelector('[data-open-settings]').click()`,
    openToc: `document.querySelector('[data-open-toc]').click()`,
    close: `document.querySelector('dialog[open]')?.close()`,
    ready: 'ห้องเดียว',
  },
  F: {
    page: 'f-panels.html',
    key: 'ui_lab_F_prefs',
    theme: 'light',
    openDetail: `document.querySelector('[data-hero-detail]')?.click()`,
    openReader: `document.querySelectorAll('[data-detail-chapters] .f-chapter')[1].click()`,
    openSettings: `document.querySelector('[data-screen="reader"] [data-open-settings]')?.click() || document.querySelector('[data-open-settings]').click()`,
    openToc: `document.querySelector('[data-open-toc]').click()`,
    close: `document.querySelector('dialog[open]')?.close()`,
    ready: 'อ่านค้างไว้',
  },
  G: {
    page: 'g-room.html',
    key: 'ui_lab_G_prefs',
    theme: 'light',
    openDetail: `document.querySelector('[data-hero-detail]')?.click()`,
    openReader: `document.querySelectorAll('[data-detail-chapters] .g-chapter')[1].click()`,
    openSettings: `document.querySelector('[data-screen="reader"] [data-open-settings]')?.click() || document.querySelector('[data-open-settings]').click()`,
    openToc: `document.querySelector('[data-open-toc]').click()`,
    close: `document.querySelector('dialog[open]')?.close()`,
    ready: 'ชั้นวางของฉัน',
  },
  H: {
    page: 'h-rails.html',
    key: 'ui_lab_H_prefs',
    theme: 'light',
    openDetail: `document.querySelector('[data-hero-detail]')?.click()`,
    openReader: `document.querySelectorAll('[data-detail] .chapter-row')[1].click()`,
    openSettings: `document.querySelector('[data-screen="reader"] [data-open-settings]')?.click() || document.querySelector('[data-open-settings]').click()`,
    openToc: `document.querySelector('[data-open-toc]').click()`,
    close: `document.querySelector('dialog[open]')?.close()`,
    ready: 'ชั้นวางของฉัน',
  },
};

const viewports = {
  desktop: { width: 1440, height: 900, mobile: false },
  tablet: { width: 1024, height: 768, mobile: false },
  mobile: { width: 390, height: 844, mobile: true },
};

const args = process.argv.slice(2);
const variantsArg = args.find((arg) => arg.startsWith('--variants='));
const onlyVariants = variantsArg ? variantsArg.split('=')[1].split(',').map((item) => item.trim()) : null;

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
      for (const listener of this.listeners.get(message.method) || []) listener(message.params, message.sessionId);
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  once(method, sessionId, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const listener = (params, eventSession) => {
        if (sessionId && eventSession !== sessionId) return;
        clearTimeout(timer);
        this.listeners.set(method, (this.listeners.get(method) || []).filter((item) => item !== listener));
        resolve(params);
      };
      const timer = setTimeout(() => {
        this.listeners.set(method, (this.listeners.get(method) || []).filter((item) => item !== listener));
        reject(new Error(`Timeout: ${method}`));
      }, timeoutMs);
      this.listeners.set(method, [...(this.listeners.get(method) || []), listener]);
    });
  }

  close() {
    this.ws.close();
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitHttp(url, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* retry */
    }
    await sleep(150);
  }
  throw new Error(`Server did not start: ${url}`);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-lab-capture-'));
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
    await waitHttp(`http://127.0.0.1:${port}/json/version`);
    const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
    cdp = new CDP(version.webSocketDebuggerUrl);
    await cdp.open();

    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Network.enable', {}, sessionId);
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);

    const capture = async (filename, fullPage = false) => {
      await sleep(250);
      await cdp.send(
        'Runtime.evaluate',
        {
          expression: `(async () => {
            await document.fonts.ready;
            document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
            const images = Promise.all([...document.images].map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
            })));
            await Promise.race([images, new Promise((resolve) => setTimeout(resolve, 2500))]);
          })()`,
          awaitPromise: true,
        },
        sessionId,
      );

      let clip;
      if (fullPage) {
        const layout = await cdp.send('Page.getLayoutMetrics', {}, sessionId);
        clip = { x: 0, y: 0, width: Math.ceil(layout.cssContentSize.width), height: Math.ceil(layout.cssContentSize.height), scale: 1 };
      }
      const shot = await cdp.send(
        'Page.captureScreenshot',
        { format: 'jpeg', quality: 85, captureBeyondViewport: fullPage, fromSurface: true, ...(clip ? { clip } : {}) },
        sessionId,
      );
      fs.writeFileSync(path.join(outDir, filename), Buffer.from(shot.data, 'base64'));
      console.log(`Captured ${filename}`);
    };

    const load = async (url) => {
      const loaded = cdp.once('Page.loadEventFired', sessionId, 12000);
      await cdp.send('Page.navigate', { url }, sessionId);
      await loaded.catch(() => {});
      await sleep(350);
    };

    for (const [name, variant] of Object.entries(variants)) {
      if (onlyVariants && !onlyVariants.includes(name)) continue;
      for (const [viewportName, viewport] of Object.entries(viewports)) {
        await cdp.send(
          'Emulation.setDeviceMetricsOverride',
          {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1,
            mobile: viewport.mobile,
          },
          sessionId,
        );

        await load(`${base}${variant.page}?v=${Date.now()}`);
        const reloaded = cdp.once('Page.loadEventFired', sessionId, 12000);
        await cdp.send(
          'Runtime.evaluate',
          {
            expression: `localStorage.setItem(${JSON.stringify(variant.key)}, JSON.stringify({theme:${JSON.stringify(
              variant.theme,
            )},font:'serif',size:18,leading:1.9,dialogue:'avatar'})); location.reload();`,
          },
          sessionId,
        );
        await reloaded.catch(() => {});
        await sleep(600);

        await capture(`${name}-shelf-${viewportName}.jpg`, true);

        await cdp.send('Runtime.evaluate', { expression: variant.openDetail }, sessionId);
        await sleep(350);
        await capture(`${name}-detail-${viewportName}.jpg`, true);

        await cdp.send('Runtime.evaluate', { expression: variant.openReader }, sessionId);
        await sleep(350);
        await capture(`${name}-reader-${viewportName}.jpg`, false);

        await cdp.send('Runtime.evaluate', { expression: variant.openSettings }, sessionId);
        await sleep(350);
        await capture(`${name}-settings-${viewportName}.jpg`, false);
        await cdp.send('Runtime.evaluate', { expression: variant.close }, sessionId);

        if (viewportName === 'desktop') {
          await cdp.send('Runtime.evaluate', { expression: variant.openToc }, sessionId);
          await sleep(350);
          await capture(`${name}-toc-${viewportName}.jpg`, false);
          await cdp.send('Runtime.evaluate', { expression: variant.close }, sessionId);
        }
      }
    }

    // Landing page.
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    await load(`${base}?v=${Date.now()}`);
    await capture('lab-index-desktop.jpg', true);
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
    await sleep(300);
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
    } catch {
      /* Windows profile lock */
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
