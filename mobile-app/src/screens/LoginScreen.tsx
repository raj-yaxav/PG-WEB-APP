import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
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

const LOGIN_ROLES: Array<{ value: User['role']; label: string }> = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'tenant', label: 'Tenant' },
];

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('owner');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pulse = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;
  const roleSlide = useRef(new Animated.Value(0)).current;

  function switchRole(nextRole: User['role']) {
    if (nextRole === role) return;
    setRole(nextRole);
    setIdentifier('');
    setError('');
  }

  function moveRole(direction: 1 | -1) {
    const currentIndex = LOGIN_ROLES.findIndex((item) => item.value === role);
    const nextIndex = Math.max(0, Math.min(LOGIN_ROLES.length - 1, currentIndex + direction));
    switchRole(LOGIN_ROLES[nextIndex].value);
  }

  const roleSwipeResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
    onPanResponderGrant: () => {
      roleSlide.stopAnimation();
    },
    onPanResponderMove: (_, gesture) => {
      const clampedX = Math.max(-42, Math.min(42, gesture.dx));
      roleSlide.setValue(clampedX);
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx <= -58 || gesture.vx <= -0.65) {
        moveRole(1);
      } else if (gesture.dx >= 58 || gesture.vx >= 0.65) {
        moveRole(-1);
      }
      Animated.spring(roleSlide, {
        toValue: 0,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(roleSlide, {
        toValue: 0,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }).start();
    },
  });

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2800,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.timing(entrance, {
      toValue: 1,
      duration: 620,
      useNativeDriver: true,
    }).start();

    animation.start();
    return () => animation.stop();
  }, [entrance, pulse]);

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
    outputRange: [0.36, 0.58],
  });
  const floatY = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });
  const floatRotate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['-18deg', '-10deg'],
  });
  const cardTranslateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  return (
    <SafeAreaView style={styles.screen}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.softPanel,
          styles.panelTopLeft,
          { opacity: shapeOpacity, transform: [{ translateY: floatY }, { rotate: floatRotate }, { scale: shapeScale }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.softPanel,
          styles.panelBottomRight,
          { opacity: shapeOpacity, transform: [{ rotate: '16deg' }, { scale: shapeScale }] },
        ]}
      />
      <View pointerEvents="none" style={[styles.glowWash, styles.glowTop]} />
      <View pointerEvents="none" style={[styles.glowWash, styles.glowBottom]} />
      <View pointerEvents="none" style={[styles.edgeCurve, styles.edgeTopRight]} />
      <View pointerEvents="none" style={[styles.edgeCurve, styles.edgeBottomLeft]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.cardShadow,
              {
                opacity: entrance,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            <View style={styles.card}>
              <Animated.View style={[styles.logoLift, { transform: [{ translateY: floatY }] }]}>
                <ShieldLogo size={86} />
              </Animated.View>

              <Text style={styles.kicker}>PG Room Management</Text>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue your workspace.</Text>

              <Animated.View
                {...roleSwipeResponder.panHandlers}
                style={[styles.swipeArea, { transform: [{ translateX: roleSlide }] }]}
              >
                <RolePicker selectedRole={role} onSelectRole={switchRole} />

                <View style={styles.form}>
                  <PGInput
                    label={role === 'owner' ? 'Owner email' : role === 'manager' ? 'Manager ID' : 'Tenant ID'}
                    placeholder={role === 'owner' ? 'pgowner@gmail.com' : role === 'manager' ? 'MGR-1001' : 'TEN-1001'}
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
              </Animated.View>

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
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  return (
    <View style={styles.roleGroup}>
      <Text style={styles.roleLabel}>Account type</Text>
      <View style={styles.roleTabs}>
        {LOGIN_ROLES.map((item) => {
          const active = selectedRole === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => onSelectRole(item.value)}
              style={({ pressed }) => [
                styles.roleTab,
                active && styles.roleTabActive,
                pressed && styles.roleTabPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.roleTabText, active && styles.roleTabTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EAF3FF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  softPanel: {
    position: 'absolute',
    width: 280,
    height: 182,
    borderRadius: BorderRadius['3xl'],
    backgroundColor: '#CFE1FF',
    shadowColor: Colors.shadowLight,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: -8, height: -8 },
  },
  panelTopLeft: {
    top: -82,
    left: -112,
  },
  panelBottomRight: {
    right: -128,
    bottom: -80,
    backgroundColor: '#D7F0FF',
  },
  glowWash: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(37,99,235,0.10)',
  },
  glowTop: {
    top: 58,
    right: -86,
  },
  glowBottom: {
    left: -92,
    bottom: 88,
    backgroundColor: 'rgba(14,165,233,0.10)',
  },
  edgeCurve: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: BorderRadius['3xl'],
    borderWidth: 2,
    borderColor: 'rgba(37,99,235,0.14)',
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
    paddingTop: Spacing['5xl'],
    paddingBottom: Platform.OS === 'android' ? Spacing['5xl'] : Spacing['3xl'],
    justifyContent: 'center',
  },
  cardShadow: {
    width: '100%',
    borderRadius: BorderRadius['3xl'],
    backgroundColor: '#EAF3FF',
    shadowColor: 'rgba(30,64,175,0.22)',
    shadowOpacity: 1,
    shadowRadius: 30,
    shadowOffset: { width: 14, height: 18 },
    elevation: 10,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    borderRadius: BorderRadius['3xl'],
    backgroundColor: '#F8FBFF',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.86)',
    shadowColor: 'rgba(255,255,255,0.96)',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: -8, height: -8 },
  },
  logoLift: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
    marginBottom: Spacing.md,
    backgroundColor: '#E6F0FF',
    shadowColor: 'rgba(37,99,235,0.24)',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  kicker: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primaryDark,
    letterSpacing: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
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
  swipeArea: {
    width: '100%',
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
    backgroundColor: '#E3EEFF',
    borderRadius: BorderRadius['2xl'],
    padding: 5,
    borderWidth: 1,
    borderColor: '#D4E3F8',
  },
  roleTab: {
    flex: 1,
    minHeight: 44,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(30,64,175,0.20)',
    shadowOpacity: 0.95,
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 6 },
    elevation: 3,
  },
  roleTabPressed: {
    transform: [{ scale: 0.98 }],
  },
  roleTabText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  roleTabTextActive: {
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
    minHeight: 44,
    textAlignVertical: 'center',
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  signInButton: {
    width: '100%',
  },
});
