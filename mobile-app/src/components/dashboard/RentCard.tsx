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
  onPayPress?: () => void;
}

export function RentCard({ title, dueDate, amount, period, status, onPayPress }: RentCardProps) {
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

      <Pressable onPress={onPayPress} style={styles.payButton}>
        <MaterialCommunityIcons name="lightning-bolt" size={18} color={Colors.primary} />
        <Text style={styles.payText}>Pay Now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.md,
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },
  dueDate: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  amount: {
    fontSize: FontSize['4xl'],
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },
  period: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: Spacing.xs,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  payText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
