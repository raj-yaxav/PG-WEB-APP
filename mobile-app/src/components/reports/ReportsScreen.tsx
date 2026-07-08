import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
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

interface Report {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  managerId?: { _id: string; name: string; phone?: string };
  propertyId?: { _id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
  ownerNote?: string;
}

interface PropertyOption {
  _id: string;
  name: string;
  city?: string;
}

interface ReportsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  role: User['role'];
}

const formatDate = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const REPORT_CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

const priorityConfig: Record<string, { color: string; bg: string }> = {
  low: { color: '#16A34A', bg: '#DCFCE7' },
  medium: { color: '#D97706', bg: '#FEF3C7' },
  high: { color: '#DC2626', bg: '#FEE2E2' },
  urgent: { color: '#7C3AED', bg: '#EDE9FE' },
};

const categoryLabels: Record<string, string> = {
  daily_update: 'Daily Update',
  maintenance: 'Maintenance',
  tenant_issue: 'Tenant Issue',
  payment: 'Payment',
  incident: 'Incident',
  other: 'Other',
};

const categoryOptions = [
  { value: 'daily_update', label: 'Daily Update', icon: 'calendar-check-outline' },
  { value: 'maintenance', label: 'Maintenance', icon: 'tools' },
  { value: 'tenant_issue', label: 'Tenant Issue', icon: 'account-alert-outline' },
  { value: 'payment', label: 'Payment', icon: 'cash-clock' },
  { value: 'incident', label: 'Incident', icon: 'alert-outline' },
  { value: 'other', label: 'Other', icon: 'dots-horizontal-circle-outline' },
] as const;

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

const statusConfig: Record<string, { color: string; bg: string }> = {
  pending: { color: '#D97706', bg: '#FEF3C7' },
  submitted: { color: '#2563EB', bg: '#DBEAFE' },
  reviewed: { color: '#16A34A', bg: '#DCFCE7' },
  closed: { color: '#70819C', bg: '#E4EEFC' },
};

export function ReportsScreen({ onBack, onLogout, role }: ReportsScreenProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    category: 'daily_update',
    priority: 'medium',
    propertyId: '',
    description: '',
  });
  const [adding, setAdding] = useState(false);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(titleTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadReports = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError('');
      const data = await workspaceApi.reports.list();
      setReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const loadProperties = useCallback(async () => {
    if (role !== 'manager') return;
    try {
      setPropertiesLoading(true);
      const data = await workspaceApi.properties.list();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log('[Reports] Failed to load properties:', err?.message || err);
      setProperties([]);
    } finally {
      setPropertiesLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports(false);
  }, [loadReports]);

  const openAddModal = useCallback(() => {
    setAddForm({ title: '', category: 'daily_update', priority: 'medium', propertyId: '', description: '' });
    setShowAddModal(true);
    loadProperties();
  }, [loadProperties]);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setAddForm({ title: '', category: 'daily_update', priority: 'medium', propertyId: '', description: '' });
  }, []);

  const handleSaveReport = useCallback(async () => {
    if (!addForm.title.trim()) {
      Alert.alert('Required', 'Report title is required');
      return;
    }
    setAdding(true);
    try {
      const payload: any = {
        title: addForm.title.trim(),
        category: addForm.category,
        priority: addForm.priority,
      };
      if (addForm.propertyId) payload.propertyId = addForm.propertyId;
      if (addForm.description.trim()) payload.description = addForm.description.trim();

      const newReport = await workspaceApi.reports.create(payload);
      await loadReports(false);
      closeModal();
    } catch (err: any) {
      console.log('[Reports] Create report failed:', err?.message || err);
      Alert.alert('Error', err?.message || 'Failed to create report');
    } finally {
      setAdding(false);
    }
  }, [addForm, closeModal, loadReports]);

  const handleStatusChange = useCallback(async (report: Report, status: string) => {
    try {
      await workspaceApi.reports.updateStatus(report._id, status);
      await loadReports(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update report');
    }
  }, [loadReports]);

  const searchTerm = search.trim().toLowerCase();
  const selectedProperty = properties.find((property) => property._id === addForm.propertyId);
  const filteredReports = useMemo(
    () =>
      searchTerm
        ? reports.filter(
            (r) =>
              r.title?.toLowerCase().includes(searchTerm) ||
              r.description?.toLowerCase().includes(searchTerm) ||
              r.managerId?.name?.toLowerCase().includes(searchTerm) ||
              r.propertyId?.name?.toLowerCase().includes(searchTerm) ||
              (r.category || '').toLowerCase().includes(searchTerm),
          )
        : reports,
    [reports, searchTerm],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.headerBar}>
        <Animated.View
          style={[
            styles.headerTitleWrap,
            { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] },
          ]}
        >
          <Text style={styles.headerTitle}>Reports Workspace</Text>
          <Text style={styles.headerSubtitle}>
            {reports.length} {reports.length === 1 ? 'report' : 'reports'} &middot; {role === 'owner' ? 'Owner' : 'Manager'}
          </Text>
        </Animated.View>

        {role === 'manager' ? (
          <Pressable
            onPress={openAddModal}
            style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Create report"
          >
            <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
          </Pressable>
        ) : null}
        <Pressable
          onPress={handleRefresh}
          style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Refresh"
        >
          <MaterialCommunityIcons name="refresh" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color={Colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search reports..."
            placeholderTextColor={Colors.textTertiary}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {loading ? (
          <LoadingSkeleton />
        ) : filteredReports.length === 0 && !searchTerm ? (
          <EmptyState role={role} />
        ) : filteredReports.length === 0 && searchTerm ? (
          <View style={styles.noResults}>
            <MaterialCommunityIcons name="earth-off" size={40} color={Colors.textTertiary} />
            <Text style={styles.noResultsText}>No reports match "{search}"</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              All Reports
              <Text style={styles.sectionCount}> ({filteredReports.length})</Text>
            </Text>
            <View style={styles.reportList}>
              {filteredReports.map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  role={role}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Report</Text>
              <Pressable onPress={closeModal} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>Title *</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.title}
                onChangeText={(t) => setAddForm((f) => ({ ...f, title: t }))}
                placeholder="e.g. Daily Property Update"
                placeholderTextColor={Colors.textTertiary}
              />

              <Text style={styles.modalLabel}>Category</Text>
              <ChoiceGrid
                options={categoryOptions}
                value={addForm.category}
                onChange={(value) => setAddForm((f) => ({ ...f, category: value }))}
              />

              <Text style={styles.modalLabel}>Priority</Text>
              <ChoiceGrid
                options={priorityOptions}
                value={addForm.priority}
                onChange={(value) => setAddForm((f) => ({ ...f, priority: value }))}
                compact
              />

              <View style={styles.fieldHeaderRow}>
                <Text style={styles.modalLabel}>Property</Text>
                <Pressable onPress={loadProperties} hitSlop={10} accessibilityRole="button" accessibilityLabel="Refresh properties">
                  <MaterialCommunityIcons name="refresh" size={16} color={Colors.primary} />
                </Pressable>
              </View>
              <View style={styles.propertySelect}>
                <Pressable
                  style={({ pressed }) => [
                    styles.propertyOption,
                    !addForm.propertyId && styles.propertyOptionActive,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => setAddForm((f) => ({ ...f, propertyId: '' }))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: !addForm.propertyId }}
                >
                  <MaterialCommunityIcons name="home-city-outline" size={18} color={!addForm.propertyId ? Colors.textInverse : Colors.primary} />
                  <View style={styles.propertyOptionTextWrap}>
                    <Text style={[styles.propertyOptionTitle, !addForm.propertyId && styles.propertyOptionTitleActive]}>
                      No property selected
                    </Text>
                    <Text style={[styles.propertyOptionSub, !addForm.propertyId && styles.propertyOptionSubActive]}>
                      Send a general update
                    </Text>
                  </View>
                </Pressable>

                {propertiesLoading ? (
                  <Text style={styles.propertyHint}>Loading properties...</Text>
                ) : properties.length === 0 ? (
                  <Text style={styles.propertyHint}>No properties found. You can still send this as a general report.</Text>
                ) : (
                  properties.map((property) => {
                    const active = addForm.propertyId === property._id;
                    return (
                      <Pressable
                        key={property._id}
                        style={({ pressed }) => [
                          styles.propertyOption,
                          active && styles.propertyOptionActive,
                          pressed && styles.optionPressed,
                        ]}
                        onPress={() => setAddForm((f) => ({ ...f, propertyId: property._id }))}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <MaterialCommunityIcons name="office-building-marker-outline" size={18} color={active ? Colors.textInverse : Colors.primary} />
                        <View style={styles.propertyOptionTextWrap}>
                          <Text style={[styles.propertyOptionTitle, active && styles.propertyOptionTitleActive]} numberOfLines={1}>
                            {property.name}
                          </Text>
                          <Text style={[styles.propertyOptionSub, active && styles.propertyOptionSubActive]} numberOfLines={1}>
                            {property.city || 'Property selected'}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
              {selectedProperty ? (
                <Text style={styles.fieldHelper}>Report will be linked with {selectedProperty.name}.</Text>
              ) : null}

              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                value={addForm.description}
                onChangeText={(t) => setAddForm((f) => ({ ...f, description: t }))}
                placeholder="Write report details..."
                placeholderTextColor={Colors.textTertiary}
                multiline
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, adding && styles.modalSubmitBtnDisabled]}
                onPress={handleSaveReport}
                disabled={adding}
              >
                <Text style={styles.modalSubmitText}>
                  {adding ? 'Saving...' : 'Create Report'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ChoiceGrid({
  options,
  value,
  onChange,
  compact = false,
}: {
  options: ReadonlyArray<{ value: string; label: string; icon?: keyof typeof MaterialCommunityIcons.glyphMap }>;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.choiceGrid, compact && styles.choiceGridCompact]}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.choicePill,
              compact && styles.choicePillCompact,
              active && styles.choicePillActive,
              pressed && styles.optionPressed,
            ]}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
          >
            {option.icon ? (
              <MaterialCommunityIcons
                name={option.icon}
                size={16}
                color={active ? Colors.textInverse : Colors.primary}
              />
            ) : null}
            <Text style={[styles.choicePillText, active && styles.choicePillTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ReportCard({
  report,
  role,
  onStatusChange,
}: {
  report: Report;
  role: User['role'];
  onStatusChange: (report: Report, status: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [expanded, setExpanded] = useState(false);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, friction: 8, tension: 120, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const pc = priorityConfig[report.priority || ''] || priorityConfig.medium;
  const sc = statusConfig[report.status || ''] || statusConfig.pending;
  const catLabel = categoryLabels[report.category || ''] || report.category || 'General';

  return (
    <Animated.View style={[styles.reportCard, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => setExpanded((p) => !p)}
        accessibilityRole="button"
        accessibilityLabel={report.title}
        accessibilityState={{ expanded }}
      >
        <View style={styles.reportTopRow}>
          <View style={styles.reportIconWrap}>
            <MaterialCommunityIcons name="chart-box-outline" size={24} color={Colors.primary} />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle} numberOfLines={1}>{report.title}</Text>
            <View style={styles.chipsRow}>
              {report.priority ? (
                <View style={[styles.chip, { backgroundColor: pc.bg }]}>
                  <Text style={[styles.chipText, { color: pc.color }]}>
                    {report.priority.toUpperCase()}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.chip, { backgroundColor: sc.bg }]}>
                <Text style={[styles.chipText, { color: sc.color }]}>
                  {(report.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.textTertiary}
          />
        </View>

        <View style={styles.reportMetaRow}>
          <MaterialCommunityIcons name="tag-outline" size={13} color={Colors.textTertiary} />
          <Text style={styles.reportMetaText}>{catLabel}</Text>
        </View>

        <View style={styles.reportMetaRow}>
          <MaterialCommunityIcons name="account-outline" size={13} color={Colors.textTertiary} />
          <Text style={styles.reportMetaText}>{report.managerId?.name || 'Manager'}</Text>
        </View>

        {report.propertyId?.name ? (
          <View style={styles.reportMetaRow}>
            <MaterialCommunityIcons name="office-building-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.reportMetaText}>{report.propertyId.name}</Text>
          </View>
        ) : null}

        <View style={styles.reportMetaRow}>
          <MaterialCommunityIcons name="calendar-outline" size={13} color={Colors.textTertiary} />
          <Text style={styles.reportMetaText}>{formatDate(report.createdAt)}</Text>
        </View>

        {report.description ? (
          <Text style={styles.reportDescription} numberOfLines={expanded ? undefined : 2}>
            {report.description}
          </Text>
        ) : null}

        {expanded && report.ownerNote ? (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="message-text-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.detailText}>Owner note: {report.ownerNote}</Text>
            </View>
          </View>
        ) : null}

        {role === 'owner' && report.status !== 'closed' ? (
          <View style={styles.reportActions}>
            {report.status !== 'reviewed' ? (
              <Pressable
                style={styles.actionBtn}
                onPress={() => onStatusChange(report, 'reviewed')}
              >
                <MaterialCommunityIcons name="check-circle-outline" size={14} color={Colors.success} />
                <Text style={styles.actionBtnText}>Reviewed</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() => onStatusChange(report, 'closed')}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={14} color={Colors.error} />
              <Text style={[styles.actionBtnText, styles.actionBtnDangerText]}>Close</Text>
            </Pressable>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard} />
      ))}
    </View>
  );
}

function EmptyState({ role }: { role: User['role'] }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons name="chart-box-outline" size={44} color={Colors.primaryLight} />
      </View>
      <Text style={styles.emptyTitle}>No Reports Yet</Text>
      <Text style={styles.emptyText}>
        {role === 'manager'
          ? 'Create your first report to keep the owner updated on property operations.'
          : 'Reports from managers will appear here once they start submitting.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.clayBase,
    paddingTop: 0,
  },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D4ED8',
    marginHorizontal: Spacing.lg,
    marginTop: 36,
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    gap: Spacing.md,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerIconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.lg,
    minHeight: 46,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    paddingVertical: 0,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.12)',
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  scrollContent: {
    paddingBottom: 40,
    gap: Spacing.md,
  },

  sectionLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    paddingHorizontal: Spacing.lg,
  },
  sectionCount: {
    color: Colors.textTertiary,
    fontWeight: FontWeight.normal,
    fontSize: FontSize.sm,
  },

  reportList: {
    paddingHorizontal: Spacing.lg,
    gap: 16,
  },

  reportCard: {
    width: REPORT_CARD_WIDTH,
    backgroundColor: '#E2F0FF',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.58,
    shadowRadius: 16,
    shadowOffset: { width: 8, height: 10 },
    elevation: 5,
  },

  reportTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  reportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 4, height: 6 },
    elevation: 3,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  chip: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.3,
  },

  reportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  reportMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },

  reportDescription: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    lineHeight: 18,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },

  reportActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.successBg,
  },
  actionBtnDanger: {
    backgroundColor: Colors.errorBg,
  },
  actionBtnText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
  actionBtnDangerText: {
    color: Colors.error,
  },

  expandedSection: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginBottom: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  detailText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: Spacing.sm,
  },
  noResultsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  skeletonContainer: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  skeletonCard: {
    width: REPORT_CARD_WIDTH,
    height: 180,
    backgroundColor: '#E2F0FF',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 8, height: 10 },
    elevation: 5,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.clayBase,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  modalLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  choiceGridCompact: {
    gap: 6,
  },
  choicePill: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderInput,
  },
  choicePillCompact: {
    minHeight: 40,
    paddingVertical: 8,
  },
  choicePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 6 },
    elevation: 4,
  },
  choicePillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  choicePillTextActive: {
    color: Colors.textInverse,
  },
  optionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  propertySelect: {
    gap: Spacing.sm,
  },
  propertyOption: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderInput,
  },
  propertyOptionActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 6 },
    elevation: 4,
  },
  propertyOptionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  propertyOptionTitle: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  propertyOptionTitleActive: {
    color: Colors.textInverse,
  },
  propertyOptionSub: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  propertyOptionSubActive: {
    color: 'rgba(255,255,255,0.72)',
  },
  propertyHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
  fieldHelper: {
    marginTop: Spacing.xs,
    fontSize: FontSize.xs,
    color: Colors.primaryDark,
    fontWeight: FontWeight.semibold,
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderInput,
  },
  modalTextarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
  },
  modalSubmitBtnDisabled: {
    opacity: 0.6,
  },
  modalSubmitText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
});
