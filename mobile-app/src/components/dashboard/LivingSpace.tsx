import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/spacing';

interface Manager {
  name: string;
  label: string;
  avatar: string;
}

interface LivingSpaceProps {
  propertyName: string;
  roomInfo: string;
  roomType: string;
  propertyImage: string;
  manager: Manager;
  onContactPress?: () => void;
}

export function LivingSpace({
  propertyName,
  roomInfo,
  roomType,
  propertyImage,
  manager,
  onContactPress,
}: LivingSpaceProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Living Space</Text>
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
            <Image source={{ uri: manager.avatar }} style={styles.managerAvatarImage} />
          </View>
          <Text style={styles.managerLabel}>{manager.label}</Text>
          <Text style={styles.managerName}>{manager.name}</Text>
        </View>

        <Pressable onPress={onContactPress} style={styles.contactCard}>
          <View style={styles.contactIconContainer}>
            <MaterialCommunityIcons name="headset" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.contactText}>Contact Admin</Text>
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  propertyImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
