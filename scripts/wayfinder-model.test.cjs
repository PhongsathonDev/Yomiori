const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const model = require('./wayfinder-model.cjs');
const root = join(__dirname, '..');
function issue(id, options = {}, body = '') {
  return model.parse(`---\nid: ${id}\ntitle: งาน ${id}\nstate: ${options.state || 'open'}\nlabels: ${options.labels || 'wayfinder:task'}\nassignee: ${options.assignee || ''}\nparent: ${options.parent || ''}\n---\n${body}`);
}
const map = () => issue('WF-0001', { labels: 'wayfinder:map' });

test('parses CRLF and relationships only in their canonical sections', () => {
  const result = issue('WF-0002', {}, '## Evidence\n- [not a blocker](WF-0008.md)\n## Blocked by\n- [wait](WF-0003.md)\n## Work with\n- [partner](WF-0004.md)\n## Question\nBody');
  assert.deepEqual(result.blockers, ['WF-0003']);
  assert.deepEqual(result.companions, ['WF-0004']);
  assert.equal(model.parse('---\r\nid: WF-0099\r\ntitle: Thai ไทย\r\nstate: open\r\n---\r\nBody').title, 'Thai ไทย');
  assert.throws(() => model.parse('no frontmatter'));
});
test('groups by parent and counts tickets without counting maps twice', () => {
  const result = model.build([map(), issue('WF-0002', { parent:'WF-0001' }), issue('WF-0008')]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.tasks.length, 2);
  assert.equal(result.groups.find(g => g.id === 'WF-0001').tasks[0].id, 'WF-0002');
  assert.equal(result.groups.find(g => g.id === 'standalone').tasks[0].id, 'WF-0008');
});
test('frontier waits for every blocker, then respects claims and closed state', () => {
  const before = issue('WF-0003', { state:'closed' });
  const other = issue('WF-0004');
  const target = issue('WF-0002', {}, '## Blocked by\n- [a](WF-0003.md)\n- [b](WF-0004.md)');
  assert.equal(model.build([target, before, other]).tasks[0].status, 'blocked');
  other.state = 'closed';
  assert.equal(model.build([target, before, other]).tasks[0].status, 'ready');
  target.assignee = 'dev';
  assert.equal(model.build([target, before, other]).tasks[0].status, 'claimed');
  target.state = 'closed'; other.state = 'open';
  assert.equal(model.build([target, before, other]).tasks[0].status, 'closed');
});
test('cross-map coordination does not create a blocker or move group membership', () => {
  const a = issue('WF-0002', { parent:'WF-0001' }, '## Work with\n- [b](WF-0003.md)');
  const b = issue('WF-0003', {}, '## Work with\n- [a](WF-0002.md)');
  const result = model.build([map(), a, b]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.tasks[0].status, 'ready');
  assert.equal(result.groups.find(g => g.id === 'WF-0001').tasks.length, 1);
});
test('rejects missing parents, references, one-way coordination and duplicate IDs', () => {
  assert.match(model.build([issue('WF-0002', { parent:'WF-9999' })]).errors.join(' '), /แผนแม่/);
  const a = issue('WF-0002', {}, '## Work with\n- [b](WF-0003.md)');
  assert.match(model.build([a]).errors.join(' '), /อ้างอิง/);
  assert.match(model.build([a, issue('WF-0003')]).errors.join(' '), /ลิงก์กลับ/);
  assert.match(model.build([a, a]).errors.join(' '), /ซ้ำ/);
});
test('detects dependency cycles and self-reference, keeps missing blockers blocked', () => {
  const a = issue('WF-0002', {}, '## Blocked by\n- [b](WF-0003.md)');
  const b = issue('WF-0003', {}, '## Blocked by\n- [a](WF-0002.md)');
  assert.match(model.build([a, b]).errors.join(' '), /วนกลับ/);
  assert.match(model.build([issue('WF-0002', {}, '## Blocked by\n- [self](WF-0002.md)')]).errors.join(' '), /ตัวเอง/);
  assert.equal(model.build([a]).tasks[0].status, 'blocked');
});
test('group command includes scope, names and sequential Wayfinder guardrails', () => {
  const text = model.command({ title:'หน้าแรก' }, [issue('WF-0002')]);
  assert.match(text, /หน้าแรก/);
  assert.match(text, /งาน WF-0002/);
  assert.match(text, /ไม่ติด blocker/);
  assert.match(text, /ไม่ได้อนุญาตให้ปิดหลาย/);
});
test('repository relationships are valid and dashboard snapshot/model match canonical files', () => {
  const entries = readdirSync(join(root, '.wayfinder/issues')).filter(f => /^WF-\d+\.md$/.test(f)).sort().map(file =>
    model.parse(readFileSync(join(root, '.wayfinder/issues', file), 'utf8'), `https://github.com/PhongsathonDev/Yomiori/blob/main/.wayfinder/issues/${file}`));
  assert.deepEqual(model.build(entries).errors, []);
  const html = readFileSync(join(root, 'tasks.html'), 'utf8');
  const snapshot = JSON.parse(html.match(/<script id="task-snapshot" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(snapshot, entries);
  assert.equal(html.match(/<script id="task-model">\n([\s\S]*?)\n<\/script>/)[1], readFileSync(join(__dirname, 'wayfinder-model.cjs'), 'utf8'));
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) if (!match[1].includes('application/json')) new vm.Script(match[2]);
});
