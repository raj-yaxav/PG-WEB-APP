import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/spacing';

interface StatItem {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface StatsGridProps {
  stats: readonly StatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <View style={styles.container}>
      {stats.map((stat) => (
        <View key={stat.id} style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: `${stat.color}18` }]}>
            <MaterialCommunityIcons
              name={(stat.icon as keyof typeof MaterialCommunityIcons.glyphMap) || 'chart-box-outline'}
              size={20}
              color={stat.color}
            />
          </View>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {stat.value}
          </Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  card: {
    width: '47.8%',
    backgroundColor: '#E2F0FF',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    padding: Spacing.lg,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 7, height: 9 },
    elevation: 4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  value: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
