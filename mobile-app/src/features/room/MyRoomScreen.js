import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { workspaceApi } from '../../services/apiClient';

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

const facilityIcons = {
  AC: 'snowflake',
  'Non-AC': 'weather-sunny',
  'Attached Washroom': 'toilet',
  Balcony: 'balcony',
  Furnished: 'sofa',
  WiFi: 'wifi',
  Geyser: 'water-boiler',
  Cupboard: 'lock',
  'Power Backup': 'battery-charging',
  'Hot Water': 'water',
};

function getFacilityIcon(facility) {
  const match = Object.entries(facilityIcons).find(([key]) =>
    facility.toLowerCase().includes(key.toLowerCase())
  );
  return match ? match[1] : 'check-circle';
}

export function MyRoomScreen({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRoom();
  }, []);

  async function loadRoom() {
    try {
      setLoading(true);
      setError('');
      const res = await workspaceApi.tenants.myRoom();
      setData(res);
    } catch (err) {
      setError(err?.message || 'Failed to load room details');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>My Room</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>My Room</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={loadRoom}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const room = data?.room || {};
  const property = data?.property || {};
  const bed = data?.bed || {};
  const tenant = data?.tenant || {};

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>My Room</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Property Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="office-building" size={20} color="#1D4ED8" />
            <Text style={styles.cardTitle}>Property</Text>
          </View>
          <Text style={styles.valueLarge}>{property.name || 'N/A'}</Text>
          {property.city ? <Text style={styles.valueSub}>{property.city}{property.address ? `, ${property.address}` : ''}</Text> : null}
        </View>

        {/* Room & Bed Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="bed" size={20} color="#1D4ED8" />
            <Text style={styles.cardTitle}>Room & Bed</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Room</Text>
              <Text style={styles.value}>{room.roomNumber || 'N/A'}</Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Floor</Text>
              <Text style={styles.value}>{room.floor || 'N/A'}</Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Bed</Text>
              <Text style={styles.value}>{bed.bedNumber || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Room Type</Text>
              <Text style={styles.value}>
                {room.roomType
                  ? room.roomType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Rent</Text>
              <Text style={styles.value}>₹{data.rentAmount || room.rentPerBed || 0}</Text>
            </View>
          </View>
        </View>

        {/* Facilities Card */}
        {room.facilities && room.facilities.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="star-outline" size={20} color="#1D4ED8" />
              <Text style={styles.cardTitle}>Facilities</Text>
            </View>
            <View style={styles.facilitiesGrid}>
              {room.facilities.map((facility, idx) => (
                <View key={idx} style={styles.facilityChip}>
                  <MaterialCommunityIcons name={getFacilityIcon(facility)} size={14} color="#0F766E" />
                  <Text style={styles.facilityText}>{facility}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Tenant Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-circle" size={20} color="#1D4ED8" />
            <Text style={styles.cardTitle}>My Details</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{tenant.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{tenant.phone || 'N/A'}</Text>
          </View>
          {tenant.email ? (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{tenant.email}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Joined</Text>
            <Text style={styles.value}>{formatDate(tenant.joiningDate)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0F4FA',
  },
  header: {
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueLarge: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '800',
  },
  valueSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.15)',
  },
  facilityText: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
  },
  retryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
