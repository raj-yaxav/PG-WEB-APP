/**
 * PG Manager — Shield Logo Icon
 * Used on Sign In and Sign Up screens
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { BorderRadius } from '../constants/spacing';

interface ShieldLogoProps {
  size?: number;
}

export function ShieldLogo({ size = 80 }: ShieldLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={styles.shield}>
        <View style={styles.checkmark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  shield: {
    width: 40,
    height: 48,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 16,
    height: 8,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: Colors.textInverse,
    transform: [{ rotate: '-45deg' }],
    marginTop: -4,
  },
});