/**
 * PropertiesScreen — Owner's Property Portfolio
 *
 * Features:
 * - Dark blue header bar with animated "Properties Workspace" title (white text)
 * - Search bar to filter properties
 * - Horizontal scrollable KPI cards (no squeeze, single row slider)
 * - Horizontal scrollable property cards (single row slider)
 * - Edge-to-edge top layout with hidden system status bar
 * - Claymorphism design language
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface Property {
  _id: string;
  name: string;
  city?: string;
  state?: string;
  address?: string;
  contactPhone?: string;
  facilities?: string[];
  status?: string;
  totalRooms?: number;
  totalBeds?: number;
  occupiedBeds?: number;
  vacantBeds?: number;
  monthlyRevenue?: number;
  managerName?: string;
  managerAvatar?: string;
  imageUrl?: string;
}

interface PropertiesScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatMoney = (amount = 0) =>
  `Rs ${amount.toLocaleString('en-IN')}`;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const KPI_CARD_WIDTH = 140;
const PROPERTY_CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

// ─── Main Component ──────────────────────────────────────────────────────────

export function PropertiesScreen({ onBack, onLogout }: PropertiesScreenProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [addForm, setAddForm] = useState({ name: '', city: '', address: '', contactPhone: '', facilities: '' });
  const [adding, setAdding] = useState(false);

  // Animated title entrance
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadProperties = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError('');
      const data = await workspaceApi.properties.list();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load properties');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProperties(false);
  }, [loadProperties]);

  // ─── Add / Edit Property ──────────────────────────────────────────────

  const openAddModal = useCallback(() => {
    setEditingProperty(null);
    setAddForm({ name: '', city: '', address: '', contactPhone: '', facilities: '' });
    setShowAddModal(true);
  }, []);

  const openEditModal = useCallback((property: Property) => {
    setEditingProperty(property);
    setAddForm({
      name: property.name,
      city: property.city || '',
      address: property.address || '',
      contactPhone: property.contactPhone || '',
      facilities: (property.facilities || []).join(', '),
    });
    setShowAddModal(true);
  }, []);

  const closePropertyModal = useCallback(() => {
    setShowAddModal(false);
    setEditingProperty(null);
    setAddForm({ name: '', city: '', address: '', contactPhone: '', facilities: '' });
  }, []);

  const handleSaveProperty = useCallback(async () => {
    if (!addForm.name.trim()) {
      Alert.alert('Required', 'Property name is required');
      return;
    }
    setAdding(true);
    try {
      const facilities = addForm.facilities
        ? addForm.facilities.split(',').map((f) => f.trim()).filter(Boolean)
        : [];
      const payload = {
        name: addForm.name.trim(),
        city: addForm.city.trim(),
        address: addForm.address.trim(),
        contactPhone: addForm.contactPhone.trim(),
        facilities,
      };

      if (editingProperty) {
        const updated = await workspaceApi.properties.update(editingProperty._id, payload);
        setProperties((prev) => prev.map((p) => (p._id === editingProperty._id ? { ...p, ...updated } : p)));
      } else {
        const newProp = await workspaceApi.properties.create(payload);
        setProperties((prev) => [newProp, ...prev]);
      }

      closePropertyModal();
    } catch (err: any) {
      Alert.alert('Error', err?.message || (editingProperty ? 'Failed to update property' : 'Failed to add property'));
    } finally {
      setAdding(false);
    }
  }, [addForm, editingProperty, closePropertyModal]);

  // ─── Filter by search ──────────────────────────────────────────────────

  const searchTerm = search.trim().toLowerCase();
  const filteredProperties = useMemo(
    () =>
      searchTerm
        ? properties.filter(
            (p) =>
              p.name?.toLowerCase().includes(searchTerm) ||
              p.city?.toLowerCase().includes(searchTerm) ||
              p.address?.toLowerCase().includes(searchTerm) ||
              p.managerName?.toLowerCase().includes(searchTerm),
          )
        : properties,
    [properties, searchTerm],
  );

  // ─── Aggregate Stats ────────────────────────────────────────────────────

  const aggregateStats = useMemo(() => {
    const total = properties.length;
    const totalRooms = properties.reduce((s, p) => s + (p.totalRooms || 0), 0);
    const totalBeds = properties.reduce((s, p) => s + (p.totalBeds || 0), 0);
    const occupiedBeds = properties.reduce((s, p) => s + (p.occupiedBeds || 0), 0);
    const totalRevenue = properties.reduce((s, p) => s + (p.monthlyRevenue || 0), 0);
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    return { total, totalRooms, totalBeds, occupiedBeds, occupancyPct, totalRevenue };
  }, [properties]);

  const kpis = useMemo(
    () => [
      { id: 'properties', label: 'Properties', value: aggregateStats.total, icon: 'office-building-outline' as const, color: '#2563EB', bgColor: '#DBEAFE' },
      { id: 'rooms', label: 'Rooms', value: aggregateStats.totalRooms, icon: 'door-open' as const, color: '#0284C7', bgColor: '#E0F2FE' },
      { id: 'beds', label: 'Beds', value: aggregateStats.totalBeds, icon: 'bed-outline' as const, color: '#0EA5E9', bgColor: '#E0F2FE' },
      { id: 'occupancy', label: 'Occupancy', value: `${aggregateStats.occupancyPct}%`, icon: 'account-group-outline' as const, color: '#0EA5E9', bgColor: '#E0F2FE' },
      { id: 'revenue', label: 'Revenue', value: formatMoney(aggregateStats.totalRevenue), icon: 'cash-multiple' as const, color: '#2563EB', bgColor: '#DBEAFE' },
    ],
    [aggregateStats],
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* ── Dark Blue Header Bar ── */}
      <View style={styles.headerBar}>
        <Animated.View
          style={[
            styles.headerTitleWrap,
            { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] },
          ]}
        >
          <Text style={styles.headerTitle}>Properties Workspace</Text>
          <Text style={styles.headerSubtitle}>
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} · Owner
          </Text>
        </Animated.View>

        <Pressable
          onPress={openAddModal}
          style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Add property"
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

      {/* ── Search Bar ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color={Colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search properties..."
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

      {/* ── Error Banner ── */}
      {error ? (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* ── Main Content ── */}
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
        ) : filteredProperties.length === 0 && !searchTerm ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Horizontal KPI Scroller ── */}
            <Text style={styles.sectionLabel}>Portfolio Overview</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.kpiRow}
              snapToInterval={KPI_CARD_WIDTH + 12}
              decelerationRate="fast"
            >
              {kpis.map((kpi) => (
                <View key={kpi.id} style={styles.kpiCard}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: kpi.bgColor }]}>
                    <MaterialCommunityIcons name={kpi.icon} size={20} color={kpi.color} />
                  </View>
                  <Text style={styles.kpiValue} numberOfLines={1}>
                    {kpi.value}
                  </Text>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* ── No Search Results ── */}
            {filteredProperties.length === 0 && searchTerm ? (
              <View style={styles.noResults}>
                <MaterialCommunityIcons name="earth-off" size={40} color={Colors.textTertiary} />
                <Text style={styles.noResultsText}>No properties match "{search}"</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>
                  All Properties
                  <Text style={styles.sectionCount}> ({filteredProperties.length})</Text>
                </Text>

                {/* ── Property Cards ── */}
                <View style={styles.propertyList}>
                  {filteredProperties.map((property) => (
                    <PropertyCard key={property._id} property={property} onEdit={openEditModal} />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
      {/* ── Add Property Modal ── */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={closePropertyModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProperty ? 'Edit Property' : 'Add Property'}</Text>
              <Pressable onPress={closePropertyModal} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.name}
                onChangeText={(t) => setAddForm((f) => ({ ...f, name: t }))}
                placeholder="e.g. Sunshine PG"
                placeholderTextColor={Colors.textTertiary}
              />

              <Text style={styles.modalLabel}>City</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.city}
                onChangeText={(t) => setAddForm((f) => ({ ...f, city: t }))}
                placeholder="e.g. Mumbai"
                placeholderTextColor={Colors.textTertiary}
              />

              <Text style={styles.modalLabel}>Address</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.address}
                onChangeText={(t) => setAddForm((f) => ({ ...f, address: t }))}
                placeholder="Full address"
                placeholderTextColor={Colors.textTertiary}
                multiline
              />

              <Text style={styles.modalLabel}>Contact Phone</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.contactPhone}
                onChangeText={(t) => setAddForm((f) => ({ ...f, contactPhone: t }))}
                placeholder="Phone number"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
              />

              <Text style={styles.modalLabel}>Facilities (comma-separated)</Text>
              <TextInput
                style={styles.modalInput}
                value={addForm.facilities}
                onChangeText={(t) => setAddForm((f) => ({ ...f, facilities: t }))}
                placeholder="WiFi, CCTV, Parking, Laundry"
                placeholderTextColor={Colors.textTertiary}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={closePropertyModal}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, adding && styles.modalSubmitBtnDisabled]}
                onPress={handleSaveProperty}
                disabled={adding}
              >
                <Text style={styles.modalSubmitText}>
                  {adding ? 'Saving...' : editingProperty ? 'Update' : 'Add Property'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Portfolio KPI Card ──────────────────────────────────────────────────────

// ─── Property Card ───────────────────────────────────────────────────────────

function PropertyCard({ property, onEdit }: { property: Property; onEdit: (p: Property) => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [expanded, setExpanded] = useState(false);

  const occupancyPct =
    property.totalBeds && property.totalBeds > 0
      ? Math.round(((property.occupiedBeds || 0) / property.totalBeds) * 100)
      : 0;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const facilities = property.facilities?.slice(0, 4) || [];
  const hasMoreFacilities = (property.facilities?.length || 0) > 4;

  return (
    <Animated.View style={[styles.propertyCard, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => setExpanded((p) => !p)}
        accessibilityRole="button"
        accessibilityLabel={`${property.name}, ${property.city || 'No location'}`}
        accessibilityState={{ expanded }}
      >
        {/* Top Row: Image + Info */}
        <View style={styles.propertyTopRow}>
          <View style={styles.propertyImageWrap}>
            {property.imageUrl ? (
              <Image source={{ uri: property.imageUrl }} style={styles.propertyImage} />
            ) : (
              <View style={styles.propertyImagePlaceholder}>
                <MaterialCommunityIcons name="office-building-outline" size={26} color={Colors.primary} />
              </View>
            )}
          </View>

          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName} numberOfLines={1}>
              {property.name}
            </Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={12} color={Colors.textTertiary} />
              <Text style={styles.propertyLocation} numberOfLines={1}>
                {[property.city, property.state].filter(Boolean).join(', ') || 'Location not set'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: property.status === 'active' ? Colors.success : Colors.warning },
                ]}
              />
              <Text style={styles.statusText}>
                {(property.status || 'active').toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <Pressable
              onPress={() => onEdit(property)}
              hitSlop={8}
              style={styles.cardEditBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit property"
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.primary} />
            </Pressable>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textTertiary}
            />
          </View>
        </View>

        {/* Occupancy Bar */}
        <View style={styles.occupancyBarContainer}>
          <View style={styles.occupancyBarTrack}>
            <View style={[styles.occupancyBarFill, { width: `${occupancyPct}%` }]} />
          </View>
          <Text style={styles.occupancyBarLabel}>{occupancyPct}% Occupied</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <QuickStat icon="bed-outline" value={property.totalBeds || 0} />
          <QuickStat icon="door-open" value={property.totalRooms || 0} />
          <QuickStat icon="account-outline" value={property.occupiedBeds || 0} />
          <QuickStat icon="currency-inr" value={formatMoney(property.monthlyRevenue || 0)} />
        </View>

        {/* Expanded Details */}
        {expanded && (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />

            {property.contactPhone ? (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="phone-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailText}>{property.contactPhone}</Text>
              </View>
            ) : null}

            {property.address ? (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailText} numberOfLines={2}>{property.address}</Text>
              </View>
            ) : null}

            {facilities.length > 0 && (
              <View style={styles.facilitiesRow}>
                <MaterialCommunityIcons name="lightning-bolt-outline" size={14} color={Colors.textTertiary} />
                <View style={styles.facilitiesList}>
                  {facilities.map((f, i) => (
                    <View key={i} style={styles.facilityChip}>
                      <Text style={styles.facilityChipText}>{f}</Text>
                    </View>
                  ))}
                  {hasMoreFacilities && (
                    <Text style={styles.moreFacilities}>+{property.facilities!.length - 4}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── QuickStat ───────────────────────────────────────────────────────────────

function QuickStat({ icon, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; value: string | number }) {
  return (
    <View style={styles.quickStat}>
      <MaterialCommunityIcons name={icon} size={14} color={Colors.primary} />
      <Text style={styles.quickStatValue}>{value}</Text>
    </View>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {/* Skeleton KPI row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingLeft: Spacing.lg }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.skeletonKpi} />
        ))}
      </ScrollView>
      {/* Skeleton property cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingLeft: Spacing.lg, marginTop: 16 }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonCard} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons name="office-building-outline" size={44} color={Colors.primaryLight} />
      </View>
      <Text style={styles.emptyTitle}>No Properties Yet</Text>
      <Text style={styles.emptyText}>
        Add your first property to start managing rooms, beds, and tenants.
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.clayBase,
    // No top padding at all
    paddingTop: 0,
  },

  // ── Dark Blue Header Bar ────────────────────────────────────────────────
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
    // Claymorphism shadow
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
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

  // ── Search Bar ──────────────────────────────────────────────────────────
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

  // ── Error Banner ────────────────────────────────────────────────────────
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

  // ── Scroll Content ──────────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 40,
    gap: Spacing.md,
  },

  // ── Section Label ───────────────────────────────────────────────────────
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

  // ── Horizontal KPI Row ──────────────────────────────────────────────────
  kpiRow: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
    flexDirection: 'row',
  },
  kpiCard: {
    width: KPI_CARD_WIDTH,
    backgroundColor: '#E2F0FF',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 7, height: 9 },
    elevation: 4,
  },
  kpiIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  kpiValue: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Property Card List ──────────────────────────────────────────────────
  propertyList: {
    paddingHorizontal: Spacing.lg,
    gap: 16,
  },
  propertyCard: {
    width: PROPERTY_CARD_WIDTH,
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
  propertyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  propertyImageWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 4, height: 6 },
    elevation: 3,
  },
  propertyImage: {
    width: 48,
    height: 48,
  },
  propertyImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyLocation: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
  },

  // ── Occupancy Bar ───────────────────────────────────────────────────────
  occupancyBarContainer: {
    marginTop: Spacing.sm,
    gap: 3,
  },
  occupancyBarTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.clayInset,
    overflow: 'hidden',
  },
  occupancyBarFill: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  occupancyBarLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
  },

  // ── Quick Stats ─────────────────────────────────────────────────────────
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  quickStat: {
    alignItems: 'center',
    gap: 1,
    minWidth: 52,
  },
  quickStatValue: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },

  // ── Expanded Section ────────────────────────────────────────────────────
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
  facilitiesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  facilitiesList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  facilityChip: {
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  facilityChipText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  moreFacilities: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
    alignSelf: 'center',
  },

  // ── No Results ──────────────────────────────────────────────────────────
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

  // ── Loading Skeleton ────────────────────────────────────────────────────
  skeletonContainer: {
    gap: Spacing.md,
  },
  skeletonKpi: {
    width: KPI_CARD_WIDTH,
    height: 110,
    backgroundColor: '#E2F0FF',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
  },
  skeletonCard: {
    width: PROPERTY_CARD_WIDTH,
    height: 180,
    backgroundColor: '#E2F0FF',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
  },

  // ── Empty State ─────────────────────────────────────────────────────────
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

  // ── Add Property Modal ─────────────────────────────────────────────────
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
});
