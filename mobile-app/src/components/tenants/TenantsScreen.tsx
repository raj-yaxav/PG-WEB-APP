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

interface Tenant {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  rentAmount?: number;
  securityDeposit?: number;
  status: string;
  roomId?: { _id: string; roomNumber: string };
  bedId?: { _id: string; bedNumber: string };
  propertyId?: { _id: string; name: string };
  loginId?: string;
  createdAt?: string;
}

interface Property {
  _id: string;
  name: string;
  city?: string;
}

interface Room {
  _id: string;
  roomNumber: string;
  floor?: string;
  propertyId?: string | { _id: string };
}

interface Bed {
  _id: string;
  bedNumber: string;
  propertyId?: string | { _id: string };
  roomId?: string | { _id: string; roomNumber?: string };
  status: string;
  tenantId?: { _id: string; name?: string; phone?: string } | string | null;
}

interface TenantsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  role: User['role'];
}

const formatMoney = (amount = 0) => `Rs ${amount.toLocaleString('en-IN')}`;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

const statusConfig: Record<string, { color: string; bg: string }> = {
  active: { color: '#16A34A', bg: '#DCFCE7' },
  left: { color: '#70819C', bg: '#E4EEFC' },
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

function getEntityId(value?: string | { _id?: string } | null) {
  return typeof value === 'string' ? value : value?._id || '';
}

function getBedOccupantName(bed: Bed) {
  return typeof bed.tenantId === 'object' && bed.tenantId ? bed.tenantId.name || 'Assigned tenant' : 'Assigned tenant';
}

export function TenantsScreen({ onBack, onLogout, role }: TenantsScreenProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', phone: '', email: '', propertyId: '', rentAmount: '',
    securityDeposit: '', loginId: '', password: '', roomId: '', bedId: '',
  });
  const [adding, setAdding] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [showBedPicker, setShowBedPicker] = useState(false);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(titleTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadTenants = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError('');
      const data = await workspaceApi.tenants.list();
      setTenants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTenants(false);
  }, [loadTenants]);

  const openAddModal = useCallback(async () => {
    setAddForm({ name: '', phone: '', email: '', propertyId: '', rentAmount: '', securityDeposit: '', loginId: '', password: '', roomId: '', bedId: '' });
    setShowAddModal(true);
    try {
      const data = await workspaceApi.properties.list();
      const list = Array.isArray(data) ? data : data?.properties || [];
      setProperties(list);
    } catch { /* ignore */ }
    try {
      const data = await workspaceApi.rooms.list();
      setRooms(Array.isArray(data) ? data : data?.rooms || []);
    } catch { /* ignore */ }
    try {
      const data = await workspaceApi.beds.list();
      setBeds(Array.isArray(data) ? data : data?.beds || []);
    } catch { /* ignore */ }
  }, [loadTenants]);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setAddForm({ name: '', phone: '', email: '', propertyId: '', rentAmount: '', securityDeposit: '', loginId: '', password: '', roomId: '', bedId: '' });
  }, []);

  const handleSaveTenant = useCallback(async () => {
    const { name, phone, email, propertyId, rentAmount, securityDeposit, loginId, password, roomId, bedId } = addForm;
    if (!name.trim() || !propertyId || !rentAmount || !phone.trim() || !email.trim() || !securityDeposit.trim() || !loginId.trim() || !password || !bedId) {
      Alert.alert('Required', 'All fields are required');
      return;
    }
    if (beds.filter((b) => getEntityId(b.propertyId) === propertyId).length === 0) {
      Alert.alert('No beds', 'This property has no beds. Add rooms and beds before adding a tenant.');
      return;
    }
    const selectedBed = beds.find((b) => b._id === bedId);
    if (!selectedBed || selectedBed.status !== 'vacant' || selectedBed.tenantId) {
      Alert.alert('Bed not vacant', selectedBed?.tenantId ? `Bed ${selectedBed.bedNumber} is assigned to ${getBedOccupantName(selectedBed)}` : 'Please select a vacant bed.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }
    setAdding(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        propertyId: propertyId.trim(),
        rentAmount: Number(rentAmount),
        securityDeposit: Number(securityDeposit),
        loginId: loginId.trim(),
        password,
      };
      payload.bedId = bedId;
      const result = await workspaceApi.tenants.create(payload);
      await loadTenants(false);
      closeModal();
      const credentials = result?.accountCredentials;
      if (credentials?.loginId) {
        Alert.alert('Tenant created', `Tenant ID: ${credentials.loginId}\nPassword: ${credentials.password}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add tenant');
    } finally {
      setAdding(false);
    }
  }, [addForm, beds, closeModal, loadTenants]);

  const handleMarkLeft = useCallback((tenant: Tenant) => {
    Alert.alert(
      'Mark as Left',
      `Mark ${tenant.name} as left? This will vacate their bed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Left',
          style: 'destructive',
          onPress: async () => {
            try {
              await workspaceApi.tenants.markLeft(tenant._id);
              await loadTenants(false);
              setSelectedTenant((prev) => prev?._id === tenant._id ? { ...prev, status: 'left', roomId: undefined, bedId: undefined } : null);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to update tenant');
            }
          },
        },
      ],
    );
  }, [loadTenants]);

  const handleRestore = useCallback((tenant: Tenant) => {
    Alert.alert(
      'Restore Tenant',
      `Restore ${tenant.name} to active status? The tenant will need a bed reassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await workspaceApi.tenants.update(tenant._id, { status: 'active' });
              await loadTenants(false);
              setSelectedTenant((prev) => prev?._id === tenant._id ? { ...prev, status: 'active' } : null);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to restore tenant');
            }
          },
        },
      ],
    );
  }, [loadTenants]);

  const handleDeleteTenant = useCallback((tenant: Tenant) => {
    Alert.alert(
      'Delete Tenant',
      `Delete ${tenant.name}? This permanently removes the tenant record.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await workspaceApi.tenants.delete(tenant._id);
              setTenants((prev) => prev.filter((t) => t._id !== tenant._id));
              setShowDetailModal(false);
              setSelectedTenant(null);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete tenant');
            }
          },
        },
      ],
    );
  }, []);

  const [reassignBedId, setReassignBedId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const handleAssignBed = useCallback(async () => {
    if (!selectedTenant || !reassignBedId) return;
    setAssigning(true);
    try {
      await workspaceApi.tenants.assignBed(selectedTenant._id, reassignBedId);
      await loadTenants(false);
      const pickedBed = beds.find((bed) => bed._id === reassignBedId);
      setSelectedTenant((prev) => prev ? {
        ...prev,
        roomId: pickedBed?.roomId && typeof pickedBed.roomId === 'object' ? { _id: pickedBed.roomId._id, roomNumber: pickedBed.roomId.roomNumber || '' } : prev.roomId,
        bedId: pickedBed ? { _id: pickedBed._id, bedNumber: pickedBed.bedNumber } : prev.bedId,
      } : null);
      setReassignBedId('');
      Alert.alert('Done', 'Bed assigned successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to assign bed');
    } finally {
      setAssigning(false);
    }
  }, [beds, loadTenants, selectedTenant, reassignBedId]);

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedTenant(null);
  }, []);

  const openDetailModal = useCallback(async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setReassignBedId('');
    setShowDetailModal(true);
    try {
      const data = await workspaceApi.beds.list();
      setBeds(Array.isArray(data) ? data : data?.beds || []);
    } catch { /* ignore */ }
  }, []);

  const searchTerm = search.trim().toLowerCase();
  const filteredTenants = useMemo(
    () =>
      searchTerm
        ? tenants.filter(
            (t) =>
              t.name?.toLowerCase().includes(searchTerm) ||
              t.phone?.toLowerCase().includes(searchTerm) ||
              t.propertyId?.name?.toLowerCase().includes(searchTerm) ||
              t.roomId?.roomNumber?.toLowerCase().includes(searchTerm),
          )
        : tenants,
    [tenants, searchTerm],
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
          <Text style={styles.headerTitle}>Tenants Workspace</Text>
          <Text style={styles.headerSubtitle}>
            {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'} &middot; {role === 'owner' ? 'Owner' : 'Manager'}
          </Text>
        </Animated.View>

        <Pressable
          onPress={openAddModal}
          style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Add tenant"
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
            placeholder="Search tenants..."
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
        ) : filteredTenants.length === 0 && !searchTerm ? (
          <EmptyState role={role} />
        ) : filteredTenants.length === 0 && searchTerm ? (
          <View style={styles.noResults}>
            <MaterialCommunityIcons name="earth-off" size={40} color={Colors.textTertiary} />
            <Text style={styles.noResultsText}>No tenants match "{search}"</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              Current Tenants
              <Text style={styles.sectionCount}> ({filteredTenants.length})</Text>
            </Text>
            <View style={styles.tenantList}>
              {filteredTenants.map((tenant) => (
                <TenantCard
                  key={tenant._id}
                  tenant={tenant}
                  role={role}
                  onPress={openDetailModal}
                  onMarkLeft={handleMarkLeft}
                  onRestore={handleRestore}
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
              <Text style={styles.modalTitle}>Add Tenant</Text>
              <Pressable onPress={closeModal} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>Tenant Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.name}
                onChangeText={(t) => setAddForm((f) => ({ ...f, name: t }))}
                placeholder="e.g. Amit Sharma"
                placeholderTextColor={Colors.textTertiary}
              />

              <Text style={styles.modalLabel}>Property *</Text>
              <Pressable
                style={styles.modalInputRow}
                onPress={() => setShowPropertyPicker((p) => !p)}
              >
                <Text style={[styles.modalInputText, !addForm.propertyId && { color: Colors.textTertiary }]}>
                  {addForm.propertyId
                    ? properties.find((p) => p._id === addForm.propertyId)?.name || addForm.propertyId
                    : 'Select property'}
                </Text>
                <MaterialCommunityIcons
                  name={showPropertyPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </Pressable>
              {showPropertyPicker && (
                <View style={styles.pickerDropdown}>
                  {properties.length === 0 ? (
                    <Text style={styles.pickerEmpty}>No properties found</Text>
                  ) : (
                    properties.map((p) => (
                      <Pressable
                        key={p._id}
                        style={[styles.pickerOption, addForm.propertyId === p._id && styles.pickerOptionActive]}
                        onPress={() => {
                          setAddForm((f) => ({ ...f, propertyId: p._id, roomId: '', bedId: '' }));
                          setShowPropertyPicker(false);
                        }}
                      >
                        <Text style={[styles.pickerOptionText, addForm.propertyId === p._id && styles.pickerOptionTextActive]}>
                          {p.name}
                        </Text>
                        {p.city ? <Text style={styles.pickerSub}>{p.city}</Text> : null}
                      </Pressable>
                    ))
                  )}
                </View>
              )}

              <Text style={styles.modalLabel}>Room</Text>
              <Pressable style={styles.modalInputRow} onPress={() => setShowRoomPicker((p) => !p)}>
                <Text style={[styles.modalInputText, !addForm.roomId && { color: Colors.textTertiary }]}>
                  {addForm.roomId
                    ? `Room ${rooms.find((r) => r._id === addForm.roomId)?.roomNumber || ''}`
                    : 'Select room (optional)'}
                </Text>
                <MaterialCommunityIcons name={showRoomPicker ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
              </Pressable>
              {showRoomPicker && (
                <View style={styles.pickerDropdown}>
                  {rooms.filter((r) => !addForm.propertyId || getEntityId(r.propertyId) === addForm.propertyId).length === 0 ? (
                    <Text style={styles.pickerEmpty}>No rooms available</Text>
                  ) : (
                    rooms.filter((r) => !addForm.propertyId || getEntityId(r.propertyId) === addForm.propertyId).map((r) => (
                      <Pressable key={r._id} style={[styles.pickerOption, addForm.roomId === r._id && styles.pickerOptionActive]}
                        onPress={() => { setAddForm((f) => ({ ...f, roomId: r._id, bedId: '' })); setShowRoomPicker(false); }}>
                        <Text style={[styles.pickerOptionText, addForm.roomId === r._id && styles.pickerOptionTextActive]}>
                          Room {r.roomNumber}{r.floor ? ` · Floor ${r.floor}` : ''}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              )}

              <Text style={styles.modalLabel}>Bed</Text>
              <Pressable style={styles.modalInputRow} onPress={() => {
                if (!addForm.roomId) { Alert.alert('Select Room', 'Pick a room first'); return; }
                setShowBedPicker((p) => !p);
              }}>
                <Text style={[styles.modalInputText, !addForm.bedId && { color: Colors.textTertiary }]}>
                  {addForm.bedId
                    ? `Bed ${beds.find((b) => b._id === addForm.bedId)?.bedNumber || ''}`
                    : 'Select vacant bed'}
                </Text>
                <MaterialCommunityIcons name={showBedPicker ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
              </Pressable>
              {showBedPicker && (
                <View style={styles.pickerDropdown}>
                  {beds.filter((b) => {
                    const bedRoomId = typeof b.roomId === 'string' ? b.roomId : b.roomId?._id || '';
                    return bedRoomId === addForm.roomId;
                  }).length === 0 ? (
                    <Text style={styles.pickerEmpty}>No beds for this room</Text>
                  ) : (
                    beds.filter((b) => {
                      const bedRoomId = typeof b.roomId === 'string' ? b.roomId : b.roomId?._id || '';
                      return bedRoomId === addForm.roomId;
                    }).map((b) => (
                      <Pressable key={b._id} style={[styles.pickerOption, addForm.bedId === b._id && styles.pickerOptionActive, (b.status !== 'vacant' || b.tenantId) && styles.pickerOptionDisabled]}
                        onPress={() => {
                          if (b.status !== 'vacant' || b.tenantId) {
                            Alert.alert('Bed not vacant', b.tenantId ? `Bed ${b.bedNumber} is assigned to ${getBedOccupantName(b)}` : `Bed ${b.bedNumber} is ${b.status}`);
                            return;
                          }
                          setAddForm((f) => ({ ...f, bedId: b._id }));
                          setShowBedPicker(false);
                        }}>
                        <Text style={[styles.pickerOptionText, addForm.bedId === b._id && styles.pickerOptionTextActive]}>
                          Bed {b.bedNumber} · {b.status}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              )}

              <Text style={styles.modalLabel}>Rent Amount *</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.rentAmount}
                onChangeText={(t) => setAddForm((f) => ({ ...f, rentAmount: t }))}
                placeholder="e.g. 7500"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numeric"
              />

              <Text style={styles.modalLabel}>Phone *</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.phone}
                onChangeText={(t) => setAddForm((f) => ({ ...f, phone: t }))}
                placeholder="Phone number"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
              />

              <Text style={styles.modalLabel}>Email *</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.email}
                onChangeText={(t) => setAddForm((f) => ({ ...f, email: t }))}
                placeholder="tenant@example.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.modalLabel}>Security Deposit *</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.securityDeposit}
                onChangeText={(t) => setAddForm((f) => ({ ...f, securityDeposit: t }))}
                placeholder="e.g. 15000"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numeric"
              />

              <Text style={styles.modalLabel}>Login ID *</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.loginId}
                onChangeText={(t) => setAddForm((f) => ({ ...f, loginId: t }))}
                placeholder="Tenant login ID"
                placeholderTextColor={Colors.textTertiary}
              />

              <Text style={styles.modalLabel}>Password *</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.password}
                onChangeText={(t) => setAddForm((f) => ({ ...f, password: t }))}
                placeholder="Provide initial password"
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
                onPress={handleSaveTenant}
                disabled={adding}
              >
                <Text style={styles.modalSubmitText}>
                  {adding ? 'Saving...' : 'Add Tenant'}
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
              <Text style={styles.modalTitle}>Tenant Details</Text>
              <Pressable onPress={closeDetailModal} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {selectedTenant && (
              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                <View style={styles.detailAvatarSection}>
                  <View style={styles.detailAvatar}>
                    <Text style={styles.detailAvatarText}>{getInitials(selectedTenant.name)}</Text>
                  </View>
                  <Text style={styles.detailName}>{selectedTenant.name}</Text>
                  <View style={[styles.detailStatusBadge, { backgroundColor: (statusConfig[selectedTenant.status] || statusConfig.active).bg }]}>
                    <Text style={[styles.detailStatusText, { color: (statusConfig[selectedTenant.status] || statusConfig.active).color }]}>
                      {selectedTenant.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Tenant Information</Text>
                  {selectedTenant.phone ? (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="phone-outline" size={18} color={Colors.primary} />
                      <View style={styles.detailRowText}>
                        <Text style={styles.detailRowLabel}>Phone</Text>
                        <Text style={styles.detailRowValue}>{selectedTenant.phone}</Text>
                      </View>
                    </View>
                  ) : null}
                  {selectedTenant.email ? (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="email-outline" size={18} color={Colors.primary} />
                      <View style={styles.detailRowText}>
                        <Text style={styles.detailRowLabel}>Email</Text>
                        <Text style={styles.detailRowValue}>{selectedTenant.email}</Text>
                      </View>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="currency-inr" size={18} color={Colors.primary} />
                    <View style={styles.detailRowText}>
                      <Text style={styles.detailRowLabel}>Rent Amount</Text>
                      <Text style={styles.detailRowValue}>{formatMoney(selectedTenant.rentAmount)}</Text>
                    </View>
                  </View>
                  {selectedTenant.securityDeposit ? (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="shield-check-outline" size={18} color={Colors.primary} />
                      <View style={styles.detailRowText}>
                        <Text style={styles.detailRowLabel}>Security Deposit</Text>
                        <Text style={styles.detailRowValue}>{formatMoney(selectedTenant.securityDeposit)}</Text>
                      </View>
                    </View>
                  ) : null}
                  {selectedTenant.propertyId?.name ? (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="office-building-outline" size={18} color={Colors.primary} />
                      <View style={styles.detailRowText}>
                        <Text style={styles.detailRowLabel}>Property</Text>
                        <Text style={styles.detailRowValue}>{selectedTenant.propertyId.name}</Text>
                      </View>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="bed-outline" size={18} color={Colors.primary} />
                    <View style={styles.detailRowText}>
                      <Text style={styles.detailRowLabel}>Room / Bed</Text>
                      <Text style={styles.detailRowValue}>
                        {selectedTenant.roomId?.roomNumber ? `Room ${selectedTenant.roomId.roomNumber}` : 'No room'}
                        {' / '}
                        {selectedTenant.bedId?.bedNumber ? `Bed ${selectedTenant.bedId.bedNumber}` : 'No bed'}
                      </Text>
                    </View>
                  </View>
                  {selectedTenant.loginId ? (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="card-account-details-outline" size={18} color={Colors.primary} />
                      <View style={styles.detailRowText}>
                        <Text style={styles.detailRowLabel}>Login ID</Text>
                        <Text style={styles.detailRowValue}>{selectedTenant.loginId}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {role !== 'tenant' ? (
                  selectedTenant.status !== 'left' ? (
                    <Pressable
                      style={styles.detailMarkLeftBtn}
                      onPress={() => {
                        closeDetailModal();
                        handleMarkLeft(selectedTenant);
                      }}
                    >
                      <MaterialCommunityIcons name="exit-run" size={18} color={Colors.warning} />
                      <Text style={styles.detailMarkLeftText}>Mark as Left</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={styles.detailRestoreBtn}
                      onPress={() => {
                        closeDetailModal();
                        handleRestore(selectedTenant);
                      }}
                    >
                      <MaterialCommunityIcons name="restore" size={18} color={Colors.primary} />
                      <Text style={styles.detailRestoreText}>Restore to Active</Text>
                    </Pressable>
                  )
                ) : null}

                {selectedTenant.status !== 'left' && role !== 'tenant' ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Reassign Bed</Text>
                    <View style={styles.pickerInlineRow}>
                      <Pressable
                        style={[styles.pickerInlineSelect, !reassignBedId && { flex: 1 }]}
                        onPress={() => {
                          const tenantPropertyId = getEntityId(selectedTenant.propertyId);
                          const available = beds.filter(
                            (b) => b.status === 'vacant' && !b.tenantId && (!tenantPropertyId || getEntityId(b.propertyId) === tenantPropertyId)
                          );
                          if (available.length === 0) {
                            Alert.alert('No beds', 'No vacant beds available for this tenant property');
                            return;
                          }
                          Alert.alert('Select Bed', '', [
                            ...available.map((b) => ({
                              text: `Bed ${b.bedNumber} (${b.status})`,
                              onPress: () => setReassignBedId(b._id),
                            })),
                            { text: 'Cancel', style: 'cancel' },
                          ]);
                        }}
                      >
                        <Text style={[styles.pickerInlineText, !reassignBedId && { color: Colors.textTertiary }]}>
                          {reassignBedId
                            ? `Bed ${beds.find((b) => b._id === reassignBedId)?.bedNumber || ''}`
                            : 'Choose bed'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={18} color={Colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        style={[styles.assignBtn, !reassignBedId && { opacity: 0.5 }]}
                        onPress={handleAssignBed}
                        disabled={!reassignBedId || assigning}
                      >
                        <Text style={styles.assignBtnText}>{assigning ? '...' : 'Assign'}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {role !== 'tenant' ? (
                  <Pressable
                    style={styles.detailDeleteBtn}
                    onPress={() => handleDeleteTenant(selectedTenant)}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.error} />
                    <Text style={styles.detailDeleteText}>Delete Tenant</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function TenantCard({
  tenant, role, onPress, onMarkLeft, onRestore,
}: {
  tenant: Tenant; role: User['role']; onPress: (t: Tenant) => void; onMarkLeft: (t: Tenant) => void; onRestore: (t: Tenant) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sc = statusConfig[tenant.status] || statusConfig.active;
  const initials = getInitials(tenant.name);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, friction: 8, tension: 120, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.tenantCard, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(tenant)}
        accessibilityRole="button"
        accessibilityLabel={tenant.name}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.tenantName} numberOfLines={1}>{tenant.name}</Text>
            {tenant.phone ? (
              <View style={styles.phoneRow}>
                <MaterialCommunityIcons name="phone-outline" size={12} color={Colors.textTertiary} />
                <Text style={styles.tenantPhone}>{tenant.phone}</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusBadgeText, { color: sc.color }]}>
              {tenant.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardMetaRow}>
          <MaterialCommunityIcons name="office-building-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {tenant.propertyId?.name || 'No property'}
          </Text>
        </View>
        <View style={styles.cardMetaRow}>
          <MaterialCommunityIcons name="bed-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.cardMetaText}>
            {tenant.roomId?.roomNumber ? `Room ${tenant.roomId.roomNumber}` : 'No room'}
            {' / '}
            {tenant.bedId?.bedNumber ? `Bed ${tenant.bedId.bedNumber}` : 'No bed'}
          </Text>
        </View>
        <View style={styles.cardMetaRow}>
          <MaterialCommunityIcons name="currency-inr" size={14} color={Colors.textTertiary} />
          <Text style={styles.cardMetaText}>{formatMoney(tenant.rentAmount)} / month</Text>
        </View>

        {role !== 'tenant' ? (
          tenant.status !== 'left' ? (
            <Pressable
              style={styles.markLeftBtn}
              onPress={() => onMarkLeft(tenant)}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="exit-run" size={14} color={Colors.warning} />
              <Text style={styles.markLeftText}>Mark Left</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.restoreBtn}
              onPress={() => onRestore(tenant)}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="restore" size={14} color={Colors.primary} />
              <Text style={styles.restoreText}>Restore</Text>
            </Pressable>
          )
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
        <MaterialCommunityIcons name="account-group-outline" size={44} color={Colors.primaryLight} />
      </View>
      <Text style={styles.emptyTitle}>No Tenants Yet</Text>
      <Text style={styles.emptyText}>
        {role === 'tenant'
          ? 'You are not assigned to any property yet.'
          : 'Add tenants to start managing room assignments and rent collections.'}
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

  tenantList: {
    paddingHorizontal: Spacing.lg,
    gap: 16,
  },

  tenantCard: {
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
  tenantName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tenantPhone: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
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

  markLeftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.12)',
  },
  markLeftText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: FontWeight.bold,
  },

  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.12)',
  },
  restoreText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
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
    height: 160,
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
  modalInputRow: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalInputText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  pickerDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
    overflow: 'hidden',
    marginTop: 2,
  },
  pickerOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerOptionActive: {
    backgroundColor: Colors.primaryBg,
  },
  pickerOptionDisabled: {
    backgroundColor: Colors.clayInset,
    opacity: 0.72,
  },
  pickerOptionText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  pickerOptionTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  pickerSub: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  pickerEmpty: {
    padding: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
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
  detailMarkLeftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.12)',
  },
  detailMarkLeftText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    fontWeight: FontWeight.bold,
  },
  detailRestoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.12)',
  },
  detailRestoreText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  pickerInlineRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  pickerInlineSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderInput,
  },
  pickerInlineText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  assignBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
  },
  assignBtnText: {
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  detailDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
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
