/**
 * PG Manager — Primary Button Component
 * 
 * Props:
 * - label: string — button text
 * - onPress: () => void — press handler
 * - variant?: 'primary' | 'outline' | 'social' — button style
 * - loading?: boolean — show loading state
 * - disabled?: boolean — disable interaction
 * - icon?: ReactNode — optional left icon
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../constants/spacing';

interface PGButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'social';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function PGButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: PGButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (pressed || isDisabled) && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.textInverse : Colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 8, height: 10 },
    elevation: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  text: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  primary: {
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  primaryText: {
    color: Colors.textInverse,
  },
  outline: {
    backgroundColor: Colors.claySurface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlineText: {
    color: Colors.textPrimary,
  },
  social: {
    backgroundColor: Colors.claySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 48,
  },
  socialText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
