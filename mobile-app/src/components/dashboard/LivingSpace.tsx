import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/spacing';

interface Manager {
  name: string;
  label: string;
  avatar?: string;
}

interface LivingSpaceProps {
  title?: string;
  contactLabel?: string;
  propertyName: string;
  roomInfo: string;
  roomType: string;
  propertyImage: string;
  manager: Manager;
  onContactPress?: () => void;
}

export function LivingSpace({
  title = 'Living Space',
  contactLabel = 'Contact Admin',
  propertyName,
  roomInfo,
  roomType,
  propertyImage,
  manager,
  onContactPress,
}: LivingSpaceProps) {
  const managerName = manager.name?.trim() || 'Property Team';
  const managerInitials = managerName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <MaterialCommunityIcons name="dots-horizontal" size={24} color={Colors.textTertiary} />
      </View>

      <View style={styles.propertyCard}>
        <Image source={{ uri: propertyImage }} style={styles.propertyImage} />
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyLabel}>{propertyName}</Text>
          <Text style={styles.roomInfo}>{roomInfo}</Text>
          <Text style={styles.roomType}>{roomType}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.managerCard}>
          <View style={styles.managerAvatar}>
            {manager.avatar ? (
              <Image source={{ uri: manager.avatar }} style={styles.managerAvatarImage} />
            ) : (
              <Text style={styles.managerAvatarText}>{managerInitials}</Text>
            )}
          </View>
          <Text style={styles.managerLabel}>{manager.label}</Text>
          <Text style={styles.managerName}>{managerName}</Text>
        </View>

        <Pressable onPress={onContactPress} style={({ pressed }) => [styles.contactCard, pressed && styles.contactCardPressed]}>
          <View style={styles.contactIconContainer}>
            <MaterialCommunityIcons name="headset" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.contactText}>{contactLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2F0FF',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    marginBottom: Spacing.md,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 7, height: 9 },
    elevation: 4,
  },
  propertyImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    marginRight: Spacing.md,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyLabel: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  roomInfo: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  roomType: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  managerCard: {
    flex: 1,
    backgroundColor: '#E2F0FF',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.58,
    shadowRadius: 12,
    shadowOffset: { width: 6, height: 8 },
    elevation: 3,
  },
  managerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  managerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  managerAvatarText: {
    fontSize: FontSize.sm,
    color: Colors.primaryDark,
    fontWeight: FontWeight.extrabold,
  },
  managerLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  managerName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#E2F0FF',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.58,
    shadowRadius: 12,
    shadowOffset: { width: 6, height: 8 },
    elevation: 3,
  },
  contactCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  contactText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
});
