import { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AuthService } from '../../core/services/authService';

export function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!phone || !password) {
      Alert.alert('Missing details', 'Phone and password are required.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.login(phone.trim(), password);
      onLogin();
    } catch (error) {
      Alert.alert('Login failed', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/*
        UI TODO:
        - Show PG app name/logo.
        - Phone/password fields.
        - Login button.
        - Error message area.
        - Loading state.
        - After login save JWT token.
        - Redirect tenant to Home Screen.
        - Keep layout centered and tenant-friendly.
      */}
      <View style={styles.card}>
        <Text style={styles.logo}>Welcome to Roomzy</Text>
        <Text style={styles.subtitle}>Tenant Portal</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            (pressed || loading) && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f7f7fb',
  },
  card: {
    gap: 14,
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
