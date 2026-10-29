import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createServer } from 'vite';

let dom;
let vite;
let createRoot;
let QuickFixModal;
let root;
let container;
let props;
let calls;
let errors;
let originalConsoleError;

const narration = { id: 'n-1', type: 'narration', text: 'Original narration' };
const dialogue = { id: 'd-1', type: 'dialogue', text: 'Original dialogue', speakerId: 'a', speakerName: 'Alice' };
const characters = [
  { id: 'a', name: 'Alice', role: 'Lead', color: '#aabbcc' },
  { id: 'b', name: 'Bob', role: 'Friend', color: '#ccbbaa' },
];

before(async () => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // React DOM must detect input-event support after the DOM exists.
  ({ createRoot } = await import('react-dom/client'));
  vite = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
  });
  ({ QuickFixModal } = await vite.ssrLoadModule('/src/components/QuickFixModal.tsx'));
});

after(async () => {
  await vite?.close();
  dom?.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.HTMLElement;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  calls = { save: [], speaker: [], narration: [], close: 0 };
  props = {
    block: null,
    characters,
    onClose: () => {
      calls.close++;
      props = { ...props, block: null };
      root.render(React.createElement(QuickFixModal, props));
    },
    onSaveBlock: (...args) => calls.save.push(args),
    onUpdateSpeaker: (...args) => calls.speaker.push(args),
    onConvertToNarration: (...args) => calls.narration.push(args),
  };
  errors = [];
  originalConsoleError = console.error;
  console.error = (...args) => errors.push(args.join(' '));
});

afterEach(async () => {
  try {
    await act(async () => root.unmount());
    assert.deepEqual(errors, [], 'React must not report hook-order or lifecycle errors');
  } finally {
    console.error = originalConsoleError;
    container.remove();
  }
});

async function render(block, overrides = {}) {
  props = { ...props, ...overrides, block };
  await act(async () => root.render(React.createElement(QuickFixModal, props)));
}

async function click(text) {
  const button = [...container.querySelectorAll('button')].find(button => button.textContent.includes(text));
  assert.ok(button, `Button not found: ${text}`);
  await act(async () => button.click());
}

async function edit(text) {
  const textarea = container.querySelector('textarea');
  assert.ok(textarea);
  await act(async () => {
    const { set } = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, 'value');
    set.call(textarea, text);
    textarea.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
}

test('mounts closed and repeatedly opens/closes in StrictMode without hook errors', async () => {
  for (const block of [null, narration, null, dialogue, null, narration, null]) {
    await act(async () => root.render(React.createElement(React.StrictMode, null,
      React.createElement(QuickFixModal, { ...props, block }),
    )));
    assert.equal(container.querySelector('textarea')?.value ?? null, block?.text ?? null);
  }
});

test('saves edited narration using the correct block ID and closes', async () => {
  await render(null);
  await render(narration);
  await edit('Corrected narration');
  await click('บันทึกการแก้ไข');
  assert.deepEqual(calls.save, [[narration.id, 'Corrected narration', '', '']]);
  assert.equal(calls.close, 1);
  assert.equal(container.innerHTML, '');
});

test('saves edited dialogue together with the newly selected speaker', async () => {
  await render(dialogue);
  await edit('Corrected dialogue');
  await click('Bob');
  await click('บันทึกการแก้ไข');
  assert.deepEqual(calls.save, [[dialogue.id, 'Corrected dialogue', 'b', 'Bob']]);
  assert.deepEqual(calls.speaker, []);
  assert.equal(calls.close, 1);
});

test('switching blocks resets text and speaker without leaking an unsaved draft', async () => {
  await render(dialogue);
  await edit('Unsaved draft');
  await click('Bob');
  const next = { ...dialogue, id: 'd-2', text: 'Next dialogue' };
  await render(next);
  assert.equal(container.querySelector('textarea').value, next.text);
  await click('บันทึกการแก้ไข');
  assert.deepEqual(calls.save, [[next.id, next.text, 'a', 'Alice']]);

  await render(narration);
  await click('บันทึกการแก้ไข');
  assert.deepEqual(calls.save[1], [narration.id, narration.text, '', '']);
});

test('cancelling and reopening the same block discards unsaved changes', async () => {
  await render(dialogue);
  await edit('Discard me');
  await click('Bob');
  await click('ยกเลิก');
  assert.deepEqual(calls.save, []);
  assert.deepEqual(calls.speaker, []);
  await render(dialogue);
  assert.equal(container.querySelector('textarea').value, dialogue.text);
  await click('บันทึกการแก้ไข');
  assert.deepEqual(calls.save, [[dialogue.id, dialogue.text, 'a', 'Alice']]);
});

test('converting dialogue to narration targets its block and closes', async () => {
  await render(dialogue);
  await click('บทบรรยาย (Narration)');
  assert.deepEqual(calls.narration, [[dialogue.id]]);
  assert.deepEqual(calls.save, []);
  assert.equal(calls.close, 1);
  assert.equal(container.innerHTML, '');
});

test('legacy speaker callback still works when onSaveBlock is absent', async () => {
  await render(dialogue, { onSaveBlock: undefined });
  await click('Bob');
  await click('บันทึกการแก้ไข');
  assert.deepEqual(calls.speaker, [[dialogue.id, 'b', 'Bob']]);
  assert.equal(calls.close, 1);
  await render(dialogue);
  await click('บันทึกการแก้ไข');
  assert.equal(calls.speaker.length, 1, 'Unchanged speaker must not trigger an update');
});
