import React from 'react';
import { FlatList } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ChapterPickerModal } from '../src/components/ChapterPickerModal';
import { ChapterListItem } from '../src/types';
import { themes } from '../src/theme/colors';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('lucide-react-native', () => ({ X: () => null, Check: () => null }));

const chapters: ChapterListItem[] = Array.from({ length: 100 }, (_, index) => ({
  id: `chapter-${index + 1}`, novelId: 'novel', chapterNumber: index + 1,
  title: `ตอนที่ ${index + 1} ชื่อภาษาไทยที่ยาวและอาจขึ้นบรรทัดใหม่`,
}));
const props: React.ComponentProps<typeof ChapterPickerModal> = {
  visible: true, chapters, currentChapterId: 'chapter-69', colors: themes.light, status: 'ready',
  onSelect: jest.fn(), onClose: jest.fn(), onRetry: jest.fn(),
};
const layout = () => fireEvent(screen.getByTestId('chapter-picker-list'), 'layout', {
  nativeEvent: { layout: { height: 400, width: 320, x: 0, y: 0 } },
});
let scroll: jest.SpyInstance;
let offset: jest.SpyInstance;
beforeEach(() => {
  jest.useFakeTimers();
  scroll = jest.spyOn(FlatList.prototype, 'scrollToIndex').mockImplementation(() => undefined);
  offset = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => undefined);
});
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

function failScroll(this: FlatList<ChapterListItem>, { index }: { index: number }) {
  this.props.onScrollToIndexFailed?.({ index, averageItemLength: 80, highestMeasuredFrameIndex: 11 });
}

test('opening centers the current chapter by ID after the list is laid out', async () => {
  const view = await render(<ChapterPickerModal {...props} />);
  expect(scroll).not.toHaveBeenCalled();
  await layout();
  expect(scroll).toHaveBeenLastCalledWith({ index: 68, viewPosition: 0.5, animated: false });
  await view.unmount();
});

test('reopening centers again even with the same chapter; changing chapters uses the new ID', async () => {
  const view = await render(<ChapterPickerModal {...props} />);
  await layout();
  await view.rerender(<ChapterPickerModal {...props} visible={false} />);
  scroll.mockClear();
  await view.rerender(<ChapterPickerModal {...props} />);
  await layout();
  expect(scroll).toHaveBeenLastCalledWith({ index: 68, viewPosition: 0.5, animated: false });
  await view.rerender(<ChapterPickerModal {...props} visible={false} currentChapterId="chapter-90" />);
  await view.rerender(<ChapterPickerModal {...props} currentChapterId="chapter-90" />);
  await layout();
  expect(scroll).toHaveBeenLastCalledWith({ index: 89, viewPosition: 0.5, animated: false });
  await view.unmount();
});

test('a list arriving after opening still centers the current chapter', async () => {
  const view = await render(<ChapterPickerModal {...props} status="loading" chapters={[]} />);
  expect(scroll).not.toHaveBeenCalled();
  await view.rerender(<ChapterPickerModal {...props} />);
  await layout();
  expect(scroll).toHaveBeenLastCalledWith({ index: 68, viewPosition: 0.5, animated: false });
  await view.unmount();
});

test('an unmeasured distant chapter scrolls near the target then retries using measured rows', async () => {
  scroll.mockImplementationOnce(failScroll);
  const view = await render(<ChapterPickerModal {...props} />);
  await layout();
  expect(offset).toHaveBeenCalledWith({ offset: 68 * 80 - 200, animated: false });
  await act(async () => { jest.advanceTimersByTime(100); });
  expect(scroll).toHaveBeenCalledTimes(2);
  expect(scroll).toHaveBeenLastCalledWith({ index: 68, viewPosition: 0.5, animated: false });
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(scroll).toHaveBeenCalledTimes(2);
  await view.unmount();
});

test.each(['close', 'unmount', 'drag'] as const)('%s cancels pending retries', async action => {
  scroll.mockImplementation(failScroll);
  const view = await render(<ChapterPickerModal {...props} />);
  await layout();
  const count = scroll.mock.calls.length;
  if (action === 'close') await view.rerender(<ChapterPickerModal {...props} visible={false} />);
  else if (action === 'unmount') await view.unmount();
  else await fireEvent(screen.getByTestId('chapter-picker-list'), 'scrollBeginDrag');
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(scroll).toHaveBeenCalledTimes(count);
  if (action !== 'unmount') await view.unmount();
});

test('retries are bounded if measurement never becomes available', async () => {
  scroll.mockImplementation(failScroll);
  const view = await render(<ChapterPickerModal {...props} />);
  await layout();
  await act(async () => { jest.advanceTimersByTime(2000); });
  expect(scroll).toHaveBeenCalledTimes(20);
  await view.unmount();
});

test.each(['chapter-1', 'chapter-100', 'absent'])('handles boundary or missing current chapter %s', async id => {
  const view = await render(<ChapterPickerModal {...props} currentChapterId={id} />);
  await layout();
  if (id === 'absent') expect(scroll).not.toHaveBeenCalled();
  else expect(scroll).toHaveBeenLastCalledWith({ index: id === 'chapter-1' ? 0 : 99, viewPosition: 0.5, animated: false });
  await view.unmount();
});
