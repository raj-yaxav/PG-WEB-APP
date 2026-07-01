import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../constants/spacing';
import { PGButton } from '../components/PGButton';
import { PGCheckbox } from '../components/PGCheckbox';
import { PGInput } from '../components/PGInput';
import { ShieldLogo } from '../components/ShieldLogo';
import { AuthService } from '../services/authService';
import type { User } from '../types/auth.types';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('owner');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  async function handleLogin() {
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your login details');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await AuthService.login({
        role,
        identifier: identifier.trim(),
        password,
      });
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const shapeScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const shapeOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.48],
  });

  return (
    <SafeAreaView style={styles.screen}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingShape,
          styles.shapeTopLeft,
          { opacity: shapeOpacity, transform: [{ scale: shapeScale }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingShape,
          styles.shapeBottomRight,
          { opacity: shapeOpacity, transform: [{ scale: shapeScale }] },
        ]}
      />
      <View pointerEvents="none" style={[styles.edgeCurve, styles.edgeTopRight]} />
      <View pointerEvents="none" style={[styles.edgeCurve, styles.edgeBottomLeft]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <ShieldLogo size={76} />

          <Text style={styles.title}>PG Manager Login</Text>
          <Text style={styles.subtitle}>
            Owner uses email. Manager and tenant use assigned ID.
          </Text>

          <RolePicker
            selectedRole={role}
            onSelectRole={(nextRole) => {
              setRole(nextRole);
              setIdentifier('');
              setError('');
            }}
          />

          <View style={styles.form}>
            <PGInput
              label={role === 'owner' ? 'Owner email' : role === 'manager' ? 'Manager ID' : 'Tenant ID'}
              placeholder={role === 'owner' ? 'owner@example.com' : role === 'manager' ? 'MGR-1001' : 'TEN-1001'}
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                setError('');
              }}
              keyboardType={role === 'owner' ? 'email-address' : 'default'}
              autoCapitalize="none"
              error={error}
            />

            <PGInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry
              showToggle
            />
          </View>

          <View style={styles.optionsRow}>
            <PGCheckbox
              label="Remember me"
              checked={rememberMe}
              onToggle={() => setRememberMe(!rememberMe)}
            />
            <Text
              style={styles.forgotLink}
              onPress={() => {
                Alert.alert('Forgot Password', 'Contact your PG owner/admin to reset password.');
              }}
            >
              Forgot Password?
            </Text>
          </View>

          <PGButton
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.signInButton}
          />

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Account access rule</Text>
            <Text style={styles.noteText}>
              Owner creates manager IDs. Manager allots rooms and shares tenant IDs after booking.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RolePicker({
  selectedRole,
  onSelectRole,
}: {
  selectedRole: User['role'];
  onSelectRole: (role: User['role']) => void;
}) {
  const roles: Array<{ value: User['role']; label: string }> = [
    { value: 'owner', label: 'Owner' },
    { value: 'manager', label: 'Manager' },
    { value: 'tenant', label: 'Tenant' },
  ];

  return (
    <View style={styles.roleGroup}>
      <Text style={styles.roleLabel}>Account type</Text>
      <View style={styles.roleTabs}>
        {roles.map((item) => {
          const active = selectedRole === item.value;
          return (
            <Text
              key={item.value}
              onPress={() => onSelectRole(item.value)}
              style={[styles.roleTab, active && styles.roleTabActive]}
            >
              {item.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  floatingShape: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 64,
    backgroundColor: Colors.primaryLight,
  },
  shapeTopLeft: {
    top: -92,
    left: -82,
  },
  shapeBottomRight: {
    right: -96,
    bottom: -88,
    backgroundColor: Colors.infoBg,
  },
  edgeCurve: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.primaryBg,
  },
  edgeTopRight: {
    top: 42,
    right: -78,
    transform: [{ rotate: '22deg' }],
  },
  edgeBottomLeft: {
    bottom: 48,
    left: -82,
    transform: [{ rotate: '-18deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['3xl'],
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  form: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  roleGroup: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  roleLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  roleTab: {
    flex: 1,
    minHeight: 42,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    paddingTop: 11,
  },
  roleTabActive: {
    backgroundColor: Colors.surface,
    color: Colors.primary,
  },
  optionsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  forgotLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  signInButton: {
    width: '100%',
  },
  noteCard: {
    width: '100%',
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryBg,
    padding: Spacing.md,
  },
  noteTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  noteText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
