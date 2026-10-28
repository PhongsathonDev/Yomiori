/**
 * Reproduction script for WF-0019:
 * React Hook Order Violation in QuickFixModal (reader-web)
 *
 * Verifies that rendering QuickFixModal conditionally after early return
 * violates React's Rules of Hooks when transitioning from block=null to block={...}.
 */

import { JSDOM } from '../../../reader-mobile/node_modules/jsdom/lib/api.js';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root-prod"></div><div id="root-control"></div></body></html>', {
  runScripts: 'dangerously',
});
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.IS_REACT_ACT_ENVIRONMENT = true;

import React, { useState, useEffect, act } from '../../../reader-web/node_modules/react/index.js';
import ReactDOM from '../../../reader-web/node_modules/react-dom/client.js';
import { createServer } from '../../../reader-web/node_modules/vite/dist/node/index.js';

const capturedErrors = [];
const originalConsoleError = console.error;
console.error = (...args) => {
  capturedErrors.push(args.join(' '));
  originalConsoleError(...args);
};

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  root: './reader-web',
});

// Load the actual production component
const { QuickFixModal } = await vite.ssrLoadModule('/src/components/QuickFixModal.tsx');

// Control component: Follows React Rules of Hooks unconditionally
function CompliantQuickFixModal({ block }) {
  const initialText = block && 'text' in block ? block.text : '';
  const initialSpeakerId = block && block.type === 'dialogue' ? block.speakerId : '';
  const initialSpeakerName = block && block.type === 'dialogue' ? block.speakerName : '';

  const [text, setText] = useState(initialText);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(initialSpeakerId);
  const [selectedSpeakerName, setSelectedSpeakerName] = useState(initialSpeakerName);

  useEffect(() => {
    if (!block) return;
    setText('text' in block ? block.text : '');
    setSelectedSpeakerId(block.type === 'dialogue' ? block.speakerId : '');
    setSelectedSpeakerName(block.type === 'dialogue' ? block.speakerName : '');
  }, [block]);

  if (!block) return null;
  return React.createElement('div', { id: 'modal-rendered' }, text);
}

console.log('=== TEST 1: Production QuickFixModal (Reachable App.tsx Flow) ===');
const prodRootEl = dom.window.document.getElementById('root-prod');
const prodRoot = ReactDOM.createRoot(prodRootEl);

let setProdBlock;
function ProdAppHarness() {
  const [editingBlock, setEditingBlock] = useState(null);
  setProdBlock = setEditingBlock;
  return React.createElement(QuickFixModal, {
    block: editingBlock,
    characters: [],
    onClose: () => {},
    onUpdateSpeaker: () => {},
    onConvertToNarration: () => {},
    onSaveBlock: () => {},
  });
}

// 1. Initial render with block=null (App.tsx initial state)
await act(async () => {
  prodRoot.render(React.createElement(ProdAppHarness));
});
console.log('Step 1 (Mount block=null) errors:', capturedErrors.length);

// 2. User clicks quick-fix on a block -> editingBlock set to non-null
await act(async () => {
  setProdBlock({ id: 'block-01', type: 'narration', text: 'Sample narration text' });
});
console.log('Step 2 (Open modal with block) errors:', capturedErrors.length);
const prodFailed = capturedErrors.length > 0;
console.log('Production component hook violation observed:', prodFailed);

console.log('\n=== TEST 2: Control Case (Compliant Hook Ordering) ===');
const controlErrors = [];
console.error = (...args) => {
  controlErrors.push(args.join(' '));
  originalConsoleError(...args);
};

const controlRootEl = dom.window.document.getElementById('root-control');
const controlRoot = ReactDOM.createRoot(controlRootEl);

let setControlBlock;
function ControlAppHarness() {
  const [editingBlock, setEditingBlock] = useState(null);
  setControlBlock = setEditingBlock;
  return React.createElement(CompliantQuickFixModal, { block: editingBlock });
}

await act(async () => {
  controlRoot.render(React.createElement(ControlAppHarness));
});
console.log('Control Step 1 (Mount block=null) errors:', controlErrors.length);

await act(async () => {
  setControlBlock({ id: 'block-01', type: 'narration', text: 'Sample narration text' });
});
console.log('Control Step 2 (Open modal with block) errors:', controlErrors.length);

await act(async () => {
  setControlBlock(null);
});
console.log('Control Step 3 (Close modal) errors:', controlErrors.length);

console.log('\n=== SUMMARY ===');
console.log('Production Errors Count:', capturedErrors.length);
console.log('Control Errors Count:', controlErrors.length);

await vite.close();

if (!prodFailed || controlErrors.length !== 0) {
  process.exit(1);
}
