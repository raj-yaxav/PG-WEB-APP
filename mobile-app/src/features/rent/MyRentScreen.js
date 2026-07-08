import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { workspaceApi } from '../../services/apiClient';
import { PaymentHistoryScreen } from './PaymentHistoryScreen';

export function MyRentScreen({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [rentInfo, setRentInfo] = useState(null);

  useEffect(() => {
    loadRentInfo();
  }, []);

  async function loadRentInfo() {
    try {
      const res = await workspaceApi.payments.list();
      const data = Array.isArray(res) ? res : res?.payments || res?.data || [];
      setRentInfo(data);
    } catch {
      setRentInfo([]);
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
          <Text style={styles.headerTitle}>My Rent</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color="#1D4ED8" /></View>
      </View>
    );
  }

  const latest = Array.isArray(rentInfo) && rentInfo.length > 0 ? rentInfo[0] : null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>My Rent</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {latest ? (
          <View style={styles.rentCard}>
            <View style={styles.rentCardTop}>
              <Text style={styles.rentTitle}>{latest.invoiceId?.month && latest.invoiceId?.year ? `${latest.invoiceId.month} ${latest.invoiceId.year}` : 'Current Rent'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: (latest.invoiceId?.status === 'paid' ? '#16A34A' : '#F59E0B') + '18' }]}>
                <Text style={[styles.statusText, { color: latest.invoiceId?.status === 'paid' ? '#16A34A' : '#F59E0B' }]}>
                  {(latest.invoiceId?.status || 'PENDING').replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.rentAmount}>₹{latest.amount?.toLocaleString('en-IN') || '0'}</Text>

            {latest.paymentDate && (
              <Text style={styles.rentDate}>Paid on {new Date(latest.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            )}

            {latest.paymentMode && (
              <Text style={styles.rentMode}>Mode: {latest.paymentMode.replace('_', ' ').toUpperCase()}</Text>
            )}

            <View style={styles.divider} />

            <View style={styles.comingSoonContainer}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#0F766E" />
              <Text style={styles.comingSoonText}>Coming Soon</Text>
              <Text style={styles.comingSoonSubtext}>Online payment will be available shortly</Text>
            </View>
          </View>
        ) : (
          <View style={styles.rentCard}>
            <Text style={styles.noDataTitle}>No rent records yet</Text>
            <Text style={styles.noDataSub}>Your rent details will appear here once assigned.</Text>

            <View style={styles.divider} />

            <View style={styles.comingSoonContainer}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#0F766E" />
              <Text style={styles.comingSoonText}>Coming Soon</Text>
              <Text style={styles.comingSoonSubtext}>Online payment will be available shortly</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Payment History</Text>
        <PaymentHistoryScreen embedded />
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  rentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  rentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rentTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rentAmount: {
    fontSize: 36,
    color: '#111827',
    fontWeight: '800',
    marginBottom: 6,
  },
  rentDate: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  rentMode: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  comingSoonContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
    gap: 4,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#0F766E',
    fontWeight: '800',
  },
  comingSoonSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  noDataTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  noDataSub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '700',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
