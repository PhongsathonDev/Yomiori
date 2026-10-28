import { themes } from '../src/theme/colors';

test('moon mode uses OLED black for the canvas and shared surfaces', () => {
  expect(themes.dark.background).toBe('#000000');
  expect(themes.dark.card).toBe('#000000');
  expect(themes.dark.dialogueBg).toBe('#000000');
  expect(themes.dark.statusBar).toBe('light');
  expect(themes.dark.text).toBe('#ece8e1');
  expect(themes.dark.narrationText).toBe('#d8d3cb');
});

test('light and sepia retain their existing paper backgrounds', () => {
  expect(themes.light.background).toBe('#faf8f5');
  expect(themes.light.card).toBe('#ffffff');
  expect(themes.sepia.background).toBe('#f4ecd8');
  expect(themes.sepia.card).toBe('#fdf8ec');
});
