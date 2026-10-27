import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import App from '../App';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
jest.mock('@react-navigation/native', () => ({ NavigationContainer: ({ children }: React.PropsWithChildren) => children }));
jest.mock('@react-navigation/native-stack', () => ({ createNativeStackNavigator: () => ({
  Navigator: ({ children }: React.PropsWithChildren) => children,
  Screen: ({ component }: { component: () => React.ReactNode }) => component(),
}) }));
jest.mock('../src/screens/BookshelfScreen', () => ({ BookshelfScreen: () => require('react').createElement(require('react-native').Text, null, 'ชั้นหนังสือพร้อมใช้') }));
jest.mock('../src/screens/NovelDetailScreen', () => ({ NovelDetailScreen: () => null }));
jest.mock('../src/screens/ReaderScreen', () => ({ ReaderScreen: () => null }));

test.each([['loading', false, null], ['failed', false, new Error('Cannot load fonts')], ['ready', true, null]] as const)(
  'app content remains accessible when fonts are %s', async (_status, loaded, error) => {
    jest.mocked(useFonts).mockReturnValue([loaded, error]);
    const view = await render(<App />);
    expect(screen.getByText('ชั้นหนังสือพร้อมใช้')).toBeTruthy();
    await view.unmount();
  },
);
