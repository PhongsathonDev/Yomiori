import React from 'react';
import { AppState, StyleSheet, ScrollView } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReaderScreen } from '../src/screens/ReaderScreen';
import { getChapterForReading, fetchCharacters, getAvailableChapterList } from '../src/services/api';
import { getReadingProgress, saveReadingProgress, saveTheme, saveFontSize } from '../src/services/storage';
import * as characterModal from '../src/components/CharacterDetailModal';
import { ReaderStory } from '../src/components/ReaderStory';
import { themes } from '../src/theme/colors';
import { Chapter, Character } from '../src/types';
import longChapter from '../src/data/novels/kyudo-senpai/chapters/ch-69.json';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-navigation-bar', () => ({ NavigationBar: () => null }));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('lucide-react-native', () => Object.fromEntries(
  ['ArrowLeft', 'ChevronLeft', 'ChevronRight', 'Sun', 'Moon', 'Coffee', 'Type', 'List', 'Eye', 'EyeOff', 'X', 'Minus', 'Plus', 'Check', 'Sparkles', 'User'].map(name => [name, () => null]),
));
jest.mock('../src/components/ChapterCommentsSection', () => ({ ChapterCommentsSection: () => null }));
jest.mock('../src/services/api', () => ({
  getChapterForReading: jest.fn(), fetchCharacters: jest.fn(), getAvailableChapterList: jest.fn(),
}));
jest.mock('../src/services/storage', () => ({
  getSavedTheme: async () => 'light', getSavedFontSize: async () => 17,
  getSavedFontFamily: async () => 'Sarabun', getSavedLineHeight: async () => 1.85,
  getReadingProgress: jest.fn(), saveReadingProgress: jest.fn().mockResolvedValue(undefined),
  saveTheme: jest.fn().mockResolvedValue(undefined), saveFontSize: jest.fn().mockResolvedValue(undefined),
  saveFontFamily: jest.fn().mockResolvedValue(undefined), saveLineHeight: jest.fn().mockResolvedValue(undefined),
  resolveIllustrationUri: async (_novel: string, src: string) => src,
}));

const chapter = longChapter as Chapter;
const loaded = jest.mocked(getChapterForReading);
const saved = jest.mocked(saveReadingProgress);
const navigation = {
  addListener: jest.fn(() => jest.fn()), goBack: jest.fn(), replace: jest.fn(), navigate: jest.fn(),
};
const props = {
  route: { key: 'reader', name: 'Reader', params: { novelId: chapter.novelId, chapterId: chapter.id } },
  navigation,
} as unknown as React.ComponentProps<typeof ReaderScreen>;

beforeEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  loaded.mockResolvedValue({ chapter, cacheWarning: false });
  jest.mocked(fetchCharacters).mockResolvedValue([]);
  jest.mocked(getAvailableChapterList).mockResolvedValue([]);
  jest.mocked(getReadingProgress).mockResolvedValue({ novelId: chapter.novelId, chapterId: chapter.id, scrollPercent: 50, updatedAt: 1 });
});
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

test('load failure exits the spinner, offers retry and does not overwrite progress', async () => {
  loaded.mockResolvedValueOnce({ chapter: null, cacheWarning: false });
  const view = await render(<ReaderScreen {...props} />);
  expect(await screen.findByRole('button', { name: 'ลองอีกครั้ง' })).toBeTruthy();
  expect(screen.queryByText('กำลังเตรียมเนื้อหา...')).toBeNull();
  expect(saved).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'ลองอีกครั้ง' }));
  expect((await screen.findAllByText(chapter.title)).length).toBeGreaterThan(0);
  await view.unmount();
});

test('late resolution from a different chapter cannot replace current content', async () => {
  let resolve!: (result: { chapter: Chapter; cacheWarning: boolean }) => void;
  loaded.mockReturnValueOnce(new Promise(done => { resolve = done; }));
  const view = await render(<ReaderScreen {...props} />);
  await waitFor(() => expect(loaded).toHaveBeenCalledTimes(1));
  const next = { ...chapter, id: 'ch-next', title: 'Next chapter' };
  loaded.mockResolvedValueOnce({ chapter: next, cacheWarning: false });
  await view.rerender(<ReaderScreen {...props} route={{ ...props.route, params: { novelId: chapter.novelId, chapterId: next.id } }} />);
  await screen.findAllByText('Next chapter');
  await act(async () => { resolve({ chapter, cacheWarning: false }); });
  expect(screen.getAllByText('Next chapter').length).toBeGreaterThan(0);
  expect(screen.queryByText(chapter.title)).toBeNull();
  await view.unmount();
});

test('scrolling a real 147-block chapter skips story rendering and flushes on background/exit', async () => {
  expect(chapter.blocks).toHaveLength(147);
  const avatarLookup = jest.spyOn(characterModal, 'getAvatarSource');
  let appStateListener: ((state: 'background') => void) | undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    appStateListener = listener;
    return { remove: jest.fn() };
  });
  const view = await render(<ReaderScreen {...props} />);
  await screen.findAllByText(chapter.title);
  const beforeScroll = avatarLookup.mock.calls.length;
  expect(beforeScroll).toBeGreaterThan(0);
  const scroll = screen.getByTestId('reader-scroll');
  await fireEvent(scroll, 'layout', { nativeEvent: { layout: { height: 900 } } });
  await fireEvent(scroll, 'contentSizeChange', 400, 3000);
  await fireEvent(scroll, 'scrollBeginDrag');
  await fireEvent.scroll(scroll, { nativeEvent: { contentOffset: { y: 1260 }, contentSize: { height: 3000 }, layoutMeasurement: { height: 900 } } });
  expect(screen.getByText('60%')).toBeTruthy();
  expect(avatarLookup).toHaveBeenCalledTimes(beforeScroll);
  await act(async () => { appStateListener?.('background'); });
  expect(saved).toHaveBeenLastCalledWith(chapter.novelId, chapter.id, 60);
  // The terminal drag event may carry a newer offset than throttled onScroll.
  await fireEvent(scroll, 'scrollEndDrag', { nativeEvent: { contentOffset: { y: 1365 }, contentSize: { height: 3000 }, layoutMeasurement: { height: 900 } } });
  expect(saved).toHaveBeenLastCalledWith(chapter.novelId, chapter.id, 65);
  await view.unmount();
});

test('saves a paragraph anchor and retains it when the reader opens again', async () => {
  const shortChapter: Chapter = { ...chapter, blocks: [{ id: 'paragraph-1', type: 'narration', text: 'A long paragraph' }] };
  loaded.mockResolvedValue({ chapter: shortChapter, cacheWarning: false });
  const view = await render(<ReaderScreen {...props} />);
  await screen.findByText('A long paragraph');
  const scroll = screen.getByTestId('reader-scroll');
  await fireEvent(scroll, 'layout', { nativeEvent: { layout: { height: 400 } } });
  await fireEvent(scroll, 'contentSizeChange', 400, 1400);
  await fireEvent(screen.getByTestId('reader-spine'), 'layout', { nativeEvent: { layout: { y: 100 } } });
  await fireEvent(screen.getByTestId('reader-story'), 'layout', { nativeEvent: { layout: { y: 100 } } });
  await fireEvent(screen.getByTestId('story-block-0'), 'layout', { nativeEvent: { layout: { y: 0, height: 200 } } });
  await fireEvent(scroll, 'scrollBeginDrag');
  await fireEvent(scroll, 'scrollEndDrag', { nativeEvent: { contentOffset: { y: 300 }, contentSize: { height: 1400 }, layoutMeasurement: { height: 400 } } });
  expect(saved).toHaveBeenLastCalledWith(chapter.novelId, chapter.id, 30, { blockId: 'paragraph-1', blockIndex: 0, fraction: 0.5 });
  await view.unmount();
  jest.mocked(getReadingProgress).mockResolvedValue({ novelId: chapter.novelId, chapterId: chapter.id, scrollPercent: 30, updatedAt: 1, anchor: { blockId: 'paragraph-1', blockIndex: 0, fraction: 0.5 } });
  const reopened = await render(<ReaderScreen {...props} />);
  await screen.findByText('A long paragraph');
  await reopened.unmount();
  expect(saved).toHaveBeenLastCalledWith(chapter.novelId, chapter.id, 30, { blockId: 'paragraph-1', blockIndex: 0, fraction: 0.5 });
});

test('restores the saved paragraph after its layout changes', async () => {
  const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => undefined);
  const shortChapter: Chapter = { ...chapter, blocks: [{ id: 'paragraph-1', type: 'narration', text: 'A paragraph to resume' }] };
  loaded.mockResolvedValue({ chapter: shortChapter, cacheWarning: false });
  jest.mocked(getReadingProgress).mockResolvedValue({ novelId: chapter.novelId, chapterId: chapter.id, scrollPercent: 30, updatedAt: 1, anchor: { blockId: 'paragraph-1', blockIndex: 0, fraction: 0.5 } });
  const view = await render(<ReaderScreen {...props} />);
  await screen.findByText('A paragraph to resume');
  const scroll = screen.getByTestId('reader-scroll');
  await fireEvent(scroll, 'layout', { nativeEvent: { layout: { height: 400 } } });
  await fireEvent(scroll, 'contentSizeChange', 400, 1400);
  await fireEvent(screen.getByTestId('reader-spine'), 'layout', { nativeEvent: { layout: { y: 100 } } });
  await fireEvent(screen.getByTestId('reader-story'), 'layout', { nativeEvent: { layout: { y: 100 } } });
  await fireEvent(screen.getByTestId('story-block-0'), 'layout', { nativeEvent: { layout: { y: 0, height: 200 } } });
  await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith({ y: 300, animated: false }));
  await fireEvent(screen.getByTestId('story-block-0'), 'layout', { nativeEvent: { layout: { y: 0, height: 400 } } });
  await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith({ y: 400, animated: false }));
  await fireEvent(scroll, 'scrollBeginDrag');
  await fireEvent(scroll, 'scrollEndDrag', { nativeEvent: { contentOffset: { y: 400 }, contentSize: { height: 1400 }, layoutMeasurement: { height: 400 } } });
  await fireEvent(screen.getByTestId('story-block-0'), 'layout', { nativeEvent: { layout: { y: 0, height: 600 } } });
  await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith({ y: 500, animated: false }));
  await view.unmount();
});

test('the real story skips dialogue work until typography changes', async () => {
  const storyProps = {
    novelId: chapter.novelId, blocks: chapter.blocks, characterMap: new Map<string, Character>(),
    colors: themes.light, fontSize: 17, fontFamily: 'Sarabun' as const, lineHeightRatio: 1.85 as const,
    onToggleControls: jest.fn(), onSelectCharacter: jest.fn(), onOpenIllustration: jest.fn(),
  };
  const view = await render(<ReaderStory {...storyProps} />);
  const lookup = jest.spyOn(characterModal, 'getAvatarSource');
  await view.rerender(<ReaderStory {...storyProps} />);
  expect(lookup).not.toHaveBeenCalled();
  await view.rerender(<ReaderStory {...storyProps} fontSize={20} />);
  expect(lookup).toHaveBeenCalled();
  await view.unmount();
});

test('header opens a chapter overlay and selection flushes progress without visiting novel details', async () => {
  jest.mocked(getAvailableChapterList).mockResolvedValue([
    { id: chapter.id, novelId: chapter.novelId, chapterNumber: chapter.chapterNumber, title: chapter.title },
    { id: 'ch-00', novelId: chapter.novelId, chapterNumber: 0, title: 'ภาพประกอบ' },
  ]);
  const view = await render(<ReaderScreen {...props} />);
  await screen.findAllByText(chapter.title);
  await fireEvent.press(screen.getByRole('button', { name: 'เปิดสารบัญ' }));
  expect(screen.getByRole('header', { name: 'เลือกตอน' })).toBeTruthy();
  expect(screen.getByRole('button', { name: `เลือกตอน ${chapter.title}` }).props.accessibilityState.selected).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'เลือกตอน ภาพประกอบ' }));
  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(navigation.replace).toHaveBeenCalledWith('Reader', { novelId: chapter.novelId, chapterId: 'ch-00' });
  expect(saved).toHaveBeenCalledWith(chapter.novelId, chapter.id, 50);
  await view.unmount();
});

test('closing the chapter overlay or selecting the current chapter keeps the reader and its insets', async () => {
  jest.mocked(getAvailableChapterList).mockResolvedValue([
    { id: chapter.id, novelId: chapter.novelId, chapterNumber: chapter.chapterNumber, title: chapter.title },
  ]);
  const view = await render(<ReaderScreen {...props} />);
  await screen.findAllByText(chapter.title);
  const before = StyleSheet.flatten(screen.getByTestId('reader-scroll').props.contentContainerStyle);
  await fireEvent.press(screen.getByRole('button', { name: 'เปิดสารบัญ' }));
  await fireEvent.press(screen.getByRole('button', { name: 'ปิดสารบัญ' }));
  expect(screen.queryByRole('header', { name: 'เลือกตอน' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'เปิดสารบัญ' }));
  await fireEvent.press(screen.getByRole('button', { name: `เลือกตอน ${chapter.title}` }));
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(StyleSheet.flatten(screen.getByTestId('reader-scroll').props.contentContainerStyle)).toEqual(before);
  await fireEvent.press(screen.getByRole('button', { name: 'เปิดสารบัญ' }));
  await fireEvent.press(screen.getByTestId('chapter-picker-backdrop', { includeHiddenElements: true }));
  expect(screen.queryByRole('header', { name: 'เลือกตอน' })).toBeNull();
  await view.unmount();
});

test('chapter list failures can be retried without reloading the reading content', async () => {
  jest.mocked(getAvailableChapterList).mockRejectedValueOnce(new Error('Unavailable'));
  const view = await render(<ReaderScreen {...props} />);
  await screen.findAllByText(chapter.title);
  await fireEvent.press(screen.getByRole('button', { name: 'เปิดสารบัญ' }));
  expect(await screen.findByText('โหลดรายชื่อตอนไม่ได้')).toBeTruthy();
  jest.mocked(getAvailableChapterList).mockResolvedValue([
    { id: 'ch-new', novelId: chapter.novelId, chapterNumber: 99, title: 'ตอนใหม่' },
  ]);
  await fireEvent.press(screen.getByRole('button', { name: 'ลองโหลดสารบัญอีกครั้ง' }));
  expect(await screen.findByRole('button', { name: 'เลือกตอน ตอนใหม่' })).toBeTruthy();
  expect(getAvailableChapterList).toHaveBeenLastCalledWith(chapter.novelId, false);
  expect(loaded).toHaveBeenCalledTimes(1);
  await view.unmount();
});

test('a pending chapter list never blocks reading and an empty list offers retry', async () => {
  let finish!: (chapters: []) => void;
  jest.mocked(getAvailableChapterList).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const view = await render(<ReaderScreen {...props} />);
  await screen.findAllByText(chapter.title);
  await fireEvent.press(screen.getByRole('button', { name: 'เปิดสารบัญ' }));
  expect(screen.getByText('กำลังโหลดรายชื่อตอน...')).toBeTruthy();
  await act(async () => { finish([]); });
  expect(screen.getByText('ยังไม่มีรายชื่อตอน')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'ลองโหลดสารบัญอีกครั้ง' })).toBeTruthy();
  await view.unmount();
});

test('hiding and revealing chrome leaves the story viewport and insets unchanged', async () => {
  const view = await render(<ReaderScreen {...props} />);
  await screen.findAllByText(chapter.title);
  const before = StyleSheet.flatten(screen.getByTestId('reader-scroll').props.contentContainerStyle);
  await fireEvent.press(screen.getByRole('button', { name: 'ซ่อนเครื่องมืออ่าน' }));
  expect(StyleSheet.flatten(screen.getByTestId('reader-scroll').props.contentContainerStyle)).toEqual(before);
  expect(screen.getByTestId('reader-dock', { includeHiddenElements: true }).props.pointerEvents).toBe('none');
  expect(screen.queryByRole('button', { name: 'ตั้งค่าการอ่าน' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'แสดงเครื่องมืออ่าน' }));
  expect(StyleSheet.flatten(screen.getByTestId('reader-scroll').props.contentContainerStyle)).toEqual(before);
  expect(screen.getByRole('button', { name: 'ตั้งค่าการอ่าน' })).toBeTruthy();
  await view.unmount();
});

test('historical end-of-chapter navigation still flushes progress before changing chapters', async () => {
  jest.mocked(getAvailableChapterList).mockResolvedValue([
    { id: chapter.id, novelId: chapter.novelId, chapterNumber: chapter.chapterNumber, title: chapter.title },
    { id: 'ch-next', novelId: chapter.novelId, chapterNumber: chapter.chapterNumber + 1, title: 'Next' },
  ]);
  const view = await render(<ReaderScreen {...props} />);
  await screen.findAllByText(chapter.title);
  await fireEvent.press(screen.getByRole('button', { name: 'อ่านตอนถัดไป' }));
  expect(navigation.replace).toHaveBeenCalledWith('Reader', { novelId: chapter.novelId, chapterId: 'ch-next' });
  expect(saved).toHaveBeenCalledWith(chapter.novelId, chapter.id, 50);
  await view.unmount();
});

test('restores the 1.0.0 chapter heading, paragraph indent and compact chrome', async () => {
  const text = 'ข้อความย่อหน้าเดิม';
  loaded.mockResolvedValue({ chapter: { ...chapter, blocks: [{ id: 'original-paragraph', type: 'narration', text }] }, cacheWarning: false });
  const view = await render(<ReaderScreen {...props} />);
  await screen.findByText(`CHAPTER ${chapter.chapterNumber}`);
  const heading = screen.getAllByText(chapter.title).find(node => node.props.accessibilityRole === 'header');
  expect(StyleSheet.flatten(heading?.props.style)).toMatchObject({ fontSize: 18, lineHeight: 25, textAlign: 'center' });
  expect(screen.getByText(text).props.children.join('')).toBe(`\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0${text}`);
  expect(StyleSheet.flatten(screen.getByTestId('reader-scroll').props.contentContainerStyle).paddingHorizontal).toBe(22);
  const dock = screen.getByTestId('reader-dock');
  expect(StyleSheet.flatten(dock.props.style)).toMatchObject({ left: '5%', right: '5%' });
  const light = screen.getByRole('radio', { name: 'ธีมสว่าง' });
  expect(light.props.hitSlop).toBe(8);
  expect(StyleSheet.flatten(screen.getByTestId('reader-theme-light').props.style)).toMatchObject({ width: 32, height: 32, borderRadius: 16 });
  await view.unmount();
});

test('the reading sheet preserves direct theme and font-size controls', async () => {
  const view = await render(<ReaderScreen {...props} />);
  await screen.findAllByText(chapter.title);
  await fireEvent.press(screen.getByRole('button', { name: 'ตั้งค่าการอ่าน' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'ธีมมืด' }));
  expect(saveTheme).toHaveBeenCalledWith('dark');
  expect(screen.getByRole('radio', { name: 'ธีมมืด' }).props.accessibilityState.selected).toBe(true);
  await fireEvent.press(screen.getByLabelText('เพิ่มขนาดตัวอักษร'));
  expect(saveFontSize).toHaveBeenCalledWith(18);
  await view.unmount();
});


test('floating font chip opens settings and quick theme buttons persist selection', async () => {
  const view = await render(<ReaderScreen {...props} />);
  await screen.findAllByText(chapter.title);
  expect(screen.getByText('Sarabun · 17')).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'ธีมโทนอุ่น' }));
  expect(saveTheme).toHaveBeenCalledWith('sepia');
  expect(screen.getByRole('radio', { name: 'ธีมโทนอุ่น' }).props.accessibilityState.selected).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'ตั้งค่าการอ่าน' }));
  expect(screen.getByLabelText('เพิ่มขนาดตัวอักษร')).toBeTruthy();
  await view.unmount();
});
