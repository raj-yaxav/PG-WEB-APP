import { Pressable, StyleSheet, Text } from 'react-native';
import { ScreenShell, PlaceholderBox } from '../../shared/components/ScreenShell';

export function ProfileScreen({ onLogout }) {
  return (
    <ScreenShell title="Profile">
      {/*
        UI TODO:
        - Tenant photo.
        - Name.
        - Phone.
        - Email.
        - Guardian phone.
        - Address.
        - KYC status.
        - Logout button.
      */}
      <PlaceholderBox text="Profile UI will be designed later." />
      <Pressable onPress={onLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    minHeight: 46,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    color: '#b91c1c',
    fontWeight: '800',
  },
});
