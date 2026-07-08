import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/spacing';
import {
  applyMobileDashboardSummary,
  createDashboardData,
  getTabBarItems,
} from '../../constants/mockData';
import { getDashboardSummary } from '../../services/dashboardService';
import { Header } from '../../components/dashboard/Header';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { ManagementActions } from '../../components/dashboard/ManagementActions';
import { StatsGrid } from '../../components/dashboard/StatsGrid';
import { OccupancyOverview } from '../../components/dashboard/OccupancyOverview';
import { RentCard } from '../../components/dashboard/RentCard';
import { LivingSpace } from '../../components/dashboard/LivingSpace';
import { ComplaintsSection } from '../../components/dashboard/ComplaintsSection';
import { RecentPayments } from '../../components/dashboard/RecentPayments';
import { BottomTabBar } from '../../components/dashboard/BottomTabBar';
import { WorkspaceScreen } from '../../components/workspace/WorkspaceScreen';
import { PropertiesScreen } from '../../components/properties/PropertiesScreen';
import { ReportsScreen } from '../../components/reports/ReportsScreen';
import { ManagersScreen } from '../../components/managers/ManagersScreen';
import { TenantsScreen } from '../../components/tenants/TenantsScreen';
import { ProfileScreen } from '../../components/profile/ProfileScreen';
import { RoomsScreen } from '../../components/rooms/RoomsScreen';
import { ComplaintsScreen } from '../../components/complaints/ComplaintsScreen';
import { MyRoomScreen } from '../../features/room/MyRoomScreen';
import { MyRentScreen } from '../../features/rent/MyRentScreen';
import { PaymentHistoryScreen } from '../../features/rent/PaymentHistoryScreen';
import { RaiseComplaintScreen } from '../../features/complaints/RaiseComplaintScreen';
import type { User } from '../../types/auth.types';

interface HomeScreenProps {
  user: User | null;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

export function HomeScreen({ user, onLogout, onUserUpdate }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState('home');
  const baseDashboardData = useMemo(() => createDashboardData(user), [user]);
  const [dashboardData, setDashboardData] = useState(baseDashboardData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState('');
  const dashboardRole = dashboardData.user.role;
  const tabBarItems = useMemo(() => getTabBarItems(dashboardRole), [dashboardRole]);

  const canLoadLiveSummary = user?.role === 'owner' || user?.role === 'manager' || user?.role === 'tenant';

  const loadDashboardSummary = useCallback(async () => {
    if (!canLoadLiveSummary) return;

    setIsRefreshing(true);
    setSummaryMessage('');

    try {
      const summary = await getDashboardSummary();
      setDashboardData(applyMobileDashboardSummary(baseDashboardData, summary));
    } catch (error: any) {
      const message = error?.message || 'Live data unavailable';
      console.log('[Dashboard] summary failed:', message);
      setSummaryMessage(`${message}. Showing saved role view.`);
    } finally {
      setIsRefreshing(false);
    }
  }, [baseDashboardData, canLoadLiveSummary]);

  useEffect(() => {
    setDashboardData(baseDashboardData);
  }, [baseDashboardData]);

  useEffect(() => {
    loadDashboardSummary();
  }, [loadDashboardSummary]);

  function handleTabPress(id: string) {
    if (id === 'logout') {
      onLogout();
      return;
    }
    setActiveTab(id);
  }

  if (activeTab !== 'home') {
    // Owner Properties tab — use dedicated claymorphism PropertiesScreen
    if (activeTab === 'properties' && dashboardRole === 'owner') {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.workspaceContainer}>
            <PropertiesScreen
              onBack={() => setActiveTab('home')}
              onLogout={onLogout}
            />
          </View>
          <BottomTabBar
            items={tabBarItems}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      );
    }

    // Reports tab — use dedicated claymorphism ReportsScreen
    if (activeTab === 'reports' && (dashboardRole === 'owner' || dashboardRole === 'manager')) {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.workspaceContainer}>
            <ReportsScreen
              onBack={() => setActiveTab('home')}
              onLogout={onLogout}
              role={dashboardRole}
            />
          </View>
          <BottomTabBar
            items={tabBarItems}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      );
    }

    // Managers tab — only for owner
    if (activeTab === 'managers' && dashboardRole === 'owner') {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.workspaceContainer}>
            <ManagersScreen
              onBack={() => setActiveTab('home')}
              onLogout={onLogout}
            />
          </View>
          <BottomTabBar
            items={tabBarItems}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      );
    }

    // Tenants tab — for owner and manager
    if (activeTab === 'tenants' && (dashboardRole === 'owner' || dashboardRole === 'manager')) {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.workspaceContainer}>
            <TenantsScreen
              onBack={() => setActiveTab('home')}
              onLogout={onLogout}
              role={dashboardRole}
            />
          </View>
          <BottomTabBar
            items={tabBarItems}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      );
    }

    // Rooms tab — for owner and manager
    if (activeTab === 'rooms' && (dashboardRole === 'owner' || dashboardRole === 'manager')) {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.workspaceContainer}>
            <RoomsScreen
              onBack={() => setActiveTab('home')}
              onLogout={onLogout}
              role={dashboardRole}
            />
          </View>
          <BottomTabBar
            items={tabBarItems}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      );
    }

    // Complaints / Queries tab — for owner, manager, tenant
    if ((activeTab === 'complaints' || activeTab === 'queries') && (dashboardRole === 'owner' || dashboardRole === 'manager' || dashboardRole === 'tenant')) {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.workspaceContainer}>
            <ComplaintsScreen
              onBack={() => setActiveTab('home')}
              onLogout={onLogout}
              role={dashboardRole}
            />
          </View>
          <BottomTabBar
            items={tabBarItems}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      );
    }

    // My Room tab — for tenant
    if (activeTab === 'room' && dashboardRole === 'tenant') {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.workspaceContainer}>
            <MyRoomScreen
              onBack={() => setActiveTab('home')}
            />
          </View>
          <BottomTabBar
            items={tabBarItems}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      );
    }

    // History tab — for tenant
    if (activeTab === 'history' && dashboardRole === 'tenant') {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.workspaceContainer}>
            <PaymentHistoryScreen
              onBack={() => setActiveTab('home')}
              embedded={false}
            />
          </View>
          <BottomTabBar
            items={tabBarItems}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      );
    }

    // My Rent tab — for tenant
    if (activeTab === 'rent' && dashboardRole === 'tenant') {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.workspaceContainer}>
            <MyRentScreen
              onBack={() => setActiveTab('home')}
            />
          </View>
          <BottomTabBar
            items={tabBarItems}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      );
    }

    // Support tab — for tenant (raise complaint/request)
    if (activeTab === 'support' && dashboardRole === 'tenant') {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.workspaceContainer}>
            <RaiseComplaintScreen
              onBack={() => setActiveTab('home')}
            />
          </View>
          <BottomTabBar
            items={tabBarItems}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      );
    }

    // Profile / Account tab — use dedicated ProfileScreen
    if (activeTab === 'profile' || activeTab === 'account') {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.workspaceContainer}>
            <ProfileScreen
              onBack={() => setActiveTab('home')}
              onLogout={onLogout}
              role={dashboardRole}
              onProfileUpdated={onUserUpdate}
            />
          </View>
          <BottomTabBar
            items={tabBarItems}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.workspaceContainer}>
          <WorkspaceScreen
            routeKey={activeTab}
            role={dashboardRole}
            onBack={() => setActiveTab('home')}
            onLogout={onLogout}
          />
        </View>
        <BottomTabBar
          items={tabBarItems}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    );
  }

  function renderRoleDashboard() {
    const propertyTitle =
      dashboardRole === 'owner'
        ? 'Property Network'
        : dashboardRole === 'manager'
          ? 'Assigned Property'
          : 'Living Space';
    const contactLabel =
      dashboardRole === 'tenant'
        ? 'Contact Admin'
        : dashboardRole === 'manager'
          ? 'Call Owner'
          : 'Contact Manager';
    const rentActionLabel =
      dashboardRole === 'tenant'
        ? 'Coming Soon'
        : dashboardRole === 'manager'
          ? 'View Reports'
          : 'Review Reports';

    const rentCard = (
      <RentCard
        title={dashboardData.rentCard.title}
        dueDate={dashboardData.rentCard.dueDate}
        amount={dashboardData.rentCard.amount}
        period={dashboardData.rentCard.period}
        status={dashboardData.rentCard.status}
        actionLabel={rentActionLabel}
        onPayPress={() => dashboardRole === 'tenant' ? null : setActiveTab('reports')}
      />
    );

    const propertyCard = (
      <LivingSpace
        title={propertyTitle}
        contactLabel={contactLabel}
        propertyName={dashboardData.livingSpace.propertyName}
        roomInfo={dashboardData.livingSpace.roomInfo}
        roomType={dashboardData.livingSpace.roomType}
        propertyImage={dashboardData.livingSpace.propertyImage}
        manager={dashboardData.livingSpace.manager}
        onContactPress={() => setActiveTab(
          dashboardRole === 'tenant'
            ? 'support'
            : dashboardRole === 'owner'
              ? 'managers'
              : 'account'
        )}
      />
    );

    if (dashboardRole === 'tenant') {
      return (
        <>
          <DashboardQuickActions actions={dashboardData.quickActions} onActionPress={setActiveTab} />
          {rentCard}
          {propertyCard}
          <ComplaintsSection
            activeCount={dashboardData.complaints.activeCount}
            complaints={dashboardData.complaints.items}
            onRaiseComplaint={() => setActiveTab('support')}
          />
          <RecentPayments
            payments={dashboardData.recentPayments}
            onViewAll={() => setActiveTab('history')}
          />
        </>
      );
    }

    if (dashboardRole === 'manager') {
      return (
        <>
          <ManagementActions onAction={(id) => {
            if (id === 'add-tenant') setActiveTab('tenants');
            else if (id === 'add-room' || id === 'add-bed') setActiveTab('rooms');
          }} />
          <StatsGrid stats={dashboardData.stats} />
          <OccupancyOverview items={dashboardData.occupancy} />
          {rentCard}
          <ComplaintsSection
            activeCount={dashboardData.complaints.activeCount}
            complaints={dashboardData.complaints.items}
          />
          {propertyCard}
        </>
      );
    }

    return (
      <>
        <DashboardQuickActions actions={dashboardData.quickActions} onActionPress={setActiveTab} />
        <StatsGrid stats={dashboardData.stats} />
        {rentCard}
        <OccupancyOverview items={dashboardData.occupancy} />
        {propertyCard}
        <ComplaintsSection
          activeCount={dashboardData.complaints.activeCount}
          complaints={dashboardData.complaints.items}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadDashboardSummary}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <Header
          userName={dashboardData.user.name}
          userContact={dashboardData.user.contact}
          avatarUrl={dashboardData.user.avatar}
          onNotificationPress={() => console.log('Notifications')}
        />

        {dashboardRole !== 'tenant' ? (
          <>
            {dashboardRole === 'owner' ? (
              <SummaryNavCard
                count={dashboardData.propertySummary.currentProperties}
                icon="office-building-outline"
                label="Properties"
                subLabel="Active PG locations"
                onPress={() => setActiveTab('properties')}
              />
            ) : null}
            <SummaryNavCard
              count={dashboardData.tenantSummary.currentTenants}
              icon="account-group-outline"
              label="Current Tenants"
              subLabel="Total active residents"
              onPress={() => setActiveTab('tenants')}
            />
          </>
        ) : null}

        {summaryMessage ? (
          <View style={styles.messageBanner}>
            <Text style={styles.messageText}>{summaryMessage}</Text>
          </View>
        ) : null}

        {renderRoleDashboard()}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        items={tabBarItems}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

function DashboardQuickActions({
  actions,
  onActionPress,
}: {
  actions: readonly { id: string; label: string; icon: string }[];
  onActionPress: (id: string) => void;
}) {
  if (actions.length === 0) return null;
  return <QuickActions actions={actions} onActionPress={onActionPress} />;
}

function SummaryNavCard({
  count,
  icon,
  label,
  subLabel,
  onPress,
}: {
  count: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  subLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.summaryCard, pressed && styles.summaryCardPressed]}
    >
      <View style={styles.summaryIcon}>
        <MaterialCommunityIcons name={icon} size={24} color={Colors.primary} />
      </View>
      <View style={styles.summaryText}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summarySubLabel}>{subLabel}</Text>
      </View>
      <Text style={styles.summaryCount}>{count}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.clayBase,
  },
  scrollContent: {
    paddingBottom: 72,
    paddingTop: 10,
  },
  workspaceContainer: {
    flex: 1,
  },
  summaryCard: {
    minHeight: 92,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: '#E2F0FF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 7, height: 9 },
    elevation: 4,
  },
  summaryCardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.claySurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
  },
  summaryText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  summaryLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  summarySubLabel: {
    marginTop: 3,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  summaryCount: {
    color: Colors.primaryDark,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: FontWeight.bold,
  },
  messageBanner: {
    backgroundColor: Colors.errorBg,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.12)',
  },
  messageText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
});
