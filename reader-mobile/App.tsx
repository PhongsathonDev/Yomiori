import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import {
  Sarabun_400Regular,
  Sarabun_600SemiBold,
  Sarabun_700Bold,
} from '@expo-google-fonts/sarabun';
import {
  Kanit_400Regular,
  Kanit_600SemiBold,
} from '@expo-google-fonts/kanit';
import {
  Prompt_400Regular,
  Prompt_600SemiBold,
} from '@expo-google-fonts/prompt';

import { BookshelfScreen } from './src/screens/BookshelfScreen';
import { NovelDetailScreen } from './src/screens/NovelDetailScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    Sarabun_400Regular,
    Sarabun_600SemiBold,
    Sarabun_700Bold,
    Kanit_400Regular,
    Kanit_600SemiBold,
    Prompt_400Regular,
    Prompt_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Bookshelf"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Bookshelf" component={BookshelfScreen} />
        <Stack.Screen name="NovelDetail" component={NovelDetailScreen} />
        <Stack.Screen name="Reader" component={ReaderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

