import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/spacing';

interface HeaderProps {
  userName: string;
  userContact?: string;
  avatarUrl?: string;
  onNotificationPress?: () => void;
}

export function Header({ userName, userContact, avatarUrl, onNotificationPress }: HeaderProps) {
  const now = new Date();
  const monthYear = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const dayLabel = now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit' });
  const timeLabel = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const displayName = userName?.trim() || 'there';
  const firstName = displayName.split(' ')[0] || displayName;
  const initials = displayName === 'there'
    ? 'T'
    : displayName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

  return (
    <View style={styles.container}>
      <View style={styles.avatarHalo}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{initials}</Text>
          </View>
        )}
      </View>
      <View style={styles.card}>
        <DecorativeMarks />
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{monthYear}</Text>
          <View style={styles.timeWrap}>
            <Text style={styles.metaText}>{timeLabel}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              onPress={onNotificationPress}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              hitSlop={8}
            >
              <Ionicons name="notifications-outline" size={18} color={Colors.primaryDark} />
            </Pressable>
          </View>
        </View>
        <Text style={styles.dayText}>{dayLabel}</Text>
        <Text style={styles.contactText} numberOfLines={1}>
          {userContact || `${firstName.toLowerCase()}@pgmanager.app`}
        </Text>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Hello {firstName}, how are you today?</Text>
      </View>
    </View>
  );
}

function DecorativeMarks() {
  return (
    <>
      <View style={[styles.spark, styles.sparkOne]} />
      <View style={[styles.spark, styles.sparkTwo]} />
      <View style={[styles.spark, styles.sparkThree]} />
      <View style={[styles.spark, styles.sparkFour]} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 54,
    paddingBottom: Spacing.lg,
  },
  card: {
    minHeight: 190,
    borderRadius: 30,
    backgroundColor: '#B9D9FA',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: Spacing.xl,
    paddingTop: 50,
    paddingBottom: Spacing.lg,
    overflow: 'hidden',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 8, height: 10 },
    elevation: 5,
  },
  avatarHalo: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 2,
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#A9D0F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 6, height: 8 },
    elevation: 6,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.claySurface,
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarFallbackText: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: FontWeight.extrabold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  metaText: {
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'lowercase',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: Colors.claySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
  },
  iconButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  dayText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  contactText: {
    marginTop: 5,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  title: {
    marginTop: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  spark: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    borderWidth: 4,
    borderColor: 'rgba(37,99,235,0.1)',
  },
  sparkOne: {
    left: 34,
    top: 82,
  },
  sparkTwo: {
    left: 62,
    top: 112,
    width: 16,
    height: 16,
  },
  sparkThree: {
    right: 38,
    top: 98,
  },
  sparkFour: {
    right: 72,
    top: 128,
    width: 15,
    height: 15,
  },
});
