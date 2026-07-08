import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthService } from '../../core/services/authService';
import { ComplaintStatusScreen } from '../complaints/ComplaintStatusScreen';
import { MyRentScreen } from '../rent/MyRentScreen';
import { ProfileScreen } from '../profile/ProfileScreen';
import { ScreenShell, PlaceholderBox } from '../../shared/components/ScreenShell';

function HomeTab() {
  return (
    <ScreenShell title="Home">
      {/*
        UI TODO:
        - Show greeting with tenant name.
        - Show current room/bed.
        - Show current rent due card.
        - Show complaint shortcut.
        - Show payment history shortcut.
        - Show profile shortcut.
        - Bottom navigation: Home, Rent, Complaints, Profile.
      */}
      <PlaceholderBox text="Home dashboard UI will be designed later." />
    </ScreenShell>
  );
}

const tabs = [
  { key: 'home', label: 'Home', component: HomeTab },
  { key: 'rent', label: 'Rent', component: MyRentScreen },
  { key: 'complaints', label: 'Queries', component: ComplaintStatusScreen },
  { key: 'profile', label: 'Profile', component: ProfileScreen },
];

export function HomeScreen({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const ActiveComponent = tabs.find((tab) => tab.key === activeTab)?.component || HomeTab;

  async function handleLogout() {
    await AuthService.logout();
    onLogout();
  }

  return (
    <View style={styles.container}>
      <ActiveComponent onLogout={handleLogout} />
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    color: '#6b7280',
    fontWeight: '700',
  },
  activeTabText: {
    color: '#2563eb',
  },
});
