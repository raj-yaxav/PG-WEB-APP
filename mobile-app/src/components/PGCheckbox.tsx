/**
 * PG Manager - Checkbox Component
 */

import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../constants/spacing';

interface PGCheckboxProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export function PGCheckbox({ label, checked, onToggle }: PGCheckboxProps) {
  return (
    <Pressable onPress={onToggle} style={styles.container} hitSlop={8}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <MaterialCommunityIcons name="check" size={14} color={Colors.textInverse} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.borderInput,
    backgroundColor: Colors.claySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  boxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});
