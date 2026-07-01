import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/spacing';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
}

interface QuickActionsProps {
  actions: readonly QuickAction[];
  onActionPress: (id: string) => void;
}

const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  bed: 'bed-outline',
  wallet: 'wallet-outline',
  clock: 'clock-outline',
  chat: 'chat-outline',
  'office-building': 'office-building-outline',
  'account-group': 'account-group-outline',
  'cash-clock': 'cash-clock',
  'chart-box': 'chart-box-outline',
  'alert-circle': 'alert-circle-outline',
  'account-multiple': 'account-multiple-outline',
};

export function QuickActions({ actions, onActionPress }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          onPress={() => onActionPress(action.id)}
          style={styles.actionItem}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={iconMap[action.icon] || 'apps'}
              size={24}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionItem: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});
