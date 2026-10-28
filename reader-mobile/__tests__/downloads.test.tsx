import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NovelDetailScreen } from '../src/screens/NovelDetailScreen';
import { downloadChapterOnDemand, fetchNovels, getAvailableChapterList, fetchCharacters, fetchIllustrations } from '../src/services/api';
import { getChapterOfflineStatus, getNovelOfflineStats } from '../src/services/storage';
import { Novel } from '../src/types';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-navigation-bar', () => ({ NavigationBar: () => null }));
jest.mock('react-native/Libraries/Components/RefreshControl/RefreshControl', () => {
  const React = require('react');
  return { __esModule: true, default: function RefreshControl(props: object) { return React.createElement('RCTRefreshControl', props); } };
});
jest.mock('lucide-react-native', () => Object.fromEntries(
  ['ArrowLeft', 'Download', 'Settings2', 'Trash2', 'X', 'HardDrive', 'Check', 'BookOpen', 'Images', 'Sparkles', 'Users'].map(name => [name, () => null]),
));
jest.mock('../src/services/api', () => ({
  downloadChapterOnDemand: jest.fn(), fetchNovels: jest.fn(), getAvailableChapterList: jest.fn(), fetchCharacters: jest.fn(), fetchIllustrations: jest.fn(),
}));
jest.mock('../src/services/storage', () => ({
  getSavedTheme: async () => 'light', getChapterOfflineStatus: jest.fn(),
  readMetadata: jest.fn().mockResolvedValue(null),
  withOfflineJob: async (_novel: string, work: () => Promise<void>) => work(),
  clearNovelOfflineStorage: jest.fn().mockResolvedValue(undefined),
  getNovelOfflineStats: jest.fn(async () => ({ count: 1, totalBytes: 1000 })),
}));

const novel: Novel = { id: 'novel', title: 'Test novel', author: 'Author', coverUrl: 'https://example.com/cover.jpg', synopsis: 'Story', tags: [], totalOriginalChapters: 3 };
const chapters = [1, 2, 3].map(number => ({ novelId: novel.id, id: `ch-${number}`, chapterNumber: number, title: `Chapter ${number}` }));
const navigation = { addListener: jest.fn(() => jest.fn()), goBack: jest.fn() };
const props = {
  route: { key: 'detail', name: 'NovelDetail', params: { novelId: novel.id } }, navigation,
} as unknown as React.ComponentProps<typeof NovelDetailScreen>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(fetchNovels).mockResolvedValue([novel]);
  jest.mocked(getAvailableChapterList).mockResolvedValue(chapters);
  jest.mocked(fetchCharacters).mockResolvedValue([]);
  jest.mocked(fetchIllustrations).mockResolvedValue([]);
  jest.mocked(getChapterOfflineStatus).mockResolvedValue('missing');
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});
afterEach(() => { jest.restoreAllMocks(); });

test('selected contents and gallery tabs use a flat fill without native elevation or shadows', async () => {
  const view = await render(<NovelDetailScreen {...props} />);
  await screen.findByText('Chapter 1');
  const contents = screen.getByRole('tab', { name: 'สารบัญ' });
  expect(contents.props.accessibilityState.selected).toBe(true);
  expect(StyleSheet.flatten(contents.props.style).elevation).toBeUndefined();
  expect(StyleSheet.flatten(contents.props.style).shadowColor).toBeUndefined();
  await fireEvent.press(screen.getByRole('tab', { name: 'ภาพและตัวละคร' }));
  const gallery = screen.getByRole('tab', { name: 'ภาพและตัวละคร' });
  expect(gallery.props.accessibilityState.selected).toBe(true);
  expect(StyleSheet.flatten(gallery.props.style).elevation).toBeUndefined();
  expect(StyleSheet.flatten(gallery.props.style).shadowColor).toBeUndefined();
  await view.unmount();
});

test('batch summary reports complete, partial and failed chapters accurately', async () => {
  jest.mocked(downloadChapterOnDemand).mockResolvedValueOnce({ status: 'complete' })
    .mockResolvedValueOnce({ status: 'text-only' }).mockResolvedValueOnce({ status: 'failed' });
  const view = await render(<NovelDetailScreen {...props} />);
  await screen.findByText('Chapter 1');
  await fireEvent.press(screen.getByLabelText('จัดการข้อมูลออฟไลน์'));
  await fireEvent.press(screen.getByLabelText('ดาวน์โหลดตอนที่ยังไม่ครบทั้งหมด'));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('ผลการดาวน์โหลด', 'ครบ 1 ตอน\nข้อความพร้อม รูปยังไม่ครบ 1 ตอน\nไม่สำเร็จ 1 ตอน'));
  expect(downloadChapterOnDemand).toHaveBeenCalledTimes(3);
  expect(screen.getByText('ข้อความพร้อม รูปยังไม่ครบ')).toBeTruthy();
  await view.unmount();
});

test('a pending single download prevents repeated taps, batch download and deletion', async () => {
  let resolve!: (result: { status: 'complete' }) => void;
  jest.mocked(downloadChapterOnDemand).mockReturnValueOnce(new Promise(done => { resolve = done; }));
  const view = await render(<NovelDetailScreen {...props} />);
  await screen.findByText('Chapter 1');
  const download = screen.getAllByLabelText('ดาวน์โหลดตอน')[0];
  await fireEvent.press(download);
  await fireEvent.press(download);
  expect(downloadChapterOnDemand).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByLabelText('จัดการข้อมูลออฟไลน์'));
  expect(screen.getByLabelText('ดาวน์โหลดตอนที่ยังไม่ครบทั้งหมด')).toBeDisabled();
  expect(screen.getByLabelText('ลบไฟล์ออฟไลน์ทั้งหมดของเรื่องนี้')).toBeDisabled();
  await act(async () => { resolve({ status: 'complete' }); });
  await view.unmount();
});

test('pull-to-refresh requests a fresh chapter list instead of only cached metadata', async () => {
  const view = await render(<NovelDetailScreen {...props} />);
  await screen.findByText('Chapter 1');
  await waitFor(() => expect(getAvailableChapterList).toHaveBeenCalledWith(novel.id, false));
  jest.mocked(getAvailableChapterList).mockClear();
  await fireEvent(screen.getByTestId('chapter-refresh'), 'refresh');
  await waitFor(() => expect(getAvailableChapterList).toHaveBeenCalledWith(novel.id, false));
  await view.unmount();
});

test('local chapters appear without waiting for online refresh or recursive storage statistics', async () => {
  jest.mocked(fetchNovels).mockImplementation(async localOnly => localOnly ? [novel] : new Promise(() => undefined));
  jest.mocked(getAvailableChapterList).mockImplementation(async (_id, localOnly) => localOnly
    ? chapters.map(chapter => ({ ...chapter, offlineStatus: 'complete' as const })) : new Promise(() => undefined));
  const view = await render(<NovelDetailScreen {...props} />);
  await screen.findByText('Chapter 3');
  await waitFor(() => expect(screen.queryAllByLabelText('ดาวน์โหลดตอน')).toHaveLength(0));
  expect(getNovelOfflineStats).not.toHaveBeenCalled();
  await view.unmount();
});


test('explicit update targets only readable chapters and locks competing actions', async () => {
  jest.mocked(getChapterOfflineStatus).mockImplementation(async (_novel, id) => id === 'ch-1' ? 'complete' : 'missing');
  let finish!: (result: { status: 'complete' }) => void;
  jest.mocked(downloadChapterOnDemand).mockImplementation(() => new Promise(done => { finish = done; }));
  const view = await render(<NovelDetailScreen {...props} />);
  await screen.findByText('Chapter 1');
  await fireEvent.press(screen.getByLabelText('จัดการข้อมูลออฟไลน์'));
  await fireEvent.press(screen.getByLabelText('อัปเดตตอนที่มีในเครื่อง'));
  expect(downloadChapterOnDemand).toHaveBeenCalledWith('novel', 'ch-1', true);
  expect(screen.getByLabelText('ลบไฟล์ออฟไลน์ทั้งหมดของเรื่องนี้')).toBeDisabled();
  await act(async () => { finish({ status: 'complete' }); });
  expect(downloadChapterOnDemand).toHaveBeenCalledTimes(1);
  await view.unmount();
});
