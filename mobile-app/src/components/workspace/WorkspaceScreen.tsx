import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { PGButton } from '../PGButton';
import { PGInput } from '../PGInput';
import type { User } from '../../types/auth.types';

type WorkspaceKey =
  | 'properties'
  | 'rooms'
  | 'beds'
  | 'tenants'
  | 'dues'
  | 'reports'
  | 'payments'
  | 'complaints'
  | 'issues'
  | 'rent'
  | 'history'
  | 'support'
  | 'room'
  | 'chat'
  | 'profile'
  | 'account';

interface WorkspaceScreenProps {
  routeKey: string;
  role: User['role'];
  onBack: () => void;
  onLogout: () => void;
}

const titleMap: Record<string, string> = {
  properties: 'Properties',
  rooms: 'Rooms & Beds',
  beds: 'Beds',
  tenants: 'Tenants',
  dues: 'Rent',
  reports: 'Manager Reports',
  payments: 'Payments',
  complaints: 'Complaints',
  issues: 'Issues',
  rent: 'My Rent',
  history: 'Payment History',
  support: 'Support',
  room: 'My Room',
  chat: 'Messages',
  profile: 'Profile',
  account: 'Owner Account',
};

export function WorkspaceScreen({ routeKey, role, onBack, onLogout }: WorkspaceScreenProps) {
  const normalizedKey = normalizeRoute(routeKey, role);
  const [items, setItems] = useState<any[]>([]);
  const [secondaryItems, setSecondaryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const canCreate = useMemo(() => {
    if (role === 'tenant') return normalizedKey === 'support';
    if (role === 'manager') return ['tenants', 'payments', 'reports'].includes(normalizedKey);
    return ['properties', 'rooms', 'beds', 'tenants', 'payments', 'managers'].includes(normalizedKey);
  }, [normalizedKey, role]);

  const loadData = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setMessage('');

      if (normalizedKey === 'properties') {
        setItems(await workspaceApi.properties.list());
      } else if (normalizedKey === 'rooms' || normalizedKey === 'beds' || normalizedKey === 'room') {
        const [rooms, beds] = await Promise.all([workspaceApi.rooms.list(), workspaceApi.beds.list()]);
        setItems(normalizedKey === 'beds' ? beds : rooms);
        setSecondaryItems(beds);
      } else if (normalizedKey === 'tenants') {
        const [tenants, beds] = await Promise.all([workspaceApi.tenants.list(), workspaceApi.beds.list()]);
        setItems(tenants);
        setSecondaryItems(beds);
      } else if (normalizedKey === 'complaints' || normalizedKey === 'issues' || normalizedKey === 'support') {
        setItems(await workspaceApi.complaints.list());
      } else if (normalizedKey === 'reports') {
        setItems(await workspaceApi.reports.list());
      } else if (normalizedKey === 'payments' || normalizedKey === 'rent' || normalizedKey === 'history' || normalizedKey === 'dues') {
        const [invoices, payments] = await Promise.all([workspaceApi.invoices.list(), workspaceApi.payments.list()]);
        setItems(normalizedKey === 'history' ? payments : invoices);
        setSecondaryItems(payments);
      } else if (normalizedKey === 'profile' || normalizedKey === 'account') {
        setItems([await workspaceApi.me()]);
      } else {
        setItems([]);
      }
    } catch (error: any) {
      setMessage(error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [normalizedKey]);

  useEffect(() => {
    setItems([]);
    setSecondaryItems([]);
    setForm({});
    loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(term),
    );
  }, [items, search]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData(false);
  }

  async function handleSubmit() {
    try {
      setSaving(true);
      setMessage('');

      if (normalizedKey === 'properties') {
        if (!form.name?.trim()) throw new Error('Property name is required');
        await workspaceApi.properties.create({
          name: form.name.trim(),
          city: form.city?.trim(),
          address: form.address?.trim(),
          contactPhone: form.contactPhone?.trim(),
          facilities: splitCsv(form.facilities),
          status: 'active',
        });
      } else if (normalizedKey === 'rooms') {
        if (!form.propertyId || !form.roomNumber || !form.rentPerBed) {
          throw new Error('Property ID, room number, and rent are required');
        }
        await workspaceApi.rooms.create({
          propertyId: form.propertyId.trim(),
          roomNumber: form.roomNumber.trim(),
          floor: form.floor?.trim(),
          roomType: form.roomType || 'single',
          rentPerBed: Number(form.rentPerBed),
          facilities: splitCsv(form.facilities),
          status: 'active',
        });
      } else if (normalizedKey === 'beds') {
        if (!form.propertyId || !form.roomId || !form.bedNumber) {
          throw new Error('Property ID, room ID, and bed number are required');
        }
        await workspaceApi.beds.create({
          propertyId: form.propertyId.trim(),
          roomId: form.roomId.trim(),
          bedNumber: form.bedNumber.trim(),
        });
      } else if (normalizedKey === 'tenants') {
        if (!form.propertyId || !form.name || !form.phone || !form.rentAmount) {
          throw new Error('Property, name, phone, and rent amount are required');
        }
        const created = await workspaceApi.tenants.create({
          propertyId: form.propertyId.trim(),
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email?.trim() || undefined,
          rentAmount: Number(form.rentAmount),
          securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : 0,
          loginId: form.loginId?.trim() || undefined,
          password: form.password || undefined,
          status: 'active',
        });
        const credentials = created?.accountCredentials;
        if (credentials?.loginId) {
          Alert.alert('Tenant login created', `Tenant ID: ${credentials.loginId}\nPassword: ${credentials.password}`);
        }
      } else if (normalizedKey === 'support') {
        if (!form.title || !form.category) throw new Error('Category and title are required');
        await workspaceApi.complaints.create({
          category: form.category.trim(),
          title: form.title.trim(),
          description: form.description?.trim(),
        });
      } else if (normalizedKey === 'reports') {
        if (!form.title) throw new Error('Report title is required');
        await workspaceApi.reports.create({
          title: form.title.trim(),
          category: form.category?.trim() || 'daily_update',
          priority: form.priority?.trim() || 'medium',
          propertyId: form.propertyId?.trim() || undefined,
          description: form.description?.trim(),
        });
      } else if (normalizedKey === 'payments') {
        if (!form.invoiceId || !form.amount) throw new Error('Invoice ID and amount are required');
        await workspaceApi.payments.create({
          invoiceId: form.invoiceId.trim(),
          amount: Number(form.amount),
          paymentMode: form.paymentMode || 'cash',
          transactionRef: form.transactionRef?.trim(),
          notes: form.notes?.trim(),
        });
      }

      setFormOpen(false);
      setForm({});
      setMessage('Saved successfully');
      await loadData(false);
    } catch (error: any) {
      setMessage(error?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function updateComplaint(item: any, status: string) {
    try {
      await workspaceApi.complaints.updateStatus(item._id, status, item.adminNote || '');
      await loadData(false);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to update complaint');
    }
  }

  async function updateReport(item: any, status: string) {
    try {
      await workspaceApi.reports.updateStatus(item._id, status, item.ownerNote || '');
      await loadData(false);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to update report');
    }
  }

  async function markTenantLeft(item: any) {
    try {
      await workspaceApi.tenants.markLeft(item._id);
      await loadData(false);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to update tenant');
    }
  }

  async function restoreTenant(item: any) {
    try {
      await workspaceApi.tenants.update(item._id, { status: 'active' });
      await loadData(false);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to restore tenant');
    }
  }

  async function markInvoicePaid(item: any) {
    try {
      await workspaceApi.invoices.markPaid(item._id);
      await loadData(false);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to mark invoice paid');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconButton} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>{roleLabel(role)}</Text>
          <Text style={styles.title}>{titleMap[normalizedKey] || 'Workspace'}</Text>
        </View>
        <Pressable onPress={handleRefresh} style={styles.iconButton} hitSlop={8}>
          <MaterialCommunityIcons name="refresh" size={21} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color={Colors.textTertiary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search this view"
          placeholderTextColor={Colors.textTertiary}
          style={styles.searchInput}
        />
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />}
      >
        {loading ? (
          <EmptyState title="Loading..." text="Fetching live data from the web app API." />
        ) : filteredItems.length === 0 ? (
          <EmptyState title="No records" text="There is nothing to show for this view yet." />
        ) : (
          filteredItems.map((item) => renderItem({
            item,
            keyName: normalizedKey,
            role,
            beds: secondaryItems,
            updateComplaint,
            updateReport,
            markTenantLeft,
            restoreTenant,
            markInvoicePaid,
          }))
        )}
      </ScrollView>

      <View style={styles.footer}>
        {normalizedKey === 'profile' || normalizedKey === 'account' ? (
          <PGButton label="Logout" onPress={onLogout} variant="outline" />
        ) : canCreate ? (
          <PGButton label={createLabel(normalizedKey, role)} onPress={() => setFormOpen(true)} />
        ) : null}
      </View>

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{createLabel(normalizedKey, role)}</Text>
              <Pressable onPress={() => setFormOpen(false)} style={styles.iconButton}>
                <MaterialCommunityIcons name="close" size={20} color={Colors.primary} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderForm(normalizedKey, form, setForm)}
              <PGButton label="Save" onPress={handleSubmit} loading={saving} style={styles.saveButton} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function renderItem({
  item,
  keyName,
  role,
  beds,
  updateComplaint,
  updateReport,
  markTenantLeft,
  restoreTenant,
  markInvoicePaid,
}: {
  item: any;
  keyName: string;
  role: User['role'];
  beds: any[];
  updateComplaint: (item: any, status: string) => void;
  updateReport: (item: any, status: string) => void;
  markTenantLeft: (item: any) => void;
  restoreTenant: (item: any) => void;
  markInvoicePaid: (item: any) => void;
}) {
  if (keyName === 'properties') {
    return (
      <RecordCard key={item._id} icon="office-building-outline" title={item.name} badge={item.status}>
        <Info label="Location" value={[item.city, item.state].filter(Boolean).join(', ') || item.address || 'Not set'} />
        <Info label="Contact" value={item.contactPhone || 'Not set'} />
        <Info label="Facilities" value={(item.facilities || []).join(', ') || 'No facilities'} />
      </RecordCard>
    );
  }

  if (keyName === 'rooms' || keyName === 'beds' || keyName === 'room') {
    if (keyName === 'beds') {
      return (
        <RecordCard key={item._id} icon="bed-outline" title={`Bed ${item.bedNumber}`} badge={item.status}>
          <Info label="Room" value={getRoomName(item.roomId)} />
          <Info label="Tenant" value={item.tenantId?.name || 'Not assigned'} />
        </RecordCard>
      );
    }

    const roomBeds = beds.filter((bed) => getId(bed.roomId) === item._id);
    return (
      <RecordCard key={item._id} icon="door-open" title={`Room ${item.roomNumber}`} badge={item.status}>
        <Info label="Property" value={item.propertyId?.name || 'Property'} />
        <Info label="Rent per bed" value={formatMoney(item.rentPerBed)} />
        <Info label="Beds" value={`${roomBeds.filter((bed) => bed.status === 'occupied').length}/${roomBeds.length} occupied`} />
        <Info label="Facilities" value={(item.facilities || []).join(', ') || 'No facilities'} />
      </RecordCard>
    );
  }

  if (keyName === 'tenants') {
    return (
      <RecordCard key={item._id} icon="account-outline" title={item.name} badge={item.status}>
        <Info label="Phone" value={item.phone} />
        <Info label="Room/Bed" value={`${item.roomId?.roomNumber ? `Room ${item.roomId.roomNumber}` : 'No room'} / ${item.bedId?.bedNumber ? `Bed ${item.bedId.bedNumber}` : 'No bed'}`} />
        <Info label="Rent" value={formatMoney(item.rentAmount)} />
        {role !== 'tenant' ? (
          item.status !== 'left' ? (
            <InlineButton label="Mark Left" onPress={() => markTenantLeft(item)} tone="warning" />
          ) : (
            <InlineButton label="Restore" onPress={() => restoreTenant(item)} tone="primary" />
          )
        ) : null}
      </RecordCard>
    );
  }

  if (keyName === 'complaints' || keyName === 'issues' || keyName === 'support') {
    return (
      <RecordCard key={item._id} icon="alert-circle-outline" title={item.title} badge={statusLabel(item.status)}>
        <Info label="Category" value={item.category || 'General'} />
        <Info label="Tenant" value={item.tenantId?.name || 'You'} />
        <Info label="Details" value={item.description || 'No description'} />
        {item.adminNote ? <Info label="Admin note" value={item.adminNote} /> : null}
        {role !== 'tenant' ? (
          <View style={styles.inlineActions}>
            <InlineButton label="Pending" onPress={() => updateComplaint(item, 'pending')} />
            <InlineButton label="Progress" onPress={() => updateComplaint(item, 'in_progress')} />
            <InlineButton label="Resolved" onPress={() => updateComplaint(item, 'resolved')} />
          </View>
        ) : null}
      </RecordCard>
    );
  }

  if (keyName === 'reports') {
    return (
      <RecordCard key={item._id} icon="chart-box-outline" title={item.title} badge={statusLabel(item.status)}>
        <Info label="Category" value={statusLabel(item.category || 'daily_update')} />
        <Info label="Priority" value={statusLabel(item.priority || 'medium')} />
        <Info label="Manager" value={item.managerId?.name || 'You'} />
        <Info label="Property" value={item.propertyId?.name || 'Not selected'} />
        <Info label="Details" value={item.description || 'No description'} />
        {item.ownerNote ? <Info label="Owner note" value={item.ownerNote} /> : null}
        {role === 'owner' ? (
          <View style={styles.inlineActions}>
            <InlineButton label="Reviewed" onPress={() => updateReport(item, 'reviewed')} />
            <InlineButton label="Closed" onPress={() => updateReport(item, 'closed')} />
          </View>
        ) : null}
      </RecordCard>
    );
  }

  if (keyName === 'payments' || keyName === 'rent' || keyName === 'history' || keyName === 'dues') {
    const isPayment = Boolean(item.paymentMode);
    return (
      <RecordCard
        key={item._id}
        icon={isPayment ? 'credit-card-outline' : 'file-document-outline'}
        title={item.tenantId?.name || item.title || (isPayment ? 'Payment' : 'Invoice')}
        badge={item.status || item.paymentMode || 'record'}
      >
        <Info label={isPayment ? 'Amount' : 'Total'} value={formatMoney(item.amount || item.totalAmount)} />
        <Info label="Month" value={item.month && item.year ? `${item.month}/${item.year}` : formatDate(item.paymentDate || item.dueDate)} />
        {!isPayment && item.status !== 'paid' && role !== 'tenant' ? (
          <InlineButton label="Mark Paid" onPress={() => markInvoicePaid(item)} />
        ) : null}
      </RecordCard>
    );
  }

  if (keyName === 'profile' || keyName === 'account') {
    return (
      <RecordCard key={item._id || item.id || 'me'} icon="account-circle-outline" title={item.name} badge={item.role}>
        <Info label="Email" value={item.email || 'Not set'} />
        <Info label="Phone" value={item.phone || 'Not set'} />
        <Info label="Login ID" value={item.loginId || 'Owner email login'} />
        <Info label="Status" value={item.status || 'active'} />
      </RecordCard>
    );
  }

  return null;
}

function renderForm(keyName: string, form: Record<string, string>, setForm: (next: Record<string, string>) => void) {
  const set = (field: string, value: string) => setForm({ ...form, [field]: value });

  if (keyName === 'properties') {
    return (
      <>
        <PGInput label="Property name" placeholder="Roomzy Central PG" value={form.name || ''} onChangeText={(v) => set('name', v)} />
        <PGInput label="City" placeholder="Jaipur" value={form.city || ''} onChangeText={(v) => set('city', v)} />
        <PGInput label="Address" placeholder="Full address" value={form.address || ''} onChangeText={(v) => set('address', v)} />
        <PGInput label="Contact phone" placeholder="+91..." value={form.contactPhone || ''} onChangeText={(v) => set('contactPhone', v)} keyboardType="phone-pad" />
        <PGInput label="Facilities" placeholder="WiFi, CCTV, Laundry" value={form.facilities || ''} onChangeText={(v) => set('facilities', v)} />
      </>
    );
  }

  if (keyName === 'rooms') {
    return (
      <>
        <PGInput label="Property ID" placeholder="Paste property ID" value={form.propertyId || ''} onChangeText={(v) => set('propertyId', v)} />
        <PGInput label="Room number" placeholder="101" value={form.roomNumber || ''} onChangeText={(v) => set('roomNumber', v)} />
        <PGInput label="Floor" placeholder="1st" value={form.floor || ''} onChangeText={(v) => set('floor', v)} />
        <PGInput label="Room type" placeholder="single / double / triple" value={form.roomType || ''} onChangeText={(v) => set('roomType', v)} />
        <PGInput label="Rent per bed" placeholder="7500" value={form.rentPerBed || ''} onChangeText={(v) => set('rentPerBed', v)} keyboardType="numeric" />
        <PGInput label="Facilities" placeholder="AC, Attached Washroom" value={form.facilities || ''} onChangeText={(v) => set('facilities', v)} />
      </>
    );
  }

  if (keyName === 'beds') {
    return (
      <>
        <PGInput label="Property ID" placeholder="Paste property ID" value={form.propertyId || ''} onChangeText={(v) => set('propertyId', v)} />
        <PGInput label="Room ID" placeholder="Paste room ID" value={form.roomId || ''} onChangeText={(v) => set('roomId', v)} />
        <PGInput label="Bed number" placeholder="A" value={form.bedNumber || ''} onChangeText={(v) => set('bedNumber', v)} />
      </>
    );
  }

  if (keyName === 'tenants') {
    return (
      <>
        <PGInput label="Property ID" placeholder="Paste property ID" value={form.propertyId || ''} onChangeText={(v) => set('propertyId', v)} />
        <PGInput label="Tenant name" placeholder="Amit Sharma" value={form.name || ''} onChangeText={(v) => set('name', v)} />
        <PGInput label="Phone" placeholder="+91..." value={form.phone || ''} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
        <PGInput label="Email" placeholder="tenant@example.com" value={form.email || ''} onChangeText={(v) => set('email', v)} keyboardType="email-address" />
        <PGInput label="Rent amount" placeholder="7500" value={form.rentAmount || ''} onChangeText={(v) => set('rentAmount', v)} keyboardType="numeric" />
        <PGInput label="Security deposit" placeholder="15000" value={form.securityDeposit || ''} onChangeText={(v) => set('securityDeposit', v)} keyboardType="numeric" />
        <PGInput label="Tenant login ID" placeholder="Auto if blank" value={form.loginId || ''} onChangeText={(v) => set('loginId', v)} />
        <PGInput label="Password" placeholder="Auto if blank" value={form.password || ''} onChangeText={(v) => set('password', v)} />
      </>
    );
  }

  if (keyName === 'support') {
    return (
      <>
        <PGInput label="Category" placeholder="Water / WiFi / Cleaning" value={form.category || ''} onChangeText={(v) => set('category', v)} />
        <PGInput label="Title" placeholder="Short complaint title" value={form.title || ''} onChangeText={(v) => set('title', v)} />
        <PGInput label="Description" placeholder="Explain the issue" value={form.description || ''} onChangeText={(v) => set('description', v)} multiline />
      </>
    );
  }

  if (keyName === 'reports') {
    return (
      <>
        <PGInput label="Report title" placeholder="Daily property update" value={form.title || ''} onChangeText={(v) => set('title', v)} />
        <PGInput label="Category" placeholder="daily_update / maintenance / incident" value={form.category || ''} onChangeText={(v) => set('category', v)} />
        <PGInput label="Priority" placeholder="low / medium / high / urgent" value={form.priority || ''} onChangeText={(v) => set('priority', v)} />
        <PGInput label="Property ID" placeholder="Optional property ID" value={form.propertyId || ''} onChangeText={(v) => set('propertyId', v)} />
        <PGInput label="Description" placeholder="Write report details for owner" value={form.description || ''} onChangeText={(v) => set('description', v)} multiline />
      </>
    );
  }

  if (keyName === 'payments') {
    return (
      <>
        <PGInput label="Invoice ID" placeholder="Paste invoice ID" value={form.invoiceId || ''} onChangeText={(v) => set('invoiceId', v)} />
        <PGInput label="Amount" placeholder="7500" value={form.amount || ''} onChangeText={(v) => set('amount', v)} keyboardType="numeric" />
        <PGInput label="Payment mode" placeholder="cash / upi / bank_transfer" value={form.paymentMode || ''} onChangeText={(v) => set('paymentMode', v)} />
        <PGInput label="Transaction ref" placeholder="Optional" value={form.transactionRef || ''} onChangeText={(v) => set('transactionRef', v)} />
        <PGInput label="Notes" placeholder="Optional" value={form.notes || ''} onChangeText={(v) => set('notes', v)} />
      </>
    );
  }

  return null;
}

function RecordCard({ icon, title, badge, children }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; badge?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <View style={styles.cardIcon}>
            <MaterialCommunityIcons name={icon} size={20} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>{title || 'Record'}</Text>
        </View>
        {badge ? <Text style={styles.badge}>{statusLabel(badge)}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value ?? 'Not set')}</Text>
    </View>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function InlineButton({ label, onPress, tone = 'primary' }: { label: string; onPress: () => void; tone?: 'primary' | 'warning' }) {
  return (
    <Pressable onPress={onPress} style={[styles.inlineButton, tone === 'warning' && styles.inlineButtonWarning]}>
      <Text style={[styles.inlineButtonText, tone === 'warning' && styles.inlineButtonTextWarning]}>{label}</Text>
    </Pressable>
  );
}

function normalizeRoute(routeKey: string, role: User['role']): WorkspaceKey | 'managers' {
  if (routeKey === 'home') return role === 'tenant' ? 'rent' : 'reports';
  if (routeKey === 'issues') return 'complaints';
  if (routeKey === 'chat') return role === 'tenant' ? 'support' : 'complaints';
  if (routeKey === 'account') return 'profile';
  return routeKey as WorkspaceKey;
}

function createLabel(keyName: string, role: User['role']) {
  if (keyName === 'properties') return 'Add Property';
  if (keyName === 'rooms') return 'Add Room';
  if (keyName === 'beds') return 'Add Bed';
  if (keyName === 'tenants') return 'Add Tenant';
  if (keyName === 'payments') return 'Record Payment';
  if (keyName === 'support') return 'Raise Complaint';
  if (keyName === 'reports') return role === 'manager' ? 'Send Report' : 'Add Report';
  return 'Add';
}

function roleLabel(role: User['role']) {
  if (role === 'owner') return 'Owner workspace';
  if (role === 'manager') return 'Manager operations';
  return 'Tenant portal';
}

function splitCsv(value = '') {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function getId(value: any) {
  return typeof value === 'string' ? value : value?._id || '';
}

function getRoomName(value: any) {
  return typeof value === 'string' ? value : value?.roomNumber ? `Room ${value.roomNumber}` : 'No room';
}

function formatMoney(value: any) {
  const amount = Number(value || 0);
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

function formatDate(value?: string) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusLabel(value = '') {
  return value.replace(/_/g, ' ').toUpperCase();
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.clayBase,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: 36,
    paddingBottom: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.claySurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
  },
  searchWrap: {
    minHeight: 50,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.clayInset,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  message: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryBg,
    fontWeight: FontWeight.semibold,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 118,
    gap: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.claySurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    padding: Spacing.lg,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.58,
    shadowRadius: 12,
    shadowOffset: { width: 6, height: 8 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
  },
  cardTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    backgroundColor: Colors.primaryBg,
    color: Colors.primary,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  infoRow: {
    marginTop: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  infoValue: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    fontWeight: FontWeight.medium,
  },
  empty: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    backgroundColor: Colors.claySurface,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  emptyText: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'android' ? 28 : Spacing.lg,
    backgroundColor: Colors.clayBase,
  },
  modalScrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  modal: {
    maxHeight: '88%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'android' ? 34 : Spacing.lg,
    backgroundColor: Colors.claySurface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  inlineButton: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryBg,
  },
  inlineButtonWarning: {
    backgroundColor: Colors.warningBg,
  },
  inlineButtonText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  inlineButtonTextWarning: {
    color: Colors.warning,
  },
});
