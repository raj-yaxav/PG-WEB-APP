import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

interface BottomTabBarProps {
  items: readonly TabItem[];
  activeTab: string;
  onTabPress: (id: string) => void;
}

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  calendar: 'calendar-outline',
  chat: 'chatbubbles-outline',
  support: 'help-circle-outline',
  user: 'person-circle-outline',
  logout: 'power',
  properties: 'business-outline',
  reports: 'document-text-outline',
  tenants: 'people-outline',
  beds: 'bed-outline',
  rooms: 'bed-outline',
  issues: 'alert-circle-outline',
  managers: 'person-outline',
};

const PRIMARY = Colors.primary ?? '#4F46E5';
const BAR_BG = '#101A3D'; // dark bluish

export function BottomTabBar({ items, activeTab, onTabPress }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const visibleItems = items.slice(0, 6);
  const tabWidth = (width - Spacing.md * 2 - 16) / visibleItems.length;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {visibleItems.map((item) => (
          <TabButton
            key={item.id}
            item={item}
            isActive={item.id === activeTab}
            onPress={() => onTabPress(item.id)}
            width={tabWidth}
          />
        ))}
      </View>
    </View>
  );
}

function TabButton({
  item,
  isActive,
  onPress,
  width,
}: {
  item: TabItem;
  isActive: boolean;
  onPress: () => void;
  width: number;
}) {
  const progress = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const iconName = iconMap[item.icon] || 'ellipse';

  useEffect(() => {
    Animated.spring(progress, {
      toValue: isActive ? 1 : 0,
      friction: 10,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [isActive, progress]);

  const pillStyle = {
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
    backgroundColor: progress.interpolate({
      inputRange: [0, 1],
      outputRange: ['transparent', PRIMARY],
    }),
    width: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [48, Math.min(width - 8, 108)],
    }),
  };

  // topLabel removed — do not show icon name on click

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.pill, pillStyle]}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={22} color="#FFFFFF" />
          {!!item.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge > 9 ? '9+' : item.badge}</Text>
            </View>
          )}
        </View>
        {/* icon name label hidden on click per user request */}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.md,
    paddingBottom: 8,
  },
  tabBar: {
    height: 64,
    borderRadius: 32,
    backgroundColor: BAR_BG,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  tabItem: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'visible',
  },
  iconWrap: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLabel: {
    position: 'absolute',
    top: -34,
    alignSelf: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 6,
    backgroundColor: 'transparent',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 4,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
