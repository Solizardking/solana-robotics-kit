/**
 * Solana Robotics Mobile App
 * The first Solana Mobile dApp for controlling AI robots
 */

import './src/polyfills';
import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import WalletScreen from './src/screens/WalletScreen';
import RobotControlScreen from './src/screens/RobotControlScreen';
import RobotDiscoveryScreen from './src/screens/RobotDiscoveryScreen';
import TasksScreen from './src/screens/TasksScreen';
import VibeToEarnScreen from './src/screens/VibeToEarnScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Hooks and Store
import { useStore, useApp } from './src/hooks/useStore';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// =============================================================================
// NAVIGATION TYPES
// =============================================================================

export type RootStackParamList = {
  Home: undefined;
  Wallet: undefined;
  RobotControl: { robotId: string };
  RobotDiscovery: undefined;
  Tasks: undefined;
  VibeToEarn: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// =============================================================================
// THEME
// =============================================================================

const theme = {
  dark: true,
  colors: {
    primary: '#9945FF',     // Solana Purple
    secondary: '#14F195',   // Solana Green
    background: '#0D1117',
    card: '#161B22',
    text: '#FFFFFF',
    textSecondary: '#8B949E',
    border: '#30363D',
    notification: '#EF4444',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
  },
};

// =============================================================================
// NAVIGATION OPTIONS
// =============================================================================

const screenOptions = {
  headerStyle: {
    backgroundColor: theme.colors.card,
  },
  headerTintColor: theme.colors.text,
  headerTitleStyle: {
    fontWeight: 'bold' as const,
  },
  contentStyle: {
    backgroundColor: theme.colors.background,
  },
};

// =============================================================================
// APP COMPONENT
// =============================================================================

export default function App() {
  const { isLoading } = useApp();
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load resources, make API calls, etc.
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: theme.colors.primary,
              background: theme.colors.background,
              card: theme.colors.card,
              text: theme.colors.text,
              border: theme.colors.border,
              notification: theme.colors.notification,
            },
          }}
        >
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={screenOptions}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Solana Robotics' }}
            />
            <Stack.Screen
              name="Wallet"
              component={WalletScreen}
              options={{ title: 'Wallet' }}
            />
            <Stack.Screen
              name="RobotDiscovery"
              component={RobotDiscoveryScreen}
              options={{ title: 'Discover Robots' }}
            />
            <Stack.Screen
              name="RobotControl"
              component={RobotControlScreen}
              options={{ title: 'Robot Control' }}
            />
            <Stack.Screen
              name="Tasks"
              component={TasksScreen}
              options={{ title: 'Task Marketplace' }}
            />
            <Stack.Screen
              name="VibeToEarn"
              component={VibeToEarnScreen}
              options={{ title: 'Vibe to Earn' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
