import React from 'react';
import { AppState } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReaderScreen } from '../src/screens/ReaderScreen';
import { getChapterForReading, fetchCharacters, getAvailableChapterList } from '../src/services/api';
import { getReadingProgress, saveReadingProgress } from '../src/services/storage';
import * as characterModal from '../src/components/CharacterDetailModal';
import { ReaderStory } from '../src/components/ReaderStory';
import { themes } from '../src/theme/colors';
import { Chapter, Character } from '../src/types';
import longChapter from '../src/data/novels/kyudo-senpai/chapters/ch-69.json';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-navigation-bar', () => ({ NavigationBar: () => null }));
jest.mock('lucide-react-native', () => Object.fromEntries(
  ['ArrowLeft', 'ChevronLeft', 'ChevronRight', 'Sun', 'Moon', 'Coffee', 'Type', 'X', 'Minus', 'Plus', 'Check', 'Sparkles', 'User'].map(name => [name, () => null]),
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
  addListener: jest.fn(() => jest.fn()), goBack: jest.fn(), replace: jest.fn(),
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
