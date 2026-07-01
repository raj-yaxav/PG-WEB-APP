import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, FontWeight } from '../../constants/spacing';

interface TabItem {
  id: string;
  label: string;
  icon: string;
}

interface BottomTabBarProps {
  items: readonly TabItem[];
  activeTab: string;
  onTabPress: (id: string) => void;
}

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  calendar: 'calendar-outline',
  chat: 'chatbubble-ellipses-outline',
  user: 'person-outline',
  logout: 'log-out-outline',
};

export function BottomTabBar({ items, activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {items.map((item) => {
          const isActive = item.id === activeTab;
          const isLogout = item.id === 'logout';
          return (
            <Pressable
              key={item.id}
              onPress={() => onTabPress(item.id)}
              style={styles.tabItem}
            >
              <Ionicons
                name={iconMap[item.icon] || 'ellipse-outline'}
                size={22}
                color={isLogout ? Colors.error : isActive ? Colors.primary : Colors.textTertiary}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.label,
                  isActive && styles.activeLabel,
                  isLogout && styles.logoutLabel,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    minWidth: 58,
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: Colors.primary,
  },
  logoutLabel: {
    color: Colors.error,
  },
});
