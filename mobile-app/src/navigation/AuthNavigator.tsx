import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LoginScreen } from '../screens/LoginScreen';

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
}

export function AuthNavigator({ onAuthSuccess }: AuthNavigatorProps) {
  return (
    <View style={styles.container}>
      <LoginScreen onLoginSuccess={onAuthSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
