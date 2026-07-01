import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/spacing';

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  icon: string;
}

interface ComplaintsSectionProps {
  activeCount: number;
  complaints: readonly Complaint[];
  onRaiseComplaint?: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: Colors.error,
  'IN PROGRESS': Colors.warning,
  RESOLVED: Colors.success,
};

export function ComplaintsSection({
  activeCount,
  complaints,
  onRaiseComplaint,
}: ComplaintsSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.error} />
          <Text style={styles.sectionTitle}>Complaints</Text>
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>{activeCount} ACTIVE</Text>
        </View>
      </View>

      <View style={styles.card}>
        {complaints.length === 0 ? (
          <Text style={styles.emptyText}>No active complaints right now.</Text>
        ) : (
          complaints.map((complaint) => (
            <View key={complaint.id} style={styles.complaintItem}>
              <View style={styles.complaintIcon}>
                <MaterialCommunityIcons name="tools" size={18} color={Colors.warning} />
              </View>
              <View style={styles.complaintContent}>
                <Text style={styles.complaintTitle}>{complaint.title}</Text>
                <Text style={styles.complaintDesc}>{complaint.description}</Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusColors[complaint.status] || Colors.warning },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: statusColors[complaint.status] || Colors.warning },
                    ]}
                  >
                    {complaint.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        <Pressable onPress={onRaiseComplaint} style={styles.raiseButton}>
          <MaterialCommunityIcons name="plus" size={16} color={Colors.textSecondary} />
          <Text style={styles.raiseText}>Raise New Complaint</Text>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  activeBadge: {
    backgroundColor: Colors.errorBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  activeBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: FontWeight.bold,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  complaintItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  complaintIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  complaintContent: {
    flex: 1,
  },
  complaintTitle: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  complaintDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  raiseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  raiseText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
});
