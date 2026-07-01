/**
 * app/screens/dashboard/HomeScreen.tsx — Tenant Dashboard
 *
 * ─────────────────────────────────────────────────────
 * UI SPEC (from design image):
 * ─────────────────────────────────────────────────────
 * Layout:
 *   - Full screen, light gray background (#F3F4F6)
 *   - Scrollable content
 *   - Fixed bottom tab bar
 *
 * Content (top to bottom):
 *   1. HEADER
 *      - Profile avatar (left)
 *      - "WELCOME BACK," + "Hi, Sajibur!" (center-left)
 *      - Calendar + Notification icons (right)
 *
 *   2. STATUS BADGE
 *      - Shield icon + "KYC Verified Tenant" + "ACTIVE" purple badge
 *
 *   3. QUICK ACTIONS (4-column grid)
 *      - My Room (bed icon)
 *      - Pay Rent (wallet icon)
 *      - History (clock icon)
 *      - Support (chat icon)
 *
 *   4. RENT CARD (purple gradient)
 *      - "September Rent" + "Unpaid" badge
 *      - "Due on Oct 05, 2023"
 *      - "$1,250" large + "/ month"
 *      - "⚡ Pay Now" white button
 *
 *   5. LIVING SPACE
 *      - "Living Space" heading + "..." more
 *      - Property card: image + "URBAN OAKS RESIDENCY" + room info
 *      - Manager card: avatar + "MANAGER" + "Alex Rivera"
 *      - Contact Admin card
 *
 *   6. COMPLAINTS
 *      - "⚠️ Complaints" + "1 ACTIVE" red badge
 *      - Complaint card: icon + title + desc + "IN PROGRESS" orange
 *      - "+ Raise New Complaint" dashed button
 *
 *   7. RECENT PAYMENTS
 *      - "Recent Payments" + "View All"
 *      - Payment rows: icon + title + date + amount + "SUCCESS" green
 *
 *   8. BOTTOM TAB BAR
 *      - HOME (active, purple)
 *      - RENT
 *      - CHAT
 *      - PROFILE
 *
 * Colors:
 *   - Background: #F3F4F6
 *   - Primary: #6366F1
 *   - Cards: #FFFFFF
 *   - Success: #22C55E
 *   - Error: #EF4444
 *   - Warning: #F59E0B
 * ─────────────────────────────────────────────────────
 */

import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  SafeAreaView,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { createDashboardData, TabBarItems } from '../../constants/mockData';
import { Header } from '../../components/dashboard/Header';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { RentCard } from '../../components/dashboard/RentCard';
import { LivingSpace } from '../../components/dashboard/LivingSpace';
import { ComplaintsSection } from '../../components/dashboard/ComplaintsSection';
import { RecentPayments } from '../../components/dashboard/RecentPayments';
import { BottomTabBar } from '../../components/dashboard/BottomTabBar';
import type { User } from '../../types/auth.types';

interface HomeScreenProps {
  user: User | null;
  onLogout: () => void;
}

export function HomeScreen({ user, onLogout }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState('home');
  const dashboardData = useMemo(() => createDashboardData(user), [user]);

  function handleTabPress(id: string) {
    if (id === 'logout') {
      onLogout();
      return;
    }
    setActiveTab(id);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Header
          userName={dashboardData.user.name}
          avatarUrl={dashboardData.user.avatar}
          onCalendarPress={() => console.log('Calendar')}
          onNotificationPress={() => console.log('Notifications')}
        />

        {/* KYC Status */}
        <StatusBadge
          label={dashboardData.status.label}
          badgeText={dashboardData.status.badge}
        />

        {/* Quick Actions */}
        <QuickActions
          actions={dashboardData.quickActions}
          onActionPress={(id) => console.log('Action:', id)}
        />

        {/* Rent Card */}
        <RentCard
          title={dashboardData.rentCard.title}
          dueDate={dashboardData.rentCard.dueDate}
          amount={dashboardData.rentCard.amount}
          period={dashboardData.rentCard.period}
          status={dashboardData.rentCard.status}
          onPayPress={() => console.log('Pay Now')}
        />

        {/* Living Space */}
        <LivingSpace
          propertyName={dashboardData.livingSpace.propertyName}
          roomInfo={dashboardData.livingSpace.roomInfo}
          roomType={dashboardData.livingSpace.roomType}
          propertyImage={dashboardData.livingSpace.propertyImage}
          manager={dashboardData.livingSpace.manager}
          onContactPress={() => console.log('Contact Admin')}
        />

        {/* Complaints */}
        <ComplaintsSection
          activeCount={dashboardData.complaints.activeCount}
          complaints={dashboardData.complaints.items}
          onRaiseComplaint={() => console.log('Raise Complaint')}
        />

        {/* Recent Payments */}
        <RecentPayments
          payments={dashboardData.recentPayments}
          onViewAll={() => console.log('View All')}
        />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        items={TabBarItems}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
