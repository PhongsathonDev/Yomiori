import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BookshelfScreen } from '../src/screens/BookshelfScreen';
import { fetchNovels, getAvailableChapterList } from '../src/services/api';
import bundledNovels from '../src/data/novels.json';
import { Novel } from '../src/types';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-navigation-bar', () => ({ NavigationBar: () => null }));
jest.mock('lucide-react-native', () => Object.fromEntries(
  ['BookOpen', 'ChevronRight', 'Play', 'Sun', 'Moon', 'Coffee', 'X', 'Sparkles', 'User'].map(name => [name, () => null]),
));
jest.mock('../src/services/api', () => ({ fetchNovels: jest.fn(), fetchCharacters: async () => [], getAvailableChapterList: jest.fn(async () => []) }));
jest.mock('../src/services/storage', () => ({
  getSavedTheme: async () => 'light', saveTheme: jest.fn(), getReadingProgress: async () => null, isChapterDownloaded: async () => false,
}));

const navigation = { addListener: jest.fn(() => jest.fn()), navigate: jest.fn() };
const props = { navigation } as unknown as React.ComponentProps<typeof BookshelfScreen>;

test('bookshelf is usable even while catalog loading has not resolved', async () => {
  jest.mocked(fetchNovels).mockReturnValue(new Promise(() => undefined));
  const view = await render(<BookshelfScreen {...props} />);
  expect(screen.getByText('Yomiori')).toBeTruthy();
  expect(screen.getAllByText(bundledNovels[0].title)[0]).toBeTruthy();
  expect(screen.queryByText('กำลังโหลด...')).toBeNull();
  await view.unmount();
});

test('a recovered book with no catalog cover remains visible during a stalled refresh', async () => {
  const recovered: Novel = { id: 'remote-only', title: 'Recovered book', author: '', synopsis: '', coverUrl: '', tags: [], totalOriginalChapters: 99 };
  jest.mocked(fetchNovels).mockImplementation(async localOnly => localOnly ? [recovered] : new Promise(() => undefined));
  const view = await render(<BookshelfScreen {...props} />);
  expect((await screen.findAllByText('Recovered book')).length).toBeGreaterThan(0);
  expect(screen.getAllByLabelText('ไม่มีภาพปกในเครื่อง').length).toBeGreaterThan(0);
  await view.unmount();
});


test('shows the available chapter count and preserves titles containing Thai text', async () => {
  const novel: Novel = { id: 'remote-only', title: 'ผมเป็นนักอ่าน', author: '', synopsis: '', coverUrl: '', tags: [], totalOriginalChapters: 99 };
  jest.mocked(fetchNovels).mockResolvedValue([novel]);
  jest.mocked(getAvailableChapterList).mockResolvedValue([{ id: 'ch-01' }, { id: 'ch-02' }, { id: 'ch-03' }] as Awaited<ReturnType<typeof getAvailableChapterList>>);
  const view = await render(<BookshelfScreen {...props} />);
  expect(await screen.findByText('3 ตอน')).toBeTruthy();
  expect(screen.getAllByText('ผมเป็นนักอ่าน')).toHaveLength(2);
  expect(screen.queryByText('25 ตอน')).toBeNull();
  await view.unmount();
});
