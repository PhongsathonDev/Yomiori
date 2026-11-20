export type DesignConcept = 'washi' | 'zine' | 'nocturne';
export type LabMode = 'light' | 'dark';
export type LabScreen = 'shelf' | 'detail' | 'reader';

export interface LabPalette {
  id: DesignConcept;
  mode: LabMode;
  isDark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  secondary: string;
  secondaryInk: string;
  tagBg: string;
  line: string;
  border: string;
  overlay: string;
  shadow: string;
  gold: string;
}

const washiLight: LabPalette = {
  id: 'washi',
  mode: 'light',
  isDark: false,
  bg: '#F2ECDF',
  surface: '#FAF6EC',
  surfaceAlt: '#E9E1D1',
  text: '#211D17',
  muted: '#6A6154',
  accent: '#A63A2B',
  accentInk: '#FFF8ED',
  accentSoft: 'rgba(166, 58, 43, 0.08)',
  secondary: '#2F4A5E',
  secondaryInk: '#F4F7F8',
  tagBg: '#E9E1D1',
  line: '#D6C9B4',
  border: '#DED3C0',
  overlay: 'rgba(14, 11, 7, 0.55)',
  shadow: '#2B241B',
  gold: '#A63A2B',
};

const washiDark: LabPalette = {
  id: 'washi',
  mode: 'dark',
  isDark: true,
  bg: '#141210',
  surface: '#1D1A16',
  surfaceAlt: '#262119',
  text: '#F0E7D8',
  muted: '#A99D8A',
  accent: '#E38A72',
  accentInk: '#1A130E',
  accentSoft: 'rgba(227, 138, 114, 0.14)',
  secondary: '#91A9B8',
  secondaryInk: '#101820',
  tagBg: '#29241D',
  line: '#34302A',
  border: '#3A342B',
  overlay: 'rgba(0, 0, 0, 0.65)',
  shadow: '#000000',
  gold: '#E38A72',
};

const zineLight: LabPalette = {
  id: 'zine',
  mode: 'light',
  isDark: false,
  bg: '#FFF3DC',
  surface: '#FFFFFF',
  surfaceAlt: '#FFE3A8',
  text: '#0F0F0F',
  muted: '#5C5346',
  accent: '#FF4A2A',
  accentInk: '#101010',
  accentSoft: '#FFD9CF',
  secondary: '#2B4EFF',
  secondaryInk: '#FFFFFF',
  tagBg: '#D7FF3F',
  line: '#111111',
  border: '#111111',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#111111',
  gold: '#D7FF3F',
};

const zineDark: LabPalette = {
  id: 'zine',
  mode: 'dark',
  isDark: true,
  bg: '#0B0B0B',
  surface: '#161616',
  surfaceAlt: '#222222',
  text: '#FFF3DC',
  muted: '#A89E8F',
  accent: '#FF5A3A',
  accentInk: '#0B0B0B',
  accentSoft: '#3A1710',
  secondary: '#6E87FF',
  secondaryInk: '#0B0B0B',
  tagBg: '#D7FF3F',
  line: '#F2E8D5',
  border: '#F2E8D5',
  overlay: 'rgba(0, 0, 0, 0.65)',
  shadow: '#FF4A2A',
  gold: '#D7FF3F',
};

const nocturneLight: LabPalette = {
  id: 'nocturne',
  mode: 'light',
  isDark: false,
  bg: '#EEF1F5',
  surface: '#FFFFFF',
  surfaceAlt: '#E2E7EF',
  text: '#111A2A',
  muted: '#58657A',
  accent: '#8A5A12',
  accentInk: '#FFFFFF',
  accentSoft: '#F3E3C3',
  secondary: '#3E6285',
  secondaryInk: '#FFFFFF',
  tagBg: '#E2E7EF',
  line: '#C9D2DF',
  border: '#D5DDE8',
  overlay: 'rgba(7, 11, 19, 0.55)',
  shadow: '#0B1220',
  gold: '#B8872B',
};

const nocturneDark: LabPalette = {
  id: 'nocturne',
  mode: 'dark',
  isDark: true,
  bg: '#070A11',
  surface: '#0F1520',
  surfaceAlt: '#151D2B',
  text: '#F4EFE4',
  muted: '#9BA6B7',
  accent: '#D9A441',
  accentInk: '#171106',
  accentSoft: '#2A2010',
  secondary: '#8FA7C9',
  secondaryInk: '#0B1220',
  tagBg: '#151D2B',
  line: '#253044',
  border: '#202A3B',
  overlay: 'rgba(2, 4, 9, 0.55)',
  shadow: '#000000',
  gold: '#D9A441',
};

export const PALETTES: Record<DesignConcept, Record<LabMode, LabPalette>> = {
  washi: { light: washiLight, dark: washiDark },
  zine: { light: zineLight, dark: zineDark },
  nocturne: { light: nocturneLight, dark: nocturneDark },
};

export const FONT = {
  serif: 'NotoSerifThai_400Regular',
  serifSemi: 'NotoSerifThai_600SemiBold',
  serifBold: 'NotoSerifThai_700Bold',
  ui: 'Sarabun_400Regular',
  uiSemi: 'Sarabun_600SemiBold',
  uiBold: 'Sarabun_700Bold',
  display: 'Kanit_700Bold',
  displayHeavy: 'Kanit_800ExtraBold',
  modern: 'Prompt_400Regular',
  modernLight: 'Prompt_300Light',
  modernSemi: 'Prompt_600SemiBold',
} as const;

export const CONCEPTS: {
  id: DesignConcept;
  name: string;
  english: string;
  tagline: string;
  swatches: string[];
}[] = [
  {
    id: 'washi',
    name: 'วะชิ',
    english: 'Washi',
    tagline: 'กระดาษ หมึก ตราประทับ',
    swatches: ['#F2ECDF', '#211D17', '#A63A2B'],
  },
  {
    id: 'zine',
    name: 'ซีน',
    english: 'Zine',
    tagline: 'มังงะ ป็อป กราฟิกหนัก',
    swatches: ['#FFF3DC', '#111111', '#FF4A2A'],
  },
  {
    id: 'nocturne',
    name: 'ราตรี',
    english: 'Nocturne',
    tagline: 'ภาพยนตร์ กลางคืน ทองคำ',
    swatches: ['#070A11', '#F4EFE4', '#D9A441'],
  },
];
