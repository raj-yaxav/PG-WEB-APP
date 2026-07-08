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

interface Manager {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  loginId: string;
  status: 'active' | 'on_leave' | 'inactive';
  createdAt?: string;
}

interface ManagersScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

const statusConfig: Record<string, { color: string; bg: string }> = {
  active: { color: '#16A34A', bg: '#DCFCE7' },
  on_leave: { color: '#D97706', bg: '#FEF3C7' },
  inactive: { color: '#DC2626', bg: '#FEE2E2' },
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ManagersScreen({ onBack, onLogout }: ManagersScreenProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', loginId: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(titleTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadManagers = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError('');
      const data = await workspaceApi.managers.list();
      setManagers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load managers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadManagers(false);
  }, [loadManagers]);

  const openAddModal = useCallback(() => {
    setAddForm({ name: '', email: '', phone: '', loginId: '', password: '' });
    setShowAddModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setAddForm({ name: '', email: '', phone: '', loginId: '', password: '' });
  }, []);

  const handleSaveManager = useCallback(async () => {
    if (!addForm.name.trim() || !addForm.password) {
      Alert.alert('Required', 'Manager name and password are required');
      return;
    }
    setAdding(true);
    try {
      const payload: any = { name: addForm.name.trim(), password: addForm.password };
      if (addForm.email.trim()) payload.email = addForm.email.trim();
      if (addForm.phone.trim()) payload.phone = addForm.phone.trim();
      if (addForm.loginId.trim()) payload.loginId = addForm.loginId.trim();

      const result = await workspaceApi.managers.create(payload);
      const newManager = result.user || result;
      setManagers((prev) => [newManager, ...prev]);
      closeModal();
      const credentials = result?.accountCredentials;
      if (credentials?.loginId) {
        Alert.alert('Manager created', `Manager ID: ${credentials.loginId}\nPassword: ${credentials.password}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create manager');
    } finally {
      setAdding(false);
    }
  }, [addForm, closeModal]);

  const handleDeleteManager = useCallback((manager: Manager) => {
    Alert.alert(
      'Delete Manager',
      `Are you sure you want to delete ${manager.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await workspaceApi.managers.delete(manager._id);
              setManagers((prev) => prev.filter((m) => m._id !== manager._id));
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete manager');
            }
          },
        },
      ],
    );
  }, []);

  const openDetailModal = useCallback((manager: Manager) => {
    setSelectedManager(manager);
    setShowDetailModal(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedManager(null);
  }, []);

  const searchTerm = search.trim().toLowerCase();
  const filteredManagers = useMemo(
    () =>
      searchTerm
        ? managers.filter(
            (m) =>
              m.name?.toLowerCase().includes(searchTerm) ||
              m.email?.toLowerCase().includes(searchTerm) ||
              m.loginId?.toLowerCase().includes(searchTerm) ||
              m.phone?.toLowerCase().includes(searchTerm),
          )
        : managers,
    [managers, searchTerm],
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
          <Text style={styles.headerTitle}>Managers Workspace</Text>
          <Text style={styles.headerSubtitle}>
            {managers.length} {managers.length === 1 ? 'manager' : 'managers'} &middot; Owner
          </Text>
        </Animated.View>

        <Pressable
          onPress={openAddModal}
          style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Add manager"
        >
          <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
        </Pressable>
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
            placeholder="Search managers..."
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
        ) : filteredManagers.length === 0 && !searchTerm ? (
          <EmptyState />
        ) : filteredManagers.length === 0 && searchTerm ? (
          <View style={styles.noResults}>
            <MaterialCommunityIcons name="earth-off" size={40} color={Colors.textTertiary} />
            <Text style={styles.noResultsText}>No managers match "{search}"</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              All Managers
              <Text style={styles.sectionCount}> ({filteredManagers.length})</Text>
            </Text>
            <View style={styles.managerList}>
              {filteredManagers.map((manager) => (
                <ManagerCard key={manager._id} manager={manager} onDelete={handleDeleteManager} onPress={openDetailModal} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Manager</Text>
              <Pressable onPress={closeModal} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>Manager Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.name}
                onChangeText={(t) => setAddForm((f) => ({ ...f, name: t }))}
                placeholder="e.g. Alex Rivera"
                placeholderTextColor={Colors.textTertiary}
              />

              <Text style={styles.modalLabel}>Login ID</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.loginId}
                onChangeText={(t) => setAddForm((f) => ({ ...f, loginId: t }))}
                placeholder="e.g. MGR-001"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="characters"
              />

              <Text style={styles.modalLabel}>Phone</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.phone}
                onChangeText={(t) => setAddForm((f) => ({ ...f, phone: t }))}
                placeholder="Phone number"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
              />

              <Text style={styles.modalLabel}>Email</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.email}
                onChangeText={(t) => setAddForm((f) => ({ ...f, email: t }))}
                placeholder="manager@example.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.modalLabel}>Password *</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.password}
                onChangeText={(t) => setAddForm((f) => ({ ...f, password: t }))}
                placeholder="Set initial password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, adding && styles.modalSubmitBtnDisabled]}
                onPress={handleSaveManager}
                disabled={adding}
              >
                <Text style={styles.modalSubmitText}>
                  {adding ? 'Saving...' : 'Create Manager'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={closeDetailModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manager Details</Text>
              <Pressable onPress={closeDetailModal} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {selectedManager && (
              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                <View style={styles.detailAvatarSection}>
                  <View style={styles.detailAvatar}>
                    <Text style={styles.detailAvatarText}>{getInitials(selectedManager.name)}</Text>
                  </View>
                  <Text style={styles.detailName}>{selectedManager.name}</Text>
                  <View style={[styles.detailStatusBadge, { backgroundColor: (statusConfig[selectedManager.status] || statusConfig.active).bg }]}>
                    <Text style={[styles.detailStatusText, { color: (statusConfig[selectedManager.status] || statusConfig.active).color }]}>
                      {selectedManager.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Contact Information</Text>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={18} color={Colors.primary} />
                    <View style={styles.detailRowText}>
                      <Text style={styles.detailRowLabel}>Login ID</Text>
                      <Text style={styles.detailRowValue}>{selectedManager.loginId || 'Not set'}</Text>
                    </View>
                  </View>
                  {selectedManager.phone ? (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="phone-outline" size={18} color={Colors.primary} />
                      <View style={styles.detailRowText}>
                        <Text style={styles.detailRowLabel}>Phone</Text>
                        <Text style={styles.detailRowValue}>{selectedManager.phone}</Text>
                      </View>
                    </View>
                  ) : null}
                  {selectedManager.email ? (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="email-outline" size={18} color={Colors.primary} />
                      <View style={styles.detailRowText}>
                        <Text style={styles.detailRowLabel}>Email</Text>
                        <Text style={styles.detailRowValue}>{selectedManager.email}</Text>
                      </View>
                    </View>
                  ) : null}
                  {selectedManager.createdAt ? (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar-outline" size={18} color={Colors.primary} />
                      <View style={styles.detailRowText}>
                        <Text style={styles.detailRowLabel}>Created</Text>
                        <Text style={styles.detailRowValue}>
                          {new Date(selectedManager.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <Pressable
                  style={styles.detailDeleteBtn}
                  onPress={() => {
                    closeDetailModal();
                    handleDeleteManager(selectedManager);
                  }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.error} />
                  <Text style={styles.detailDeleteText}>Delete Manager</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ManagerCard({ manager, onDelete, onPress }: { manager: Manager; onDelete: (m: Manager) => void; onPress: (m: Manager) => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sc = statusConfig[manager.status] || statusConfig.active;
  const initials = getInitials(manager.name);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, friction: 8, tension: 120, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.managerCard, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(manager)}
        accessibilityRole="button"
        accessibilityLabel={manager.name}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.managerName} numberOfLines={1}>{manager.name}</Text>
            {manager.email ? (
              <Text style={styles.managerEmail} numberOfLines={1}>{manager.email}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => onDelete(manager)}
            hitSlop={8}
            style={styles.cardDeleteBtn}
            accessibilityRole="button"
            accessibilityLabel="Delete manager"
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.error} />
          </Pressable>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusBadgeText, { color: sc.color }]}>
              {manager.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardMetaRow}>
          <MaterialCommunityIcons name="card-account-details-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.cardMetaText}>{manager.loginId || 'No login ID'}</Text>
        </View>
        {manager.phone ? (
          <View style={styles.cardMetaRow}>
            <MaterialCommunityIcons name="phone-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.cardMetaText}>{manager.phone}</Text>
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

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons name="account-tie-outline" size={44} color={Colors.primaryLight} />
      </View>
      <Text style={styles.emptyTitle}>No Managers Yet</Text>
      <Text style={styles.emptyText}>
        Add managers to help you run property operations. Managers can handle rooms, beds, tenants, and submit reports.
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

  managerList: {
    paddingHorizontal: Spacing.lg,
    gap: 16,
  },

  managerCard: {
    width: CARD_WIDTH,
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

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  avatarText: {
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  cardInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  managerEmail: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  cardDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorBg,
  },
  statusBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.3,
  },

  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginVertical: Spacing.sm,
  },

  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  cardMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
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
    width: CARD_WIDTH,
    height: 140,
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

  // ── Detail View ────────────────────────────────────────────────────────
  detailAvatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.md,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 8, height: 10 },
    elevation: 5,
  },
  detailAvatarText: {
    fontSize: FontSize['2xl'],
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  detailName: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  detailStatusBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    marginTop: Spacing.sm,
  },
  detailStatusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.5,
  },
  detailSection: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  detailSectionTitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  detailRowText: {
    flex: 1,
  },
  detailRowLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
  },
  detailRowValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    marginTop: 1,
  },
  detailDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.12)',
  },
  detailDeleteText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: FontWeight.bold,
  },
});
