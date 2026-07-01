/**
 * PG Manager — Text Input Component
 * 
 * Props:
 * - label?: string — field label
 * - placeholder: string — input placeholder
 * - value: string — controlled value
 * - onChangeText: (text: string) => void — change handler
 * - secureTextEntry?: boolean — password mode
 * - keyboardType?: KeyboardTypeOptions — keyboard type
 * - error?: string — error message
 * - autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../constants/spacing';

interface PGInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  showToggle?: boolean;
}

export function PGInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  showToggle = false,
  keyboardType,
  autoCapitalize = 'none',
  ...rest
}: PGInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(!secureTextEntry);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry={!isVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
          {...rest}
        />
        {showToggle && secureTextEntry && (
          <Pressable
            onPress={() => setIsVisible(!isVisible)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>
              {isVisible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
  },
  inputWrapperFocused: {
    borderColor: Colors.borderInputFocus,
    borderWidth: 1.5,
  },
  inputWrapperError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  toggle: {
    paddingLeft: Spacing.sm,
  },
  toggleText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});