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
  Prompt_400Regular: require('@expo-google-fonts/prompt/400Regular/Prompt_400Regular.ttf'),
  Prompt_600SemiBold: require('@expo-google-fonts/prompt/600SemiBold/Prompt_600SemiBold.ttf'),
};

export function ReaderFontProvider({ children }: React.PropsWithChildren) {
  const [loaded, error] = useFonts(fonts);
  // Fonts are enhancement work, never a gate in front of the app's content.
  return <FontContext.Provider value={loaded ? 'ready' : error ? 'error' : 'loading'}>{children}</FontContext.Provider>;
}

export const useReaderFonts = () => useContext(FontContext);
