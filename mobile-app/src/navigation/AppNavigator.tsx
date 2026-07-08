/**
 * PG Manager — App Navigator
 * Switches between Auth and Main App
 */

import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { HomeScreen } from '../components/dashboard/HomeScreen';
import { AuthService } from '../services/authService';
import { Colors } from '../constants/colors';
import type { User } from '../types/auth.types';

export function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const authenticated = await AuthService.isAuthenticated();
      if (!authenticated) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const refreshedUser = await AuthService.refreshUserFromServer();
      setIsAuthenticated(Boolean(refreshedUser));
      setUser(refreshedUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      await AuthService.logout();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAuthSuccess() {
    const storedUser = await AuthService.getUser();
    setUser(storedUser);
    setIsAuthenticated(true);
  }

  const handleUserUpdate = useCallback((nextUser: User) => {
    setUser((currentUser) => {
      const mergedUser = currentUser
        ? {
            ...currentUser,
            ...nextUser,
            id: nextUser.id || currentUser.id,
            role: nextUser.role || currentUser.role,
            status: nextUser.status || currentUser.status,
          }
        : nextUser;

      AuthService.updateUser(mergedUser).catch((error) => {
        console.error('Failed to persist updated user:', error);
      });

      return mergedUser;
    });
  }, []);

  async function handleLogout() {
    await AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator onAuthSuccess={handleAuthSuccess} />;
  }

  return <HomeScreen user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
