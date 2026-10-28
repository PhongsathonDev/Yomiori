import { ReaderTheme } from '../types';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryBg: string;
  accent: string;
  border: string;
  narrationText: string;
  dialogueBg: string;
  dialogueBorder: string;
  progressBar: string;
  progressTrack: string;
  statusBar: 'light' | 'dark';
}

export const themes: Record<ReaderTheme, ThemeColors> = {
  light: {
    background: '#faf8f5',
    card: '#ffffff',
    cardBorder: 'rgba(214, 203, 190, 0.45)',
    text: '#2d2824',
    textMuted: '#7c746d',
    primary: '#b84a5f',
    primaryBg: 'rgba(184, 74, 95, 0.08)',
    accent: '#d97706',
    border: '#ebe4dc',
    narrationText: '#38322e',
    dialogueBg: '#ffffff',
    dialogueBorder: '#e4ddd4',
    progressBar: '#b84a5f',
    progressTrack: 'rgba(184, 74, 95, 0.15)',
    statusBar: 'dark',
  },
  dark: {
    background: '#121214',
    card: '#1b1b1e',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    text: '#ece8e1',
    textMuted: '#9e968f',
    primary: '#e26d83',
    primaryBg: 'rgba(226, 109, 131, 0.12)',
    accent: '#f59e0b',
    border: '#2a2a2e',
    narrationText: '#d8d3cb',
    dialogueBg: '#1f1f23',
    dialogueBorder: 'rgba(255, 255, 255, 0.09)',
    progressBar: '#e26d83',
    progressTrack: 'rgba(255, 255, 255, 0.1)',
    statusBar: 'light',
  },
  sepia: {
    background: '#f4ecd8',
    card: '#fdf8ec',
    cardBorder: 'rgba(200, 185, 155, 0.5)',
    text: '#433422',
    textMuted: '#8a7761',
    primary: '#9e432a',
    primaryBg: 'rgba(158, 67, 42, 0.1)',
    accent: '#c05621',
    border: '#e4d8bf',
    narrationText: '#483925',
    dialogueBg: '#faf3e0',
    dialogueBorder: '#dfd2b5',
    progressBar: '#9e432a',
    progressTrack: 'rgba(158, 67, 42, 0.15)',
    statusBar: 'dark',
  },
};
