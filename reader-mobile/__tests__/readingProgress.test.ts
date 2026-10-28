import { createProgressWriter, getResumeOffset, anchorAtOffset, offsetForAnchor } from '../src/services/readingProgress';

jest.mock('../src/services/storage', () => ({ saveReadingProgress: jest.fn().mockResolvedValue(undefined) }));

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

test('coalesces continuous scrolling to the latest position once a second', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const writer = createProgressWriter('novel', 'ch-01', jest.fn(), save);
  for (let percent = 0; percent < 90; percent++) writer.update(percent);
  expect(save).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1000);
  expect(save).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenLastCalledWith('novel', 'ch-01', 89);
  writer.update(90);
  await jest.advanceTimersByTimeAsync(999);
  expect(save).toHaveBeenCalledTimes(1);
  writer.dispose();
  expect(save).toHaveBeenLastCalledWith('novel', 'ch-01', 90);
  expect(jest.getTimerCount()).toBe(0);
});

test('flush saves the last position on exit, and old callbacks cannot write to another chapter', () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const old = createProgressWriter('novel', 'ch-01', jest.fn(), save);
  old.update(51.2); old.dispose(); old.update(0);
  const next = createProgressWriter('novel', 'ch-02', jest.fn(), save);
  next.update(3); next.flush(); next.dispose();
  expect(save.mock.calls).toEqual([['novel', 'ch-01', 51.2], ['novel', 'ch-02', 3]]);
});

test('does not overwrite progress if content never loaded successfully', () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const writer = createProgressWriter('novel', 'missing', jest.fn(), save);
  writer.flush(); writer.dispose();
  expect(save).not.toHaveBeenCalled();
});

test('reports a storage failure and retries the pending latest value on flush', async () => {
  const save = jest.fn().mockRejectedValueOnce(new Error('Disk full')).mockResolvedValue(undefined);
  const onError = jest.fn();
  const writer = createProgressWriter('novel', 'ch-01', onError, save);
  writer.update(44); writer.flush();
  await Promise.resolve();
  expect(onError).toHaveBeenCalledTimes(1);
  writer.flush();
  expect(save).toHaveBeenLastCalledWith('novel', 'ch-01', 44);
  writer.dispose();
});

test('computes resume offset using actual viewport and clamps short chapters', () => {
  expect(getResumeOffset(50, 3000, 900)).toBe(1050);
  expect(getResumeOffset(100, 400, 900)).toBe(0);
  expect(getResumeOffset(120, 3000, 900)).toBe(2100);
});

test('anchors inside a paragraph, follows its changed height, and uses the nearest surviving index', () => {
  const layouts = [{ id: 'a', index: 0, y: 0, height: 100 }, { id: 'b', index: 1, y: 100, height: 200 }];
  const anchor = anchorAtOffset(layouts, 150)!;
  expect(anchor).toEqual({ blockId: 'b', blockIndex: 1, fraction: 0.25 });
  expect(offsetForAnchor(anchor, [{ ...layouts[1], y: 180, height: 400 }])).toBe(280);
  expect(offsetForAnchor(anchor, [{ id: 'replacement', index: 1, y: 200, height: 80 }])).toBe(220);
  expect(offsetForAnchor(anchor, [])).toBeUndefined();
});

test('writer persists the anchor along with the fallback percentage', () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const writer = createProgressWriter('novel', 'ch-01', jest.fn(), save);
  const anchor = { blockId: 'b', blockIndex: 1, fraction: 0.25 };
  writer.update(40, anchor); writer.flush();
  expect(save).toHaveBeenCalledWith('novel', 'ch-01', 40, anchor);
});

test('a late failed write cannot requeue an older position after a newer update', async () => {
  let reject!: (cause: Error) => void;
  const save = jest.fn().mockImplementationOnce(() => new Promise<void>((_resolve, fail) => { reject = fail; }))
    .mockResolvedValue(undefined);
  const writer = createProgressWriter('novel', 'ch-01', jest.fn(), save);
  writer.update(10); writer.flush();
  writer.update(80); writer.flush();
  reject(new Error('Old write failed'));
  await Promise.resolve();
  writer.dispose();
  expect(save).toHaveBeenCalledTimes(2);
  expect(save).toHaveBeenLastCalledWith('novel', 'ch-01', 80);
});
