import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/spacing';

interface OccupancyItem {
  id: string;
  label: string;
  value: number;
  total: number;
  color: string;
}

interface OccupancyOverviewProps {
  items: readonly OccupancyItem[];
}

const percentage = (value: number, total: number) => {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
};

export function OccupancyOverview({ items }: OccupancyOverviewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Occupancy Status</Text>
        <Text style={styles.sectionHint}>Live beds</Text>
      </View>

      <View style={styles.card}>
        {items.map((item) => {
          const itemPercent = percentage(item.value, item.total);
          return (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.count}>
                  {item.value}/{item.total} <Text style={styles.percent}>{itemPercent}%</Text>
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${itemPercent}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
            </View>
          );
        })}
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
  sectionHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#E2F0FF',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    padding: Spacing.lg,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 7, height: 9 },
    elevation: 4,
  },
  row: {
    marginBottom: Spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  count: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  percent: {
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
  },
  track: {
    height: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.clayInset,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
