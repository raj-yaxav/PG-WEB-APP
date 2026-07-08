import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/spacing';

interface RentCardProps {
  title: string;
  dueDate: string;
  amount: string;
  period: string;
  status: string;
  actionLabel?: string;
  onPayPress?: () => void;
}

export function RentCard({
  title,
  dueDate,
  amount,
  period,
  status,
  actionLabel = 'Pay Now',
  onPayPress,
}: RentCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.dueDate}>{dueDate}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amount}>{amount}</Text>
        <Text style={styles.period}>{period}</Text>
      </View>

      {actionLabel === 'Coming Soon' ? (
        <View style={styles.comingSoonBadge}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#0F766E" />
          <Text style={styles.comingSoonText}>{actionLabel}</Text>
        </View>
      ) : (
        <Pressable onPress={onPayPress} style={({ pressed }) => [styles.payButton, pressed && styles.payButtonPressed]}>
          <MaterialCommunityIcons name="lightning-bolt" size={18} color={Colors.textInverse} />
          <Text style={styles.payText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E2F0FF',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.42,
    shadowRadius: 20,
    shadowOffset: { width: 10, height: 14 },
    elevation: 7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  dueDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  amount: {
    fontSize: FontSize['4xl'],
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  period: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    minHeight: 52,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 3, height: 5 },
    elevation: 2,
  },
  payButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  payText: {
    fontSize: FontSize.md,
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
  },
  comingSoonText: {
    fontSize: FontSize.md,
    color: '#0F766E',
    fontWeight: FontWeight.bold,
  },
});
