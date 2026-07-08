import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/spacing';

interface ActionItem {
  id: string;
  label: string;
  icon: string;
}

interface ManagementActionsProps {
  onAction: (id: string) => void;
}

const actions: ActionItem[] = [
  { id: 'add-tenant', label: 'Add Tenant', icon: 'account-plus' },
  { id: 'add-room', label: 'Add Room', icon: 'door-open' },
  { id: 'add-bed', label: 'Add Bed', icon: 'bed-queen' },
];

const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  'account-plus': 'account-plus-outline',
  'door-open': 'door-open',
  'bed-queen': 'bed-queen-outline',
};

export function ManagementActions({ onAction }: ManagementActionsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Management</Text>
      <View style={styles.cardRow}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => onAction(action.id)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={iconMap[action.icon] || 'apps'}
                size={28}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },

});
