/**
 * PG Manager — Avatar with Upload Button
 * Used on Create Account screen
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius, FontSize } from '../constants/spacing';

interface AvatarUploadProps {
  onPress: () => void;
}

export function AvatarUpload({ onPress }: AvatarUploadProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>👤</Text>
      </View>
      <View style={styles.addButton}>
        <Text style={styles.addText}>+</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatarText: {
    fontSize: 36,
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  addText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '700',
    lineHeight: 20,
  },
});