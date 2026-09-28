import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoadingView } from '../components/StateViews';
import { colors } from '../theme/theme';
import type { AuthStackParamList, AppStackParamList } from './types';

import RegisterScreen from '../screens/RegisterScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import LoginScreen from '../screens/LoginScreen';
import ServerSettingsScreen from '../screens/ServerSettingsScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import TaskSelectionScreen from '../screens/TaskSelectionScreen';
import HomeScreen from '../screens/HomeScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerShadowVisible: false,
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="Register" screenOptions={{ ...screenOptions, headerShown: false }}>
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="VerifyOtp" component={VerifyOtpScreen} options={{ headerShown: true, title: '' }} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="ServerSettings"
        component={ServerSettingsScreen}
        options={{ headerShown: true, title: 'Server settings' }}
      />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={screenOptions}>
      <AppStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <AppStack.Screen name="TaskSelection" component={TaskSelectionScreen} options={{ title: 'Edit tasks' }} />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { status } = useAuth();

  return (
    <NavigationContainer>
      {status === 'loading' && <LoadingView label="Starting up..." />}
      {status === 'signed-out' && <AuthNavigator />}
      {status === 'needs-profile' && <ProfileSetupScreen />}
      {status === 'needs-tasks' && <TaskSelectionScreen />}
      {status === 'ready' && <AppNavigator />}
    </NavigationContainer>
  );
}
