import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ReaderFontProvider } from './src/components/ReaderFontProvider';

import { BookshelfScreen } from './src/screens/BookshelfScreen';
import { DesignLabScreen } from './src/screens/DesignLabScreen';
import { NovelDetailScreen } from './src/screens/NovelDetailScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <ReaderFontProvider>
      <NavigationContainer>
        <Stack.Navigator
          // Development-only design exploration; production builds keep the reader.
          initialRouteName={__DEV__ ? 'DesignLab' : 'Bookshelf'}
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="DesignLab" component={DesignLabScreen} />
          <Stack.Screen name="Bookshelf" component={BookshelfScreen} />
          <Stack.Screen name="NovelDetail" component={NovelDetailScreen} />
          <Stack.Screen name="Reader" component={ReaderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ReaderFontProvider>
  );
}

