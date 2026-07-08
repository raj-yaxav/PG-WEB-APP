/**
 * PG Manager - Root App Component
 */

import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const hideAndroidNavigationBar = async () => {
      try {
        await NavigationBar.setBehaviorAsync('overlay-swipe');
        await NavigationBar.setVisibilityAsync('hidden');
      } catch (error) {
        console.log('[NavigationBar] failed to apply immersive mode', error);
      }
    };

    hideAndroidNavigationBar();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        hideAndroidNavigationBar();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar hidden />
      <AppNavigator />
    </>
  );
}
