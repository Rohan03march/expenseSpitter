import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { FirebaseProvider } from './src/context/FirebaseContext';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FirebaseProvider>
          <AppNavigator />
        </FirebaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
