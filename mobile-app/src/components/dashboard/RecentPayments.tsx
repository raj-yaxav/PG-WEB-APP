import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/spacing';

interface Payment {
  id: string;
  title: string;
  date: string;
  amount: string;
  status: string;
  icon: string;
}

interface RecentPaymentsProps {
  payments: readonly Payment[];
  onViewAll?: () => void;
}

const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  building: 'bank-outline',
  card: 'credit-card-outline',
};

export function RecentPayments({ payments, onViewAll }: RecentPaymentsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        <Pressable onPress={onViewAll}>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {payments.map((payment) => (
          <View key={payment.id} style={styles.paymentItem}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={iconMap[payment.icon] || 'cash'}
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>{payment.title}</Text>
              <Text style={styles.paymentDate}>{payment.date}</Text>
            </View>
            <View style={styles.paymentAmount}>
              <Text style={styles.amount}>{payment.amount}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{payment.status}</Text>
              </View>
            </View>
          </View>
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
  viewAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  list: {
    gap: Spacing.md,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  statusBadge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
});
