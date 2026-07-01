import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, FontSize, FontWeight } from '../../constants/spacing';

interface HeaderProps {
  userName: string;
  avatarUrl: string;
  onCalendarPress?: () => void;
  onNotificationPress?: () => void;
}

export function Header({ userName, avatarUrl, onCalendarPress, onNotificationPress }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View>
          <Text style={styles.welcomeLabel}>WELCOME BACK,</Text>
          <Text style={styles.userName}>Hi, {userName}!</Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Pressable onPress={onCalendarPress} style={styles.iconButton}>
          <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
        <Pressable onPress={onNotificationPress} style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  welcomeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
