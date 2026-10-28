import { ReaderTheme } from '../types';

/**
 * Shared Yomiori palette.
 *
 * These values mirror `reader-web/src/index.css` one-for-one: unbleached washi
 * paper, sumi charcoal and warm hinoki. Keeping both apps on the same tokens is
 * what makes a chapter feel like the same book whether it is opened in the
 * browser or on a phone.
 */
export interface ThemeColors {
  /** App canvas: the paper the content sits on. */
  background: string;
  /** Quietly raised paper, used for inputs and inset areas. */
  backgroundElevated: string;
  /** Cards, sheets and other surfaces. */
  card: string;
  /** Pressed / hovered surface. */
  cardHover: string;
  /** Hairline that separates a surface from the canvas. */
  cardBorder: string;
  /** Hairline used for dividers inside a surface. */
  border: string;
  /** Stronger hairline for interactive outlines. */
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primaryBg: string;
  primaryGlow: string;
  onPrimary: string;
  /** Secondary warm tone (wood / cedar), used for supporting accents. */
  accent: string;
  narrationText: string;
  dialogueText: string;
  dialogueBg: string;
  dialogueBorder: string;
  progressBar: string;
  progressTrack: string;
  scrim: string;
  danger: string;
  success: string;
  statusBar: 'light' | 'dark';
}

export const themes: Record<ReaderTheme, ThemeColors> = {
  // Theme 1: Light Muji (unbleached washi and light wood)
  light: {
    background: '#f7f5f0',
    backgroundElevated: '#faf8f5',
    card: '#ffffff',
    cardHover: '#f0ece3',
    cardBorder: '#eae5dc',
    border: '#eae5dc',
    borderStrong: '#ded6cb',
    text: '#2b2825',
    textMuted: '#686259',
    textFaint: '#9b9487',
    primary: '#b84a39',
    primaryBg: '#fbeee8',
    primaryGlow: 'rgba(184, 74, 57, 0.1)',
    onPrimary: '#ffffff',
    accent: '#a16c3b',
    narrationText: '#36322e',
    dialogueText: '#1d1b19',
    dialogueBg: '#ffffff',
    dialogueBorder: '#ded6cb',
    progressBar: '#b84a39',
    progressTrack: 'rgba(184, 74, 57, 0.14)',
    scrim: 'rgba(24, 24, 22, 0.45)',
    danger: '#a83a2c',
    success: '#4a7c59',
    statusBar: 'dark',
  },
  // Theme 2: Dark Sumi (charcoal ash and natural slate)
  dark: {
    background: '#181816',
    backgroundElevated: '#22221f',
    card: '#22221f',
    cardHover: '#2a2a26',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.14)',
    text: '#ede9e3',
    textMuted: '#a6a096',
    textFaint: '#736d64',
    primary: '#d46957',
    primaryBg: 'rgba(212, 105, 87, 0.12)',
    primaryGlow: 'rgba(212, 105, 87, 0.15)',
    onPrimary: '#ffffff',
    accent: '#d8a25f',
    narrationText: '#dbd6cb',
    dialogueText: '#ffffff',
    dialogueBg: '#22221f',
    dialogueBorder: 'rgba(255, 255, 255, 0.1)',
    progressBar: '#d46957',
    progressTrack: 'rgba(255, 255, 255, 0.1)',
    scrim: 'rgba(12, 12, 11, 0.62)',
    danger: '#e0705f',
    success: '#7fae8c',
    statusBar: 'light',
  },
  // Theme 3: Warm Hinoki (muted cedar and herbal tea paper)
  sepia: {
    background: '#f2ede2',
    backgroundElevated: '#eae3d5',
    card: '#eae3d5',
    cardHover: '#d5ccba',
    cardBorder: 'rgba(100, 80, 60, 0.1)',
    border: 'rgba(100, 80, 60, 0.1)',
    borderStrong: 'rgba(100, 80, 60, 0.18)',
    text: '#2b2219',
    textMuted: '#645444',
    textFaint: '#8f7f6f',
    primary: '#a16c3b',
    primaryBg: '#f7eedf',
    primaryGlow: 'rgba(161, 108, 59, 0.12)',
    onPrimary: '#ffffff',
    accent: '#8a5a3b',
    narrationText: '#382d22',
    dialogueText: '#1d160f',
    dialogueBg: '#eae3d5',
    dialogueBorder: 'rgba(100, 80, 60, 0.16)',
    progressBar: '#a16c3b',
    progressTrack: 'rgba(161, 108, 59, 0.16)',
    scrim: 'rgba(43, 34, 25, 0.45)',
    danger: '#9c3d2a',
    success: '#4f7350',
    statusBar: 'dark',
  },
};
