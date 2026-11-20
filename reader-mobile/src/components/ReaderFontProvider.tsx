import React, { createContext, useContext } from 'react';
import { useFonts } from 'expo-font';

const FontContext = createContext<'loading' | 'ready' | 'error'>('loading');

// Import only the weights we use, rather than each font package's full index.
const fonts = {
  Sarabun_400Regular: require('@expo-google-fonts/sarabun/400Regular/Sarabun_400Regular.ttf'),
  Sarabun_600SemiBold: require('@expo-google-fonts/sarabun/600SemiBold/Sarabun_600SemiBold.ttf'),
  Sarabun_700Bold: require('@expo-google-fonts/sarabun/700Bold/Sarabun_700Bold.ttf'),
  Kanit_400Regular: require('@expo-google-fonts/kanit/400Regular/Kanit_400Regular.ttf'),
  Kanit_600SemiBold: require('@expo-google-fonts/kanit/600SemiBold/Kanit_600SemiBold.ttf'),
  Kanit_700Bold: require('@expo-google-fonts/kanit/700Bold/Kanit_700Bold.ttf'),
  Kanit_800ExtraBold: require('@expo-google-fonts/kanit/800ExtraBold/Kanit_800ExtraBold.ttf'),
  Prompt_300Light: require('@expo-google-fonts/prompt/300Light/Prompt_300Light.ttf'),
  Prompt_400Regular: require('@expo-google-fonts/prompt/400Regular/Prompt_400Regular.ttf'),
  Prompt_600SemiBold: require('@expo-google-fonts/prompt/600SemiBold/Prompt_600SemiBold.ttf'),
  NotoSerifThai_400Regular: require('@expo-google-fonts/noto-serif-thai/400Regular/NotoSerifThai_400Regular.ttf'),
  NotoSerifThai_600SemiBold: require('@expo-google-fonts/noto-serif-thai/600SemiBold/NotoSerifThai_600SemiBold.ttf'),
  NotoSerifThai_700Bold: require('@expo-google-fonts/noto-serif-thai/700Bold/NotoSerifThai_700Bold.ttf'),
};

export function ReaderFontProvider({ children }: React.PropsWithChildren) {
  const [loaded, error] = useFonts(fonts);
  // Fonts are enhancement work, never a gate in front of the app's content.
  return <FontContext.Provider value={loaded ? 'ready' : error ? 'error' : 'loading'}>{children}</FontContext.Provider>;
}

export const useReaderFonts = () => useContext(FontContext);
