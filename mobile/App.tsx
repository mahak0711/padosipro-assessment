import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
