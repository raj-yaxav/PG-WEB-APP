import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { workspaceApi } from '../../services/apiClient';

const paymentModeIcons = {
  cash: 'cash',
  upi: 'cellphone',
  bank_transfer: 'bank',
  razorpay_link: 'link',
};

const statusColors = {
  paid: '#16A34A',
  partially_paid: '#F59E0B',
  unpaid: '#DC2626',
  pending: '#F59E0B',
  in_progress: '#2563EB',
  resolved: '#16A34A',
};

const statusLabels = {
  paid: 'PAID',
  partially_paid: 'PARTIAL',
  unpaid: 'UNPAID',
  pending: 'PENDING',
  in_progress: 'IN PROGRESS',
  resolved: 'RESOLVED',
};

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PaymentHistoryScreen({ onBack, embedded }) {
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSegment, setActiveSegment] = useState('payments');

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setLoading(true);
      setError('');
      const [paymentsRes, complaintsRes] = await Promise.all([
        workspaceApi.payments.list().catch(() => []),
        workspaceApi.complaints.list().catch(() => []),
      ]);
      setPayments(Array.isArray(paymentsRes) ? paymentsRes : paymentsRes?.payments || paymentsRes?.data || []);
      setComplaints(Array.isArray(complaintsRes) ? complaintsRes : complaintsRes?.complaints || complaintsRes?.data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  const header = !embedded ? (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.headerTitle}>History</Text>
      <View style={styles.backBtn} />
    </View>
  ) : null;

  if (loading) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.center}><ActivityIndicator size="large" color="#1D4ED8" /></View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={loadHistory}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {header}

      {/* Segment Control */}
      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segment, activeSegment === 'payments' && styles.segmentActive]}
          onPress={() => setActiveSegment('payments')}
        >
          <MaterialCommunityIcons name="wallet-outline" size={16} color={activeSegment === 'payments' ? '#1D4ED8' : '#9CA3AF'} />
          <Text style={[styles.segmentText, activeSegment === 'payments' && styles.segmentTextActive]}>
            Payments ({payments.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, activeSegment === 'queries' && styles.segmentActive]}
          onPress={() => setActiveSegment('queries')}
        >
          <MaterialCommunityIcons name="chat-outline" size={16} color={activeSegment === 'queries' ? '#1D4ED8' : '#9CA3AF'} />
          <Text style={[styles.segmentText, activeSegment === 'queries' && styles.segmentTextActive]}>
            Queries ({complaints.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeSegment === 'payments' ? (
          payments.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="credit-card-outline" size={40} color="#D0D9E8" />
              <Text style={styles.emptyText}>No payment history yet</Text>
            </View>
          ) : (
            payments.map((p, idx) => (
              <View key={p._id || idx} style={styles.historyCard}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons name={paymentModeIcons[p.paymentMode] || 'credit-card'} size={18} color="#1D4ED8" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>
                      ₹{p.amount?.toLocaleString('en-IN')}
                    </Text>
                    {p.invoiceId ? (
                      <Text style={styles.cardSubtitle}>
                        {p.invoiceId.month && p.invoiceId.year
                          ? `${p.invoiceId.month} ${p.invoiceId.year}`
                          : 'Rent payment'}
                        {p.paymentMode ? ` · ${p.paymentMode.replace('_', ' ').toUpperCase()}` : ''}
                      </Text>
                    ) : (
                      <Text style={styles.cardSubtitle}>
                        {p.paymentMode ? p.paymentMode.replace('_', ' ').toUpperCase() : 'Payment'}
                      </Text>
                    )}
                    <Text style={styles.cardDate}>{formatDate(p.paymentDate)}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (statusColors[p.invoiceId?.status] || '#9CA3AF') + '18' }]}>
                  <Text style={[styles.statusText, { color: statusColors[p.invoiceId?.status] || '#9CA3AF' }]}>
                    {statusLabels[p.invoiceId?.status] || 'PAID'}
                  </Text>
                </View>
              </View>
            ))
          )
        ) : (
          complaints.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="chat-outline" size={40} color="#D0D9E8" />
              <Text style={styles.emptyText}>No queries raised yet</Text>
            </View>
          ) : (
            complaints.map((c, idx) => (
              <View key={c._id || idx} style={styles.historyCard}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#1D4ED8" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{c.title}</Text>
                    <Text style={styles.cardSubtitle}>
                      {c.category ? c.category.replace('_', ' ').toUpperCase() : ''}
                    </Text>
                    <Text style={styles.cardDate}>{formatDate(c.createdAt)}</Text>
                    {c.adminNote ? (
                      <Text style={styles.adminNote}>Note: {c.adminNote}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (statusColors[c.status] || '#9CA3AF') + '18' }]}>
                  <Text style={[styles.statusText, { color: statusColors[c.status] || '#9CA3AF' }]}>
                    {statusLabels[c.status] || c.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          )
        )}
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
  segmentRow: {
    flexDirection: 'row',
    margin: 16,
    gap: 8,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  segmentActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
  },
  segmentText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#1D4ED8',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  adminNote: {
    fontSize: 11,
    color: '#0F766E',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
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
