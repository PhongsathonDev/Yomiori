import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DesignLabScreen } from '../src/screens/DesignLabScreen';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('lucide-react-native', () => Object.fromEntries(
  [
    'ArrowDownUp', 'ArrowLeft', 'Check', 'ChevronRight', 'Coffee', 'Download', 'List', 'Moon',
    'Play', 'Search', 'Settings2', 'SlidersHorizontal', 'Sparkles', 'Sun', 'Type', 'X',
  ].map(name => [name, () => null]),
));

const props = {
  navigation: { replace: jest.fn(), navigate: jest.fn() },
} as unknown as React.ComponentProps<typeof DesignLabScreen>;

test.each([
  ['โปร่ง', 'เรื่องทั้งหมด'],
  ['กริด', 'รายการหนังสือ'],
  ['นุ่ม', 'คืนนี้จะอ่านอะไรดี'],
  ['วะชิ', 'ชั้นหนังสือของฉัน'],
  ['ซีน', 'YOMIORI'],
  ['ราตรี', 'คืนนี้มีตอนใหม่'],
])('renders the %s direction and its shelf', async (direction, shelfText) => {
  await render(<DesignLabScreen {...props} />);
  await fireEvent.press(screen.getByText(direction));
  expect(screen.getByText(shelfText)).toBeTruthy();
});

test('opens detail and reader previews for every direction', async () => {
  await render(<DesignLabScreen {...props} />);
  await fireEvent.press(screen.getByText('รายละเอียด'));
  expect(screen.getAllByText('เรื่องย่อ').length).toBeGreaterThan(0);
  await fireEvent.press(screen.getByText('อ่าน'));
  expect(screen.getAllByText('วันที่ทุกอย่างเริ่มต้น').length).toBeGreaterThan(0);
});
