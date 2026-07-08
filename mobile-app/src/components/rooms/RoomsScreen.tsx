import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  LayoutAnimation,
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

interface RoomData {
  _id: string;
  roomNumber: string;
  floor?: string;
  roomType?: string;
  rentPerBed?: number;
  facilities?: string[];
  beds?: BedData[];
  propertyId?: string;
}

interface BedData {
  _id: string;
  bedNumber: string;
  status: 'vacant' | 'occupied' | 'booked' | 'maintenance';
  tenantId?: { _id?: string; name?: string; phone?: string } | string | null;
}

interface RoomsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  role: User['role'];
}

const bedStatusLabel: Record<string, string> = {
  vacant: 'VACANT',
  occupied: 'OCCUPIED',
  booked: 'BOOKED',
  maintenance: 'MAINT',
};

function getTenantIdFromBed(bed?: BedData | null) {
  if (!bed?.tenantId) return '';
  return typeof bed.tenantId === 'string' ? bed.tenantId : bed.tenantId._id || '';
}

function getTenantNameFromBed(bed?: BedData | null) {
  return typeof bed?.tenantId === 'object' && bed.tenantId ? bed.tenantId.name || '' : '';
}

function getRoomPropertyId(room?: RoomData) {
  if (!room?.propertyId) return '';
  return typeof room.propertyId === 'string' ? room.propertyId : (room.propertyId as any)._id || '';
}

interface Property {
  _id: string;
  name: string;
  city?: string;
}

export function RoomsScreen({ onBack }: RoomsScreenProps) {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddBed, setShowAddBed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [roomForm, setRoomForm] = useState({
    propertyId: '',
    roomNumber: '',
    floor: '',
    roomType: 'single',
    rentPerBed: '',
  });

  const [bedForm, setBedForm] = useState({
    propertyId: '',
    roomId: '',
    bedNumber: '',
  });

  const roomTypes = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'triple', label: 'Triple' },
    { value: 'four_sharing', label: '4 Sharing' },
  ];

  // ── Room edit / delete ──────────────────────────────────────
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [roomEditForm, setRoomEditForm] = useState({ roomNumber: '', floor: '', roomType: 'single', rentPerBed: '' });
  const [saving, setSaving] = useState(false);

  const openRoomEdit = useCallback((room: RoomData) => {
    setEditingRoom(room);
    setRoomEditForm({
      roomNumber: room.roomNumber || '',
      floor: room.floor || '',
      roomType: room.roomType || 'single',
      rentPerBed: room.rentPerBed ? String(room.rentPerBed) : '',
    });
  }, []);

  const handleUpdateRoom = useCallback(async () => {
    if (!editingRoom) return;
    if (!roomEditForm.roomNumber.trim() || !roomEditForm.rentPerBed) {
      Alert.alert('Required', 'Room number and rent per bed are required');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { roomNumber: roomEditForm.roomNumber.trim() };
      if (roomEditForm.floor.trim()) payload.floor = roomEditForm.floor.trim();
      if (roomEditForm.roomType) payload.roomType = roomEditForm.roomType;
      payload.rentPerBed = Number(roomEditForm.rentPerBed);
      await workspaceApi.rooms.update(editingRoom._id, payload);
      setRooms((prev) => prev.map((r) => r._id === editingRoom._id ? { ...r, ...payload } : r));
      setEditingRoom(null);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update room');
    } finally {
      setSaving(false);
    }
  }, [editingRoom, roomEditForm]);

  const handleDeleteRoom = useCallback((room: RoomData) => {
    if (room.beds && room.beds.length > 0) {
      Alert.alert('Cannot Delete', 'Remove all beds from this room first');
      return;
    }
    Alert.alert('Delete Room', `Delete Room ${room.roomNumber}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await workspaceApi.rooms.delete(room._id);
            setRooms((prev) => prev.filter((r) => r._id !== room._id));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete room');
          }
        },
      },
    ]);
  }, []);

  // ── Bed edit / delete ────────────────────────────────────────
  const [editingBed, setEditingBed] = useState<BedData | null>(null);
  const [editingBedRoomId, setEditingBedRoomId] = useState('');
  const [bedEditForm, setBedEditForm] = useState({ bedNumber: '', status: 'vacant' as string });
  const [transferBedId, setTransferBedId] = useState('');
  const [showTransferPicker, setShowTransferPicker] = useState(false);

  const openBedEdit = useCallback((bed: BedData, roomId: string) => {
    setEditingBed(bed);
    setEditingBedRoomId(roomId);
    setBedEditForm({ bedNumber: bed.bedNumber || '', status: bed.status || 'vacant' });
    setTransferBedId('');
    setShowTransferPicker(false);
  }, []);

  const handleUpdateBed = useCallback(async () => {
    if (!editingBed) return;
    if (!bedEditForm.bedNumber.trim()) {
      Alert.alert('Required', 'Bed number is required');
      return;
    }
    if (editingBed.tenantId && editingBed.status === 'occupied' && bedEditForm.status === 'vacant') {
      Alert.alert('Change Bed Instead', 'This bed has a tenant assigned. Select a vacant bed in Change Tenant Bed below.');
      return;
    }
    setSaving(true);
    try {
      await workspaceApi.beds.update(editingBed._id, { bedNumber: bedEditForm.bedNumber.trim() });
      if (bedEditForm.status !== editingBed.status) {
        await workspaceApi.beds.updateStatus(editingBed._id, bedEditForm.status);
      }
      setRooms((prev) => prev.map((r) => {
        if (r._id !== editingBedRoomId) return r;
        return {
          ...r,
          beds: (r.beds || []).map((b) => b._id === editingBed._id
            ? { ...b, bedNumber: bedEditForm.bedNumber.trim(), status: bedEditForm.status as BedData['status'] }
            : b
          ),
        };
      }));
      setEditingBed(null);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update bed');
    } finally {
      setSaving(false);
    }
  }, [editingBed, editingBedRoomId, bedEditForm]);

  const handleDeleteBed = useCallback((bed: BedData, roomId: string) => {
    const occupantName = typeof bed.tenantId === 'object' && bed.tenantId ? bed.tenantId.name : '';
    if (bed.tenantId) {
      Alert.alert('Cannot Delete Bed', `Bed ${bed.bedNumber} is assigned to ${occupantName || 'a tenant'}. Remove the tenant assignment first.`);
      return;
    }
    if (bed.status !== 'vacant') {
      Alert.alert('Cannot Delete Bed', `Only vacant beds can be deleted. Bed ${bed.bedNumber} is currently ${bed.status}.`);
      return;
    }

    Alert.alert('Delete Bed', `Delete Bed ${bed.bedNumber}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await workspaceApi.beds.delete(bed._id);
            setRooms((prev) => prev.map((r) => r._id === roomId
              ? { ...r, beds: (r.beds || []).filter((b) => b._id !== bed._id) }
              : r
            ));
            setEditingBed(null);
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete bed');
          }
        },
      },
    ]);
  }, []);

  const handleChangeTenantBed = useCallback(async () => {
    if (!editingBed) return;
    const tenantId = getTenantIdFromBed(editingBed);
    const tenantName = getTenantNameFromBed(editingBed);

    if (!tenantId) {
      Alert.alert('Tenant Missing', 'This bed does not include tenant details. Refresh the rooms list and try again.');
      return;
    }
    if (!transferBedId) {
      Alert.alert('Select Bed', 'Choose a vacant bed for this tenant.');
      return;
    }

    const targetBed = rooms.flatMap((room) => room.beds || []).find((bed) => bed._id === transferBedId);
    if (!targetBed || targetBed.status !== 'vacant' || targetBed.tenantId) {
      Alert.alert('Invalid Bed', 'Select a vacant unassigned bed.');
      return;
    }

    setSaving(true);
    try {
      await workspaceApi.tenants.assignBed(tenantId, transferBedId);
      setRooms((prev) => prev.map((room) => ({
        ...room,
        beds: (room.beds || []).map((bed) => {
          if (bed._id === editingBed._id) return { ...bed, status: 'vacant', tenantId: null };
          if (bed._id === transferBedId) return { ...bed, status: 'occupied', tenantId: typeof editingBed.tenantId === 'object' ? editingBed.tenantId : { _id: tenantId, name: tenantName } };
          return bed;
        }),
      })));
      Alert.alert('Bed Changed', `${tenantName || 'Tenant'} moved to the selected bed.`);
      setEditingBed(null);
      setTransferBedId('');
      setShowTransferPicker(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to change tenant bed');
    } finally {
      setSaving(false);
    }
  }, [editingBed, rooms, transferBedId]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadProperties = useCallback(async () => {
    try {
      const data = await workspaceApi.properties.list();
      setProperties(Array.isArray(data) ? data : data?.properties || []);
    } catch { /* ignore */ }
  }, []);

  const resetRoomForm = () => setRoomForm({ propertyId: '', roomNumber: '', floor: '', roomType: 'single', rentPerBed: '' });
  const resetBedForm = () => setBedForm({ propertyId: '', roomId: '', bedNumber: '' });

  const openAddRoom = useCallback(() => {
    resetRoomForm();
    loadProperties();
    setShowAddRoom(true);
  }, [loadProperties]);

  const openAddBed = useCallback(() => {
    resetBedForm();
    loadProperties();
    setShowAddBed(true);
  }, [loadProperties]);

  const handleCreateRoom = useCallback(async () => {
    if (!roomForm.propertyId || !roomForm.roomNumber.trim() || !roomForm.rentPerBed) {
      Alert.alert('Required', 'Property, room number, and rent per bed are required');
      return;
    }
    if (rooms.some((r) => {
      const pid = typeof r.propertyId === 'object' && r.propertyId ? (r.propertyId as any)._id || '' : r.propertyId || '';
      return pid === roomForm.propertyId && r.roomNumber === roomForm.roomNumber.trim();
    })) {
      Alert.alert('Duplicate', `Room ${roomForm.roomNumber.trim()} already exists in this property`);
      return;
    }
    setCreating(true);
    try {
      const payload = {
        propertyId: roomForm.propertyId,
        roomNumber: roomForm.roomNumber.trim(),
        floor: roomForm.floor.trim() || undefined,
        roomType: roomForm.roomType,
        rentPerBed: Number(roomForm.rentPerBed),
        status: 'active',
      };
      const result = await workspaceApi.rooms.create(payload);
      setRooms((prev) => [result.room || result, ...prev]);
      setShowAddRoom(false);
      resetRoomForm();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  }, [roomForm]);

  const handleCreateBed = useCallback(async () => {
    if (!bedForm.roomId || !bedForm.bedNumber.trim()) {
      Alert.alert('Required', 'Room and bed number are required');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        propertyId: bedForm.propertyId || undefined,
        roomId: bedForm.roomId,
        bedNumber: bedForm.bedNumber.trim(),
      };
      const result = await workspaceApi.beds.create(payload);
      const newBed = result.bed || result;
      setRooms((prev) => prev.map((r) =>
        r._id === bedForm.roomId ? { ...r, beds: [...(r.beds || []), newBed] } : r
      ));
      setShowAddBed(false);
      resetBedForm();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add bed');
    } finally {
      setCreating(false);
    }
  }, [bedForm]);

  const loadRooms = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError('');
      const [roomsData, propsData] = await Promise.all([
        workspaceApi.rooms.list(),
        workspaceApi.properties.list(),
      ]);
      const roomsList: RoomData[] = roomsData?.rooms || roomsData || [];
      setRooms(roomsList);
      setProperties(Array.isArray(propsData) ? propsData : propsData?.properties || []);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (err: any) {
      setError(err?.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRooms(false);
  }, [loadRooms]);

  const stats = {
    total: rooms.length,
    totalBeds: rooms.reduce((s, r) => s + (r.beds?.length || 0), 0),
    vacant: rooms.reduce((s, r) => s + (r.beds?.filter(b => b.status === 'vacant').length || 0), 0),
    occupied: rooms.reduce((s, r) => s + (r.beds?.filter(b => b.status === 'occupied').length || 0), 0),
  };

  const filteredRooms = selectedPropertyId
    ? rooms.filter((r) => r._id.startsWith(selectedPropertyId.slice(-6)) || r.propertyId === selectedPropertyId)
    : rooms;

  const filteredStats = {
    total: filteredRooms.length,
    totalBeds: filteredRooms.reduce((s, r) => s + (r.beds?.length || 0), 0),
    vacant: filteredRooms.reduce((s, r) => s + (r.beds?.filter(b => b.status === 'vacant').length || 0), 0),
    occupied: filteredRooms.reduce((s, r) => s + (r.beds?.filter(b => b.status === 'occupied').length || 0), 0),
  };

  const displayStats = selectedPropertyId ? filteredStats : stats;
  const editingBedRoom = rooms.find((room) => room._id === editingBedRoomId);
  const editingBedPropertyId = getRoomPropertyId(editingBedRoom);
  const transferBedOptions = rooms.flatMap((room) =>
    (room.beds || [])
      .filter((bed) => bed._id !== editingBed?._id && bed.status === 'vacant' && !bed.tenantId)
      .filter(() => !editingBedPropertyId || getRoomPropertyId(room) === editingBedPropertyId)
      .map((bed) => ({ bed, room }))
  );
  const selectedTransferBed = transferBedOptions.find((item) => item.bed._id === transferBedId);

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}><Text style={styles.loadingText}>Loading rooms...</Text></View>
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
            <Text style={styles.headerTitle}>Rooms & Beds</Text>
            <View style={styles.headerActions}>
              <Pressable onPress={openAddBed} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
                <MaterialCommunityIcons name="bed-queen-outline" size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable onPress={openAddRoom} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
                <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Stats row */}
          <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="door-open" size={18} color="#1D4ED8" />
              <Text style={styles.statValue}>{displayStats.total}</Text>
              <Text style={styles.statLabel}>Rooms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="bed-outline" size={18} color="#7C3AED" />
              <Text style={[styles.statValue, { color: '#7C3AED' }]}>{displayStats.totalBeds}</Text>
              <Text style={styles.statLabel}>Beds</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#16A34A" />
              <Text style={[styles.statValue, { color: '#16A34A' }]}>{displayStats.vacant}</Text>
              <Text style={styles.statLabel}>Vacant</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-outline" size={18} color="#2563EB" />
              <Text style={[styles.statValue, { color: '#2563EB' }]}>{displayStats.occupied}</Text>
              <Text style={styles.statLabel}>Filled</Text>
            </View>
          </Animated.View>
        </View>

        {/* Property filter */}
        <View style={styles.filterBar}>
          <Pressable style={styles.filterSelect} onPress={() => setShowFilterDropdown((p) => !p)}>
            <MaterialCommunityIcons name="office-building-outline" size={16} color={Colors.textSecondary} />
            <Text style={[styles.filterText, !selectedPropertyId && { color: Colors.textTertiary }]}>
              {selectedPropertyId
                ? properties.find((p) => p._id === selectedPropertyId)?.name || 'All Properties'
                : 'All Properties'}
            </Text>
            <MaterialCommunityIcons name={showFilterDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
          </Pressable>
          {showFilterDropdown && (
            <View style={styles.filterDropdown}>
              <Pressable style={[styles.filterOption, !selectedPropertyId && styles.filterOptionActive]}
                onPress={() => { setSelectedPropertyId(''); setShowFilterDropdown(false); setExpandedId(null); }}>
                <Text style={[styles.filterOptionText, !selectedPropertyId && styles.filterOptionTextActive]}>All Properties</Text>
              </Pressable>
              {properties.map((p) => (
                <Pressable key={p._id} style={[styles.filterOption, selectedPropertyId === p._id && styles.filterOptionActive]}
                  onPress={() => { setSelectedPropertyId(p._id); setShowFilterDropdown(false); setExpandedId(null); }}>
                  <Text style={[styles.filterOptionText, selectedPropertyId === p._id && styles.filterOptionTextActive]}>{p.name}</Text>
                  {p.city ? <Text style={styles.filterOptionSub}>{p.city}</Text> : null}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Room list */}
        <View style={styles.listSection}>
          {filteredRooms.map((room, idx) => {
            const isExpanded = expandedId === room._id;
            const bedCount = room.beds?.length || 0;
            const filledBeds = room.beds?.filter(b => b.status === 'occupied').length || 0;

            return (
              <Animated.View key={room._id} style={[styles.roomCard, { opacity: fadeAnim }]}>
                <Pressable
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setExpandedId(isExpanded ? null : room._id);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.96 : 1 }]}
                >
                  {/* Card header row */}
                  <View style={styles.roomHeader}>
                    <View style={styles.roomHeaderLeft}>
                      <View style={[styles.roomIconWrap, { backgroundColor: filledBeds === bedCount && bedCount > 0 ? '#FEE2E2' : Colors.primaryBg }]}>
                        <MaterialCommunityIcons
                          name={isExpanded ? 'door-open' : 'door'}
                          size={20}
                          color={filledBeds === bedCount && bedCount > 0 ? Colors.error : Colors.primary}
                        />
                      </View>
                      <View style={styles.roomInfoCol}>
                        <Text style={styles.roomNumber}>Room {room.roomNumber}</Text>
                        <Text style={styles.roomMeta}>
                          {room.roomType ? room.roomType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Standard'}
                          {room.floor ? ` · Floor ${room.floor}` : ''}
                        </Text>
                        {room.rentPerBed ? <Text style={styles.roomRent}>₹{room.rentPerBed}/bed</Text> : null}
                      </View>
                    </View>
                    <View style={styles.roomHeaderRight}>
                      <Pressable onPress={() => openRoomEdit(room)} hitSlop={10} style={styles.roomActionBtn}>
                        <MaterialCommunityIcons name="pencil-outline" size={15} color={Colors.textSecondary} />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteRoom(room)} hitSlop={10} style={styles.roomActionBtn}>
                        <MaterialCommunityIcons name="trash-can-outline" size={15} color={Colors.textTertiary} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Occupancy section */}
                  <View style={styles.occupancySection}>
                    <View style={styles.occupancyBarTrack}>
                      <View style={[styles.occupancyBarFill, { width: bedCount ? `${(filledBeds / bedCount) * 100}%` : '0%' }]} />
                    </View>
                    <View style={styles.occupancyRow}>
                      <View style={styles.occupancyChip}>
                        <View style={[styles.occDot, { backgroundColor: '#2563EB' }]} />
                        <Text style={styles.occText}>{filledBeds} filled</Text>
                      </View>
                      <View style={styles.occupancyChip}>
                        <View style={[styles.occDot, { backgroundColor: '#16A34A' }]} />
                        <Text style={styles.occText}>{bedCount - filledBeds} vacant</Text>
                      </View>
                      <Text style={styles.occupancyPercent}>
                        {bedCount ? Math.round((filledBeds / bedCount) * 100) : 0}%
                      </Text>
                      {bedCount > 0 && (
                        <View style={styles.roomBadge}>
                          <Text style={styles.roomBadgeText}>{filledBeds}/{bedCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Expandable bed grid */}
                  {isExpanded && room.beds && room.beds.length > 0 && (
                    <View style={styles.bedGridSection}>
                      <Text style={styles.bedGridTitle}>Beds</Text>
                      <View style={styles.bedGrid}>
                        {room.beds.map(bed => {
                          const occupantName = typeof bed.tenantId === 'object' && bed.tenantId ? bed.tenantId.name : '';
                          return (
                          <Pressable key={bed._id} onPress={() => openBedEdit(bed, room._id)}
                            style={({ pressed }) => [
                              styles.bedChip,
                              { opacity: pressed ? 0.75 : 1 },
                              bed.status === 'occupied' ? styles.bedChipOccupied :
                              bed.status === 'booked' ? styles.bedChipBooked :
                              bed.status === 'maintenance' ? styles.bedChipMaintenance :
                              styles.bedChipVacant,
                            ]}>
                            <MaterialCommunityIcons
                              name={bed.status === 'occupied' ? 'bed' : 'bed-outline'}
                              size={14}
                              color={bed.status === 'occupied' ? '#FFFFFF' :
                                     bed.status === 'booked' ? '#92400E' :
                                     bed.status === 'maintenance' ? '#991B1B' : '#16A34A'}
                            />
                            <Text style={[
                              styles.bedLabel,
                              bed.status === 'occupied' && styles.bedLabelLight,
                            ]}>
                              {bed.bedNumber}
                            </Text>
                            <Text style={[
                              styles.bedStatusLabel,
                              bed.status === 'occupied' && styles.bedLabelLight,
                            ]}>
                              {bed.status === 'occupied' && occupantName ? occupantName : bedStatusLabel[bed.status]}
                            </Text>
                          </Pressable>
                        );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Empty room hint */}
                  {isExpanded && (!room.beds || room.beds.length === 0) && (
                    <View style={styles.bedGridSection}>
                      <Text style={styles.bedGridEmpty}>No beds in this room. Tap + to add one.</Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}

          {filteredRooms.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="bed-empty" size={48} color="#D0D9E8" />
              <Text style={styles.emptyText}>No rooms found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Add Room Modal ─────────────────────────────────────── */}
      <Modal visible={showAddRoom} transparent animationType="slide" onRequestClose={() => setShowAddRoom(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Room</Text>
              <Pressable onPress={() => setShowAddRoom(false)} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>Property *</Text>
              <Pressable style={styles.modalInputRow} onPress={() => setShowPropertyPicker((p) => !p)}>
                <Text style={[styles.modalInputText, !roomForm.propertyId && { color: Colors.textTertiary }]}>
                  {roomForm.propertyId
                    ? properties.find((p) => p._id === roomForm.propertyId)?.name || roomForm.propertyId
                    : 'Select property'}
                </Text>
                <MaterialCommunityIcons name={showPropertyPicker ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
              </Pressable>
              {showPropertyPicker && (
                <View style={styles.pickerDropdown}>
                  {properties.map((p) => (
                    <Pressable key={p._id} style={[styles.pickerOption, roomForm.propertyId === p._id && styles.pickerOptionActive]}
                      onPress={() => { setRoomForm((f) => ({ ...f, propertyId: p._id })); setShowPropertyPicker(false); }}>
                      <Text style={[styles.pickerOptionText, roomForm.propertyId === p._id && styles.pickerOptionTextActive]}>{p.name}</Text>
                      {p.city ? <Text style={styles.pickerSub}>{p.city}</Text> : null}
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={styles.modalLabel}>Room Number *</Text>
              <TextInput style={styles.modalInput} value={roomForm.roomNumber}
                onChangeText={(t) => setRoomForm((f) => ({ ...f, roomNumber: t }))}
                placeholder="e.g. 101" placeholderTextColor={Colors.textTertiary} />

              <Text style={styles.modalLabel}>Floor</Text>
              <TextInput style={styles.modalInput} value={roomForm.floor}
                onChangeText={(t) => setRoomForm((f) => ({ ...f, floor: t }))}
                placeholder="e.g. 1" placeholderTextColor={Colors.textTertiary} />

              <Text style={styles.modalLabel}>Room Type</Text>
              <View style={styles.typeRow}>
                {roomTypes.map((t) => (
                  <Pressable key={t.value} style={[styles.typeChip, roomForm.roomType === t.value && styles.typeChipActive]}
                    onPress={() => setRoomForm((f) => ({ ...f, roomType: t.value }))}>
                    <Text style={[styles.typeChipText, roomForm.roomType === t.value && styles.typeChipTextActive]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalLabel}>Rent Per Bed *</Text>
              <TextInput style={styles.modalInput} value={roomForm.rentPerBed}
                onChangeText={(t) => setRoomForm((f) => ({ ...f, rentPerBed: t }))}
                placeholder="e.g. 7500" placeholderTextColor={Colors.textTertiary} keyboardType="numeric" />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowAddRoom(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalSubmitBtn, creating && { opacity: 0.6 }]} onPress={handleCreateRoom} disabled={creating}>
                <Text style={styles.modalSubmitText}>{creating ? 'Creating...' : 'Add Room'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Bed Modal ───────────────────────────────────────── */}
      <Modal visible={showAddBed} transparent animationType="slide" onRequestClose={() => setShowAddBed(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bed</Text>
              <Pressable onPress={() => setShowAddBed(false)} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>Property *</Text>
              <Pressable style={styles.modalInputRow} onPress={() => setShowPropertyPicker((p) => !p)}>
                <Text style={[styles.modalInputText, !bedForm.propertyId && { color: Colors.textTertiary }]}>
                  {bedForm.propertyId
                    ? properties.find((p) => p._id === bedForm.propertyId)?.name || bedForm.propertyId
                    : 'Select property'}
                </Text>
                <MaterialCommunityIcons name={showPropertyPicker ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
              </Pressable>
              {showPropertyPicker && (
                <View style={styles.pickerDropdown}>
                  {properties.map((p) => (
                    <Pressable key={p._id} style={[styles.pickerOption, bedForm.propertyId === p._id && styles.pickerOptionActive]}
                      onPress={() => { setBedForm((f) => ({ ...f, propertyId: p._id, roomId: '' })); setShowPropertyPicker(false); }}>
                      <Text style={[styles.pickerOptionText, bedForm.propertyId === p._id && styles.pickerOptionTextActive]}>{p.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={styles.modalLabel}>Room *</Text>
              <Pressable style={styles.modalInputRow} onPress={() => {
                if (!bedForm.propertyId) { Alert.alert('First', 'Select a property first'); return; }
                setShowRoomPicker((p) => !p);
              }}>
                <Text style={[styles.modalInputText, !bedForm.roomId && { color: Colors.textTertiary }]}>
                  {bedForm.roomId
                    ? `Room ${rooms.find((r) => r._id === bedForm.roomId)?.roomNumber || ''}`
                    : 'Select room'}
                </Text>
                <MaterialCommunityIcons name={showRoomPicker ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
              </Pressable>
              {showRoomPicker && (
                <View style={styles.pickerDropdown}>
                  {rooms.length === 0 ? (
                    <Text style={styles.pickerEmpty}>No rooms available</Text>
                  ) : (
                    rooms.map((r) => (
                      <Pressable key={r._id} style={[styles.pickerOption, bedForm.roomId === r._id && styles.pickerOptionActive]}
                        onPress={() => { setBedForm((f) => ({ ...f, roomId: r._id })); setShowRoomPicker(false); }}>
                        <Text style={[styles.pickerOptionText, bedForm.roomId === r._id && styles.pickerOptionTextActive]}>
                          Room {r.roomNumber}{r.floor ? ` · Floor ${r.floor}` : ''}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              )}

              <Text style={styles.modalLabel}>Bed Number *</Text>
              <TextInput style={styles.modalInput} value={bedForm.bedNumber}
                onChangeText={(t) => setBedForm((f) => ({ ...f, bedNumber: t }))}
                placeholder="e.g. A, B, 1, 2" placeholderTextColor={Colors.textTertiary} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowAddBed(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalSubmitBtn, creating && { opacity: 0.6 }]} onPress={handleCreateBed} disabled={creating}>
                <Text style={styles.modalSubmitText}>{creating ? 'Adding...' : 'Add Bed'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Room Edit Modal ─────────────────────────────────────── */}
      <Modal visible={!!editingRoom} transparent animationType="slide" onRequestClose={() => setEditingRoom(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Room {editingRoom?.roomNumber}</Text>
              <Pressable onPress={() => setEditingRoom(null)} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>Room Number *</Text>
              <TextInput style={styles.modalInput} value={roomEditForm.roomNumber}
                onChangeText={(t) => setRoomEditForm((f) => ({ ...f, roomNumber: t }))}
                placeholder="e.g. 101" placeholderTextColor={Colors.textTertiary} />

              <Text style={styles.modalLabel}>Floor</Text>
              <TextInput style={styles.modalInput} value={roomEditForm.floor}
                onChangeText={(t) => setRoomEditForm((f) => ({ ...f, floor: t }))}
                placeholder="e.g. 1" placeholderTextColor={Colors.textTertiary} />

              <Text style={styles.modalLabel}>Room Type</Text>
              <View style={styles.typeRow}>
                {roomTypes.map((t) => (
                  <Pressable key={t.value} style={[styles.typeChip, roomEditForm.roomType === t.value && styles.typeChipActive]}
                    onPress={() => setRoomEditForm((f) => ({ ...f, roomType: t.value }))}>
                    <Text style={[styles.typeChipText, roomEditForm.roomType === t.value && styles.typeChipTextActive]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalLabel}>Rent Per Bed *</Text>
              <TextInput style={styles.modalInput} value={roomEditForm.rentPerBed}
                onChangeText={(t) => setRoomEditForm((f) => ({ ...f, rentPerBed: t }))}
                placeholder="e.g. 7500" placeholderTextColor={Colors.textTertiary} keyboardType="numeric" />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setEditingRoom(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalSubmitBtn, saving && { opacity: 0.6 }]} onPress={handleUpdateRoom} disabled={saving}>
                <Text style={styles.modalSubmitText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Bed Edit Modal ──────────────────────────────────────── */}
      <Modal visible={!!editingBed} transparent animationType="slide" onRequestClose={() => setEditingBed(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Bed {editingBed?.bedNumber}</Text>
              <Pressable onPress={() => setEditingBed(null)} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>Bed Number *</Text>
              <TextInput style={styles.modalInput} value={bedEditForm.bedNumber}
                onChangeText={(t) => setBedEditForm((f) => ({ ...f, bedNumber: t }))}
                placeholder="e.g. A, 1" placeholderTextColor={Colors.textTertiary} />

              <Text style={styles.modalLabel}>Status</Text>
              <View style={styles.typeRow}>
                {[
                  { value: 'vacant', label: 'Vacant' },
                  { value: 'occupied', label: 'Occupied' },
                  { value: 'booked', label: 'Booked' },
                  { value: 'maintenance', label: 'Maintenance' },
                ].map((opt) => (
                  <Pressable key={opt.value} style={[styles.bedStatusChip, bedEditForm.status === opt.value && styles.bedStatusChipActive]}
                    onPress={() => setBedEditForm((f) => ({ ...f, status: opt.value }))}>
                    <Text style={[styles.bedStatusChipText, bedEditForm.status === opt.value && styles.bedStatusChipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>

              {editingBed?.status === 'occupied' && editingBed.tenantId ? (
                <View style={styles.transferSection}>
                  <Text style={styles.modalLabel}>Change Tenant Bed</Text>
                  <Text style={styles.transferHint}>
                    {getTenantNameFromBed(editingBed) || 'This tenant'} can be moved only to a vacant unassigned bed.
                  </Text>
                  <Pressable style={styles.modalInputRow} onPress={() => setShowTransferPicker((p) => !p)}>
                    <Text style={[styles.modalInputText, !transferBedId && { color: Colors.textTertiary }]}>
                      {selectedTransferBed
                        ? `Room ${selectedTransferBed.room.roomNumber} - Bed ${selectedTransferBed.bed.bedNumber}`
                        : 'Select vacant bed'}
                    </Text>
                    <MaterialCommunityIcons name={showTransferPicker ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
                  </Pressable>
                  {showTransferPicker && (
                    <View style={styles.pickerDropdown}>
                      {transferBedOptions.length === 0 ? (
                        <Text style={styles.pickerEmpty}>No vacant bed available in this property</Text>
                      ) : (
                        transferBedOptions.map(({ bed, room }) => (
                          <Pressable
                            key={bed._id}
                            style={[styles.pickerOption, transferBedId === bed._id && styles.pickerOptionActive]}
                            onPress={() => {
                              setTransferBedId(bed._id);
                              setShowTransferPicker(false);
                            }}
                          >
                            <Text style={[styles.pickerOptionText, transferBedId === bed._id && styles.pickerOptionTextActive]}>
                              Room {room.roomNumber} - Bed {bed.bedNumber}
                            </Text>
                            <Text style={styles.pickerSub}>Vacant</Text>
                          </Pressable>
                        ))
                      )}
                    </View>
                  )}
                  <Pressable
                    style={[styles.transferBtn, (!transferBedId || saving) && styles.transferBtnDisabled]}
                    onPress={handleChangeTenantBed}
                    disabled={!transferBedId || saving}
                  >
                    <MaterialCommunityIcons name="swap-horizontal" size={18} color="#FFFFFF" />
                    <Text style={styles.transferBtnText}>{saving ? 'Changing...' : 'Change Tenant Bed'}</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.modalDangerSection}>
                <Pressable style={[
                  styles.modalDeleteBtn,
                  editingBed && (editingBed.status !== 'vacant' || !!editingBed.tenantId) && styles.modalDeleteBtnDisabled,
                ]} onPress={() => {
                  if (!editingBed) return;
                  handleDeleteBed(editingBed, editingBedRoomId);
                }}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.modalDeleteText}>Delete this Bed</Text>
                </Pressable>
                {editingBed && (editingBed.status !== 'vacant' || !!editingBed.tenantId) ? (
                  <Text style={styles.modalDeleteHint}>Only vacant unassigned beds can be deleted.</Text>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setEditingBed(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalSubmitBtn, saving && { opacity: 0.6 }]} onPress={handleUpdateBed} disabled={saving}>
                <Text style={styles.modalSubmitText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E3A5F',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginTop: -4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: FontSize['2xl'],
    color: '#1E293B',
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: '#64748B',
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },

  // Filter bar
  filterBar: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    zIndex: 10,
  },
  filterSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  filterDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 220,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterOptionActive: {
    backgroundColor: Colors.primaryBg,
  },
  filterOptionText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  filterOptionTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  filterOptionSub: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },

  // List
  listSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#1E3A5F',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  roomHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  roomIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomInfoCol: {
    flex: 1,
    gap: 1,
  },
  roomNumber: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
  },
  roomMeta: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  roomRent: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  roomHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: Spacing.sm,
    paddingTop: 2,
  },
  roomActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Occupancy section
  occupancySection: {
    marginTop: Spacing.md,
  },
  occupancyBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EEF2F6',
    overflow: 'hidden',
  },
  occupancyBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  occupancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  occupancyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  occDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  occText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  occupancyPercent: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.extrabold,
    marginLeft: 'auto',
  },
  roomBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EEF2F6',
  },
  roomBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },

  // Bed grid
  bedGridSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  bedGridTitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  bedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  bedChipVacant: {
    backgroundColor: '#E6F7E6',
    borderWidth: 1,
    borderColor: '#B8E6B8',
  },
  bedChipOccupied: {
    backgroundColor: '#2563EB',
  },
  bedChipBooked: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  bedChipMaintenance: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  bedLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  bedLabelLight: {
    color: '#FFFFFF',
  },
  bedStatusLabel: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.3,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  bedGridEmpty: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },

  // Bed status chips (edit modal)
  bedStatusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.clayBase,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bedStatusChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bedStatusChipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  bedStatusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  transferSection: {
    marginTop: 18,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  transferHint: {
    marginBottom: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  transferBtn: {
    marginTop: Spacing.sm,
    minHeight: 44,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  transferBtnDisabled: {
    opacity: 0.55,
  },
  transferBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  // Danger section
  modalDangerSection: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 20,
    alignItems: 'center',
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
  },
  modalDeleteBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  modalDeleteText: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  modalDeleteHint: {
    marginTop: 8,
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },

  // Empty / Error
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
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

  // ── Modal ─────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '85%',
    paddingBottom: 24,
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
  modalSubmitText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  pickerDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 180,
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
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
});
