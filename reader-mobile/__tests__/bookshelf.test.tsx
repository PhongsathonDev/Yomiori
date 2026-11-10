import React from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { BookshelfScreen } from '../src/screens/BookshelfScreen';
import { fetchNovels, getAvailableChapterList } from '../src/services/api';
import { getReadingProgress } from '../src/services/storage';
import { saveShelfStatus, saveShelfSort, getShelfStatuses } from '../src/services/bookshelf';
import bundledNovels from '../src/data/novels.json';
import { Novel, ReadingProgress } from '../src/types';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-navigation-bar', () => ({ NavigationBar: () => null }));
jest.mock('react-native/Libraries/Components/RefreshControl/RefreshControl', () => {
  const React = require('react');
  return { __esModule: true, default: function RefreshControl(props: object) { return React.createElement('RCTRefreshControl', props); } };
});
jest.mock('lucide-react-native', () => Object.fromEntries(
  ['BookOpen', 'Play', 'Sun', 'Moon', 'Coffee', 'Search', 'X', 'MoreHorizontal', 'ArrowDownUp', 'Check', 'ArchiveRestore'].map(name => [name, () => null]),
));
jest.mock('../src/services/api', () => ({ fetchNovels: jest.fn(), getAvailableChapterList: jest.fn() }));
jest.mock('../src/services/storage', () => ({ getSavedTheme: async () => 'light', saveTheme: jest.fn(), getReadingProgress: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const storageDefaults = { multiGet: jest.mocked(AsyncStorage.multiGet).getMockImplementation()!, setItem: jest.mocked(AsyncStorage.setItem).getMockImplementation()! };
const bookOrder = () => screen.getAllByRole('button', { name: /^รายละเอียด / }).map(item => item.props.accessibilityLabel);

const a: Novel = { id: 'a', title: 'ผมเป็นนักอ่าน', originalTitle: 'Original A', author: 'Alice', coverUrl: '', synopsis: 'Long synopsis', tags: ['รัก'], totalOriginalChapters: 99 };
const b: Novel = { ...a, id: 'b', title: 'เรื่องที่สอง', originalTitle: 'Original B', author: 'Bob', tags: ['แฟนตาซี'] };
const navigation = { addListener: jest.fn((_event: string, _callback: () => void) => jest.fn()), navigate: jest.fn() };
const props = { navigation } as unknown as React.ComponentProps<typeof BookshelfScreen>;
const history = (id: string, updatedAt = 1): ReadingProgress => ({ novelId: id, chapterId: 'ch-02', scrollPercent: 56, updatedAt });
const pending = <T,>() => new Promise<T>(() => undefined);

beforeEach(async () => {
  jest.restoreAllMocks(); jest.clearAllMocks();
  jest.mocked(AsyncStorage.multiGet).mockImplementation(storageDefaults.multiGet);
  jest.mocked(AsyncStorage.setItem).mockImplementation(storageDefaults.setItem);
  await AsyncStorage.clear();
  jest.mocked(fetchNovels).mockResolvedValue([a, b]);
  jest.mocked(getReadingProgress).mockResolvedValue(null);
  jest.mocked(getAvailableChapterList).mockImplementation(async id => [1, 2, 3].map(n => ({ novelId: id, id: `ch-0${n}`, chapterNumber: n, title: `ตอน ${n}` })));
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

test('usable during stalled catalog loading without a fabricated continue card', async () => {
  jest.mocked(fetchNovels).mockImplementation(() => pending());
  const view = await render(<BookshelfScreen {...props} />);
  expect(screen.getByText('Yomiori')).toBeTruthy();
  expect(await screen.findByText(bundledNovels[0].title)).toBeTruthy();
  expect(screen.queryByText('อ่านต่อ')).toBeNull();
  await view.unmount();
});

test('recovered book with missing cover remains usable during stalled remote refresh', async () => {
  const recovered = { ...a, id: 'remote-only', title: 'Recovered book' };
  jest.mocked(fetchNovels).mockImplementation(async localOnly => localOnly ? [recovered] : pending());
  const view = await render(<BookshelfScreen {...props} />);
  expect(await screen.findByText('Recovered book')).toBeTruthy();
  expect(screen.getByLabelText('ไม่มีภาพปกในเครื่อง')).toBeTruthy();
  await view.unmount();
});

test('compact two-column grid shows Thai titles and actual counts, and opens details', async () => {
  const view = await render(<BookshelfScreen {...props} />);
  await screen.findByText(a.title);
  await waitFor(() => expect(screen.getAllByText('3 ตอน')).toHaveLength(2));
  expect(screen.queryByText('99 ตอน')).toBeNull();
  expect(screen.queryByText(a.synopsis)).toBeNull();
  await fireEvent.press(screen.getByLabelText(`รายละเอียด ${a.title}`));
  expect(navigation.navigate).toHaveBeenCalledWith('NovelDetail', { novelId: a.id });
  await view.unmount();
});

test('complete, remount, read again and restore without losing resume position', async () => {
  jest.mocked(getReadingProgress).mockImplementation(async id => id === 'a' ? history('a') : null);
  let view = await render(<BookshelfScreen {...props} />);
  await screen.findByLabelText(`อ่านต่อ ${a.title}`);
  await fireEvent.press(screen.getByLabelText(`จัดการ ${a.title}`));
  await fireEvent.press(screen.getByRole('button', { name: 'ทำเครื่องหมายว่าอ่านจบแล้ว' }));
  await waitFor(() => expect(screen.queryByLabelText(`รายละเอียด ${a.title}`)).toBeNull());
  expect(screen.queryByText('อ่านต่อ')).toBeNull();
  expect(await getShelfStatuses(['a'])).toEqual({ a: 'completed' });
  await view.unmount();
  view = await render(<BookshelfScreen {...props} />);
  await screen.findByText(b.title);
  expect(screen.queryByLabelText(`รายละเอียด ${a.title}`)).toBeNull();
  await fireEvent.press(screen.getByRole('tab', { name: /อ่านจบแล้ว/ }));
  await fireEvent.press(await screen.findByLabelText(`รายละเอียด ${a.title}`));
  expect(navigation.navigate).toHaveBeenCalledWith('NovelDetail', { novelId: a.id });
  expect(await getShelfStatuses(['a'])).toEqual({ a: 'completed' });
  await fireEvent.press(screen.getByLabelText(`จัดการ ${a.title}`));
  await fireEvent.press(screen.getByRole('button', { name: 'ย้ายกลับชั้นหนังสือ' }));
  await waitFor(() => expect(screen.queryByLabelText(`รายละเอียด ${a.title}`)).toBeNull());
  await fireEvent.press(screen.getByRole('tab', { name: /ชั้นหนังสือ/ }));
  await fireEvent.press(await screen.findByLabelText(`อ่านต่อ ${a.title}`));
  expect(navigation.navigate).toHaveBeenCalledWith('Reader', { novelId: 'a', chapterId: 'ch-02' });
  await view.unmount();
});

test('failed status write keeps book and continue card and allows retry', async () => {
  jest.mocked(getReadingProgress).mockImplementation(async id => id === 'a' ? history('a') : null);
  const view = await render(<BookshelfScreen {...props} />);
  await screen.findByLabelText(`อ่านต่อ ${a.title}`);
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk'));
  await fireEvent.press(screen.getByLabelText(`จัดการ ${a.title}`));
  await fireEvent.press(screen.getByRole('button', { name: 'ทำเครื่องหมายว่าอ่านจบแล้ว' }));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('บันทึกสถานะไม่ได้', expect.any(String)));
  expect(screen.getByLabelText(`รายละเอียด ${a.title}`)).toBeTruthy();
  expect(screen.getByLabelText(`อ่านต่อ ${a.title}`)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'ทำเครื่องหมายว่าอ่านจบแล้ว' }));
  await waitFor(() => expect(screen.queryByLabelText(`รายละเอียด ${a.title}`)).toBeNull());
  await view.unmount();
});

test('search combines with tabs and tags; clearing filters restores books', async () => {
  await saveShelfStatus('b', 'completed');
  const view = await render(<BookshelfScreen {...props} />);
  await screen.findByText(a.title);
  await fireEvent.changeText(screen.getByLabelText('ค้นหานิยาย'), ' ORIGINAL B ');
  expect(screen.getByText('ไม่พบเรื่องที่ตรงกับตัวกรอง')).toBeTruthy();
  await fireEvent.press(screen.getByRole('tab', { name: /ทั้งหมด/ }));
  expect(screen.getByLabelText(`รายละเอียด ${b.title}`)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'รัก' }));
  expect(screen.queryByLabelText(`รายละเอียด ${b.title}`)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'ล้างตัวกรอง' }));
  expect(screen.getByLabelText(`รายละเอียด ${a.title}`)).toBeTruthy();
  expect(screen.getByLabelText(`รายละเอียด ${b.title}`)).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('ค้นหานิยาย'), 'Alice');
  expect(screen.getByLabelText(`รายละเอียด ${a.title}`)).toBeTruthy();
  expect(screen.queryByLabelText(`รายละเอียด ${b.title}`)).toBeNull();
  await view.unmount();
});

test('all-completed shelf has an empty state and a path back to old books', async () => {
  await saveShelfStatus('a', 'completed'); await saveShelfStatus('b', 'completed');
  const view = await render(<BookshelfScreen {...props} />);
  await screen.findByText('อ่านจบทุกเรื่องแล้ว เลือกดูเรื่องเก่าได้ที่แท็บอ่านจบแล้ว');
  expect(screen.queryByText('อ่านต่อ')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'ดูเรื่องที่อ่านจบแล้ว' }));
  expect(screen.getByLabelText(`รายละเอียด ${a.title}`)).toBeTruthy();
  await view.unmount();
});

test('sort persists across remount, and focus reloads newer progress', async () => {
  jest.mocked(getReadingProgress).mockImplementation(async id => history(id, id === 'b' ? 2 : 1));
  const view = await render(<BookshelfScreen {...props} />);
  await screen.findByLabelText(`อ่านต่อ ${b.title}`);
  expect(bookOrder()).toEqual([`รายละเอียด ${b.title}`, `รายละเอียด ${a.title}`]);
  await fireEvent.press(screen.getByLabelText('เลือกการเรียงเรื่อง'));
  await fireEvent.press(screen.getByRole('radio', { name: 'ชื่อเรื่อง' }));
  await waitFor(() => expect(bookOrder()).toEqual([`รายละเอียด ${a.title}`, `รายละเอียด ${b.title}`]));
  jest.mocked(getReadingProgress).mockImplementation(async id => history(id, id === 'a' ? 3 : 2));
  await act(async () => { navigation.addListener.mock.calls.at(-1)![1](); });
  await screen.findByLabelText(`อ่านต่อ ${a.title}`);
  await view.unmount();
  const next = await render(<BookshelfScreen {...props} />);
  await screen.findByLabelText(`อ่านต่อ ${a.title}`);
  expect(bookOrder()).toEqual([`รายละเอียด ${a.title}`, `รายละเอียด ${b.title}`]);
  await next.unmount();
});

test('state read failure hides archived books until retry recovers', async () => {
  await saveShelfStatus('a', 'completed');
  jest.spyOn(AsyncStorage, 'multiGet').mockRejectedValue(new Error('disk'));
  const view = await render(<BookshelfScreen {...props} />);
  await screen.findByText('โหลดสถานะชั้นหนังสือไม่ได้');
  expect(screen.queryByLabelText(`รายละเอียด ${a.title}`)).toBeNull();
  jest.mocked(AsyncStorage.multiGet).mockImplementation(storageDefaults.multiGet);
  await fireEvent.press(screen.getByRole('button', { name: 'ลองอีกครั้ง' }));
  await screen.findByText(b.title);
  expect(screen.queryByLabelText(`รายละเอียด ${a.title}`)).toBeNull();
  await view.unmount();
});

test('stored sort loads without any reading history', async () => {
  await saveShelfSort('title');
  const view = await render(<BookshelfScreen {...props} />);
  await screen.findByText(a.title);
  expect(screen.getByText('ชื่อเรื่อง')).toBeTruthy();
  expect(screen.queryByText('อ่านต่อ')).toBeNull();
  await view.unmount();
});

test('failed sort write keeps the previous order and supports retry', async () => {
  jest.mocked(getReadingProgress).mockImplementation(async id => history(id, id === 'b' ? 2 : 1));
  const view = await render(<BookshelfScreen {...props} />);
  await screen.findByLabelText(`อ่านต่อ ${b.title}`);
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk'));
  await fireEvent.press(screen.getByLabelText('เลือกการเรียงเรื่อง'));
  await fireEvent.press(screen.getByRole('radio', { name: 'ชื่อเรื่อง' }));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('บันทึกการเรียงไม่ได้', expect.any(String)));
  expect(bookOrder()).toEqual([`รายละเอียด ${b.title}`, `รายละเอียด ${a.title}`]);
  await fireEvent.press(screen.getByRole('radio', { name: 'ชื่อเรื่อง' }));
  await waitFor(() => expect(bookOrder()).toEqual([`รายละเอียด ${a.title}`, `รายละเอียด ${b.title}`]));
  await view.unmount();
});

test('a personal-state refresh started before a completion write cannot undo the visible result', async () => {
  const view = await render(<BookshelfScreen {...props} />);
  await screen.findByText(a.title);
  let resolveReads!: () => void;
  const readGate = new Promise<void>(resolve => { resolveReads = resolve; });
  jest.mocked(AsyncStorage.multiGet).mockImplementation(async (keys, callback) => {
    const snapshot = await storageDefaults.multiGet(keys, callback);
    await readGate;
    return snapshot;
  });
  await act(async () => { navigation.addListener.mock.calls.at(-1)![1](); });
  await fireEvent.press(screen.getByLabelText(`จัดการ ${a.title}`));
  await fireEvent.press(screen.getByRole('button', { name: 'ทำเครื่องหมายว่าอ่านจบแล้ว' }));
  await waitFor(() => expect(screen.queryByLabelText(`รายละเอียด ${a.title}`)).toBeNull());
  await act(async () => { resolveReads(); });
  expect(screen.queryByLabelText(`รายละเอียด ${a.title}`)).toBeNull();
  await fireEvent.press(screen.getByRole('tab', { name: /อ่านจบแล้ว/ }));
  expect(screen.getByLabelText(`รายละเอียด ${a.title}`)).toBeTruthy();
  await view.unmount();
});
