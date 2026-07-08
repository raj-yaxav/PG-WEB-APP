import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/spacing';
import { workspaceApi } from '../../services/apiClient';
import type { User } from '../../types/auth.types';

interface ComplaintData {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved';
  tenantId?: { name?: string; phone?: string; roomNumber?: string };
  propertyId?: { name?: string };
  adminNote?: string;
  createdAt?: string;
}

interface ComplaintsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  role: User['role'];
}

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  in_progress: '#2563EB',
  resolved: '#16A34A',
};
const statusLabels: Record<string, string> = {
  pending: 'PENDING',
  in_progress: 'IN PROGRESS',
  resolved: 'RESOLVED',
};
const categoryIcons: Record<string, string> = {
  electricity: 'flash',
  water: 'water',
  wifi: 'wifi',
  cleaning: 'broom',
  food: 'food',
  furniture: 'table',
  other: 'clipboard-text',
};

export function ComplaintsScreen({ onBack, role }: ComplaintsScreenProps) {
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Detail modal
  const [selected, setSelected] = useState<ComplaintData | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Status update
  const [updating, setUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const loadComplaints = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError('');
      const data = await workspaceApi.complaints.list();
      const list: ComplaintData[] = data?.complaints || data || [];
      setComplaints(list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()));
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (err: any) {
      setError(err?.message || 'Failed to load queries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadComplaints(false);
  }, [loadComplaints]);

  const openDetail = useCallback((c: ComplaintData) => {
    setSelected(c);
    setAdminNote(c.adminNote || '');
    setDetailVisible(true);
  }, []);

  const handleStatusUpdate = useCallback(async (newStatus: string) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await workspaceApi.complaints.updateStatus(selected._id, newStatus, adminNote);
      setComplaints(prev => prev.map(c => c._id === selected._id ? { ...c, status: newStatus as any, adminNote } : c));
      setDetailVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  }, [selected, adminNote]);

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  const counts = {
    pending: complaints.filter(c => c.status === 'pending').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };
  const screenTitle = role === 'tenant' ? 'My Queries' : 'Tenant Queries';

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}><Text style={styles.loadingText}>Loading queries...</Text></View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={onRefresh}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Pressable onPress={onBack} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>{screenTitle}</Text>
            <Pressable onPress={onRefresh} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
              <MaterialCommunityIcons name="refresh" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Stat chips */}
          <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
            <Pressable onPress={() => setFilter('all')} style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>ALL {complaints.length}</Text>
            </Pressable>
            <Pressable onPress={() => setFilter('pending')} style={[styles.filterChip, filter === 'pending' && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filter === 'pending' && styles.filterChipTextActive]}>OPEN {counts.pending}</Text>
            </Pressable>
            <Pressable onPress={() => setFilter('in_progress')} style={[styles.filterChip, filter === 'in_progress' && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filter === 'in_progress' && styles.filterChipTextActive]}>ACTIVE {counts.in_progress}</Text>
            </Pressable>
            <Pressable onPress={() => setFilter('resolved')} style={[styles.filterChip, filter === 'resolved' && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filter === 'resolved' && styles.filterChipTextActive]}>DONE {counts.resolved}</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* List */}
        <View style={styles.listSection}>
          {filtered.map((c, idx) => (
            <Animated.View key={c._id} style={[styles.complaintCard, { opacity: fadeAnim }]}>
              <Pressable onPress={() => openDetail(c)} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.statusPill, { backgroundColor: statusColors[c.status] + '18' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColors[c.status] }]} />
                    <Text style={[styles.statusPillText, { color: statusColors[c.status] }]}>{statusLabels[c.status]}</Text>
                  </View>
                  <Text style={styles.cardDate}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardIconWrap}>
                    <MaterialCommunityIcons
                      name={(categoryIcons[c.category] || 'clipboard-text') as any}
                      size={18}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{c.description}</Text>
                    {c.tenantId?.name && (
                      <Text style={styles.cardTenant}>
                        <MaterialCommunityIcons name="account" size={12} color={Colors.textTertiary} /> {c.tenantId.name}
                        {c.tenantId.phone ? ` · ${c.tenantId.phone}` : ''}
                      </Text>
                    )}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#D0D9E8" />
                </View>
              </Pressable>
            </Animated.View>
          ))}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="check-circle-outline" size={48} color="#D0D9E8" />
              <Text style={styles.emptyText}>No {filter === 'all' ? '' : filter} queries</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={detailVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDetailVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Pressable onPress={() => setDetailVisible(false)} style={styles.modalCloseBtn}>
              <MaterialCommunityIcons name="close" size={20} color={Colors.textTertiary} />
            </Pressable>

            {selected && (
              <>
                <View style={styles.detailHeader}>
                  <View style={[styles.statusPillLg, { backgroundColor: statusColors[selected.status] + '18' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColors[selected.status] }]} />
                    <Text style={[styles.statusPillLgText, { color: statusColors[selected.status] }]}>
                      {statusLabels[selected.status]}
                    </Text>
                  </View>
                  <Text style={styles.detailDate}>
                    {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    }) : ''}
                  </Text>
                </View>

                <Text style={styles.detailTitle}>{selected.title}</Text>
                <Text style={styles.detailCategory}>{selected.category?.toUpperCase().replace('_', ' ')}</Text>
                <Text style={styles.detailDesc}>{selected.description}</Text>

                {selected.tenantId?.name && (
                  <View style={styles.detailTenantRow}>
                    <MaterialCommunityIcons name="account-circle" size={18} color={Colors.primary} />
                    <Text style={styles.detailTenantText}>
                      {selected.tenantId.name} — {selected.tenantId.phone || 'No phone'}
                    </Text>
                  </View>
                )}

                <Text style={styles.fieldLabel}>Admin Note</Text>
                <TextInput
                  style={styles.noteInput}
                  value={adminNote}
                  onChangeText={setAdminNote}
                  placeholder="Add admin note..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />

                {(role === 'manager' || role === 'owner') && selected.status !== 'resolved' && (
                  <View style={styles.actionRow}>
                    {selected.status === 'pending' && (
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
                        onPress={() => handleStatusUpdate('in_progress')}
                        disabled={updating}
                      >
                        {updating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.actionBtnText}>Mark In Progress</Text>}
                      </Pressable>
                    )}
                    {selected.status === 'in_progress' && (
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: '#16A34A' }]}
                        onPress={() => handleStatusUpdate('resolved')}
                        disabled={updating}
                      >
                        {updating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.actionBtnText}>Mark Resolved</Text>}
                      </Pressable>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.clayBase,
    paddingTop: 0,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  // Header
  header: {
    backgroundColor: '#1D4ED8',
    paddingTop: 36,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    gap: 8,
  },
  filterChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterChipText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // List
  listSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  complaintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius['xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.3,
  },
  cardDate: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  cardDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 18,
    marginTop: 3,
  },
  cardTenant: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: Colors.clayBase,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D9E8',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E4EEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Detail content
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statusPillLg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statusPillLgText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  detailDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  detailTitle: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.sm,
  },
  detailCategory: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  detailDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  detailTenantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius['lg'],
    backgroundColor: Colors.primaryBg,
  },
  detailTenantText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },

  // Note & actions
  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: Spacing.lg,
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius['lg'],
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius['xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },

  // Loading / Error
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
  },
  retryText: {
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
});
