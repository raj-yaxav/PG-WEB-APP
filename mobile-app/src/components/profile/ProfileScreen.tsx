import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/spacing';
import { apiUpload, workspaceApi } from '../../services/apiClient';
import type { User } from '../../types/auth.types';

type ProfileData = {
  id?: string;
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
  loginId?: string;
  role: string;
  status: string;
  profilePhotoUrl?: string;
  createdAt?: string;
};

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
  role: User['role'];
  onProfileUpdated?: (user: User) => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  tenant: 'Tenant',
};

function profileToUser(profile: ProfileData, fallbackRole: User['role']): User {
  return {
    id: profile.id || profile._id || '',
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    loginId: profile.loginId,
    role: (profile.role || fallbackRole) as User['role'],
    status: (profile.status || 'active') as User['status'],
    profilePhotoUrl: profile.profilePhotoUrl || '',
  };
}

function ModalSheet({
  children,
  onClose,
  disabled,
}: {
  children: React.ReactNode;
  onClose: () => void;
  disabled?: boolean;
}) {
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy * 0.45);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) {
          Animated.timing(translateY, {
            toValue: 300,
            duration: 180,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    translateY.setValue(0);
  });

  return (
    <Animated.View style={[styles.modalSheet, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
      <Pressable
        onPress={() => !disabled && onClose()}
        hitSlop={{ top: 10, bottom: 10, left: 50, right: 50 }}
        style={styles.modalHandleHitArea}
      >
        <View style={styles.modalHandle} />
      </Pressable>
      {children}
    </Animated.View>
  );
}

export function ProfileScreen({ onBack, onLogout, role, onProfileUpdated }: ProfileScreenProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Edit profile
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Password reveal
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verifyVisible, setVerifyVisible] = useState(false);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Profile photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  // Change password
  const [changePassVisible, setChangePassVisible] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const applyProfileUpdate = useCallback((updated: ProfileData) => {
    setProfile(updated);
    onProfileUpdated?.(profileToUser(updated, role));
  }, [onProfileUpdated, role]);

  const loadProfile = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError('');
      const data = await workspaceApi.me();
      applyProfileUpdate(data);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    } catch (err: any) {
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyProfileUpdate, fadeAnim, slideAnim]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile(false);
  }, [loadProfile]);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: onLogout },
    ]);
  }, [onLogout]);

  // ── Edit Profile ─────────────────────────────────────────────────────

  const openEdit = useCallback(() => {
    if (!profile) return;
    setEditName(profile.name);
    setEditPhone(profile.phone || '');
    setEditEmail(profile.email || '');
    setEditVisible(true);
  }, [profile]);

  const handleSaveProfile = useCallback(async () => {
    if (!editName.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      const updated = await workspaceApi.updateMe({
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
      });
      applyProfileUpdate(updated);
      setEditVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [applyProfileUpdate, editName, editPhone, editEmail]);

  // ── Password Reveal ───────────────────────────────────────────────────

  const openVerify = useCallback(() => {
    setVerifyInput('');
    setVerifyVisible(true);
  }, []);

  const handleVerifyPassword = useCallback(async () => {
    if (!verifyInput.trim()) {
      Alert.alert('Validation', 'Please enter your current password');
      return;
    }
    setVerifying(true);
    try {
      await workspaceApi.verifyPassword(verifyInput);
      setPasswordVerified(true);
      setVerifyVisible(false);
    } catch (err: any) {
      Alert.alert('Incorrect', err.message || 'Password verification failed');
    } finally {
      setVerifying(false);
    }
  }, [verifyInput]);

  // ── Change Password ──────────────────────────────────────────────────

  const openChangePass = useCallback(() => {
    setOldPw('');
    setNewPw('');
    setConfirmPw('');
    setChangePassVisible(true);
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (!oldPw.trim()) {
      Alert.alert('Validation', 'Enter your current password');
      return;
    }
    if (!newPw.trim() || newPw.length < 6) {
      Alert.alert('Validation', 'New password must be at least 6 characters');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Validation', 'New passwords do not match');
      return;
    }
    setChangingPass(true);
    try {
      await workspaceApi.changePassword(oldPw, newPw);
      setChangePassVisible(false);
      setPasswordVerified(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  }, [oldPw, newPw, confirmPw]);

  // ── Profile Photo Upload ──────────────────────────────────────────────

  const handlePickPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow access to your photo library to upload a profile picture');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    if (!asset.uri) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'profile.jpg',
      } as any);

      const uploadResult: any = await apiUpload('/uploads/image', formData);
      const imageUrl = uploadResult?.url || uploadResult?.data?.url;

      if (!imageUrl) throw new Error('No URL returned from upload');

      const updated = await workspaceApi.updateMe({ profilePhotoUrl: imageUrl });
      applyProfileUpdate(updated);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message || 'Could not upload image');
    } finally {
      setUploadingPhoto(false);
    }
  }, [applyProfileUpdate]);

  const handleRemovePhoto = useCallback(() => {
    if (!profile?.profilePhotoUrl || removingPhoto || uploadingPhoto) return;

    Alert.alert('Remove profile photo', 'Do you want to remove your current profile picture?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingPhoto(true);
          try {
            const updated = await workspaceApi.updateMe({ profilePhotoUrl: '' });
            applyProfileUpdate(updated);
          } catch (err: any) {
            Alert.alert('Remove failed', err.message || 'Could not remove profile picture');
          } finally {
            setRemovingPhoto(false);
          }
        },
      },
    ]);
  }, [applyProfileUpdate, profile?.profilePhotoUrl, removingPhoto, uploadingPhoto]);

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!profile) return null;

  const initials = getInitials(profile.name);
  const roleLabel = roleLabels[profile.role] || profile.role;
  const statusColor = profile.status === 'active' ? '#16A34A' : '#70819C';
  const shortUserId = (profile.id || profile._id || '').slice(-8).toUpperCase() || 'PROFILE';
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'New';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF']}
          />
        }
      >
        {/* ── Blue Hero Section ── */}
        <View style={styles.heroSection}>
          <View style={styles.heroTopRow}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.heroIconBtn, pressed && styles.heroIconBtnPressed]}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.heroTitle}>Profile</Text>
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [styles.heroIconBtn, pressed && styles.heroIconBtnPressed]}
            >
              <MaterialCommunityIcons name="refresh" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <Animated.View style={[styles.avatarSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.profileHeroCard}>
              <View style={styles.avatarOuterRing}>
                <View style={styles.avatarCircle}>
                  {uploadingPhoto || removingPhoto ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : profile.profilePhotoUrl ? (
                    <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  )}
                </View>
                <View style={styles.cameraOverlay}>
                  <MaterialCommunityIcons name="account-circle" size={15} color="#FFFFFF" />
                </View>
                <View style={styles.statusDot}>
                  <View style={[styles.statusDotInner, { backgroundColor: statusColor }]} />
                </View>
              </View>

              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileContact} numberOfLines={1}>
                {profile.email || profile.phone || profile.loginId || `${roleLabel} account`}
              </Text>

              <View style={styles.roleRow}>
                <View style={[styles.roleBadge, { backgroundColor: profile.role === 'owner' ? '#FBBF24' : profile.role === 'manager' ? '#818CF8' : '#34D399' }]}>
                  <Text style={styles.roleBadgeText}>{roleLabel}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor === '#16A34A' ? '#DCFCE7' : '#E4EEFC' }]}>
                  <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                    {(profile.status || 'active').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.profileMetaGrid}>
                <View style={styles.profileMetaCard}>
                  <MaterialCommunityIcons name="identifier" size={18} color="#155EEF" />
                  <Text style={styles.profileMetaValue}>{shortUserId}</Text>
                  <Text style={styles.profileMetaLabel}>User ID</Text>
                </View>
                <View style={styles.profileMetaCard}>
                  <MaterialCommunityIcons name="calendar-star" size={18} color="#155EEF" />
                  <Text style={styles.profileMetaValue}>{memberSince}</Text>
                  <Text style={styles.profileMetaLabel}>Member</Text>
                </View>
                <View style={styles.profileMetaCard}>
                  <MaterialCommunityIcons name="shield-check-outline" size={18} color="#155EEF" />
                  <Text style={styles.profileMetaValue}>{passwordVerified ? 'Verified' : 'Protected'}</Text>
                  <Text style={styles.profileMetaLabel}>Security</Text>
                </View>
              </View>

              <View style={styles.photoActionRow}>
                <Pressable
                  onPress={handlePickPhoto}
                  disabled={uploadingPhoto || removingPhoto}
                  style={({ pressed }) => [
                    styles.photoActionPrimary,
                    (uploadingPhoto || removingPhoto) && styles.photoActionDisabled,
                    pressed && styles.photoActionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Upload profile photo"
                >
                  <MaterialCommunityIcons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.photoActionPrimaryText}>
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleRemovePhoto}
                  disabled={!profile.profilePhotoUrl || uploadingPhoto || removingPhoto}
                  style={({ pressed }) => [
                    styles.photoActionSecondary,
                    (!profile.profilePhotoUrl || uploadingPhoto || removingPhoto) && styles.photoActionDisabled,
                    pressed && profile.profilePhotoUrl && styles.photoActionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Remove profile photo"
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#1D4ED8" />
                  <Text style={styles.photoActionSecondaryText}>
                    {removingPhoto ? 'Removing...' : 'Remove'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── Info Cards ── */}
        <View style={styles.cardsSection}>
          <Animated.View style={[styles.quickPanel, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.quickPanelHeader}>
              <Text style={styles.quickPanelTitle}>Profile Controls</Text>
              <Text style={styles.quickPanelSub}>Fast account actions</Text>
            </View>
            <View style={styles.quickGrid}>
              <Pressable
                onPress={openEdit}
                style={({ pressed }) => [styles.quickTile, styles.quickTilePrimary, pressed && styles.quickTilePressed]}
                accessibilityRole="button"
                accessibilityLabel="Edit profile details"
              >
                <View style={styles.quickTileIcon}>
                  <MaterialCommunityIcons name="account-edit-outline" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.quickTileTitle}>Edit Info</Text>
                <Text style={styles.quickTileText}>Name, phone, email</Text>
              </Pressable>

              <Pressable
                onPress={openChangePass}
                style={({ pressed }) => [styles.quickTile, pressed && styles.quickTilePressed]}
                accessibilityRole="button"
                accessibilityLabel="Change password"
              >
                <View style={[styles.quickTileIcon, styles.quickTileIconLight]}>
                  <MaterialCommunityIcons name="key-chain" size={22} color="#155EEF" />
                </View>
                <Text style={styles.quickTileTitleDark}>Password</Text>
                <Text style={styles.quickTileTextDark}>Update security</Text>
              </Pressable>
            </View>
          </Animated.View>
          {/* ── Account Details (editable) ── */}
          <Animated.View style={[styles.infoCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>Account Details</Text>
              <Pressable
                onPress={openEdit}
                style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
              >
                <MaterialCommunityIcons name="pencil" size={14} color={Colors.primary} />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <MaterialCommunityIcons name="account-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{profile.name}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <MaterialCommunityIcons name="email-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile.email || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <MaterialCommunityIcons name="phone-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profile.phone || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <MaterialCommunityIcons name="card-account-details-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Login ID</Text>
                <Text style={styles.infoValue}>{profile.loginId || `${roleLabel} email login`}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Password Section ── */}
          <Animated.View style={[styles.infoCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>Password</Text>
              {passwordVerified && (
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons name="check-circle" size={14} color="#16A34A" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>

            {/* Masked password */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Current Password</Text>
                <Text style={styles.infoValue}>••••••••</Text>
              </View>
              <Pressable
                onPress={openVerify}
                style={({ pressed }) => [styles.iconActionBtn, pressed && styles.iconActionBtnPressed]}
              >
                <MaterialCommunityIcons
                  name={passwordVerified ? 'eye' : 'eye-off-outline'}
                  size={20}
                  color={passwordVerified ? '#16A34A' : Colors.textTertiary}
                />
              </Pressable>
            </View>

            <View style={styles.infoDivider} />

            <Pressable
              onPress={openChangePass}
              style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
            >
              <MaterialCommunityIcons name="key-change" size={18} color={Colors.primary} />
              <Text style={styles.actionRowText}>Change Password</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textTertiary} />
            </Pressable>
          </Animated.View>

          {/* ── Account Info ── */}
          <Animated.View style={[styles.infoCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.cardSectionTitle}>Account Info</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <MaterialCommunityIcons name="shield-account-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{roleLabel}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            {profile.createdAt ? (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <MaterialCommunityIcons name="calendar-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Member Since</Text>
                    <Text style={styles.infoValue}>
                      {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />
              </>
            ) : null}

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <MaterialCommunityIcons name="fingerprint" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>User ID</Text>
                <Text style={styles.infoValue}>{(profile.id || profile._id || '').slice(-8).toUpperCase()}</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── Logout Button (top spacing pushes it past bottom tab bar) ── */}
        <View style={styles.logoutSection}>
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* EDIT PROFILE MODAL */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Modal visible={editVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => !saving && setEditVisible(false)} />
          <ModalSheet onClose={() => setEditVisible(false)} disabled={saving}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              style={styles.fieldInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.fieldInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Email address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setEditVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSaveBtn, saving && styles.modalSaveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </ModalSheet>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* VERIFY PASSWORD MODAL (to reveal password) */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Modal visible={verifyVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => !verifying && setVerifyVisible(false)} />
          <ModalSheet onClose={() => setVerifyVisible(false)} disabled={verifying}>
            <View style={styles.verifyHeaderRow}>
              <MaterialCommunityIcons name="lock-outline" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Verify Password</Text>
            </View>
            <Text style={styles.modalSubtitle}>Enter your current password to reveal the password field</Text>

            <TextInput
              style={styles.fieldInput}
              value={verifyInput}
              onChangeText={setVerifyInput}
              placeholder="Current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setVerifyVisible(false)}
                disabled={verifying}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSaveBtn, verifying && styles.modalSaveBtnDisabled]}
                onPress={handleVerifyPassword}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Verify</Text>
                )}
              </Pressable>
            </View>
          </ModalSheet>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* CHANGE PASSWORD MODAL */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Modal visible={changePassVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => !changingPass && setChangePassVisible(false)} />
          <ModalSheet onClose={() => setChangePassVisible(false)} disabled={changingPass}>
            <View style={styles.verifyHeaderRow}>
              <MaterialCommunityIcons name="key-change" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Change Password</Text>
            </View>

            <Text style={styles.fieldLabel}>Old Password</Text>
            <TextInput
              style={styles.fieldInput}
              value={oldPw}
              onChangeText={setOldPw}
              placeholder="Enter current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <Text style={styles.fieldLabel}>New Password</Text>
            <TextInput
              style={styles.fieldInput}
              value={newPw}
              onChangeText={setNewPw}
              placeholder="At least 6 characters"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.fieldInput}
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder="Re-enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setChangePassVisible(false)}
                disabled={changingPass}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSaveBtn, changingPass && styles.modalSaveBtnDisabled]}
                onPress={handleChangePassword}
                disabled={changingPass}
              >
                {changingPass ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Update</Text>
                )}
              </Pressable>
            </View>
          </ModalSheet>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6FAFF',
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // ── Blue Hero Section ────────────────────────────────────────────────
  heroSection: {
    backgroundColor: '#155EEF',
    marginTop: -60,
    paddingTop: 96,
    paddingBottom: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: '#0B3B8F',
    shadowOpacity: 0.26,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroIconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
  heroTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  profileHeroCard: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    shadowColor: '#0B3B8F',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 8, height: 12 },
    elevation: 8,
  },
  avatarOuterRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#B9D9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 6,
  },
  avatarCircle: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#155EEF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: 98,
    height: 98,
    borderRadius: 49,
  },
  avatarInitials: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  profileName: {
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  profileContact: {
    marginTop: 4,
    marginBottom: Spacing.md,
    maxWidth: '92%',
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: FontSize.xs,
    color: '#1F2937',
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.3,
  },
  profileMetaGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  profileMetaCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 18,
    backgroundColor: '#F1F7FF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  profileMetaValue: {
    marginTop: 5,
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: FontWeight.extrabold,
    textAlign: 'center',
  },
  profileMetaLabel: {
    marginTop: 2,
    fontSize: 9,
    color: Colors.textTertiary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  photoActionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  photoActionPrimary: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#155EEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  photoActionSecondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFD6F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  photoActionPressed: {
    opacity: 0.82,
  },
  photoActionDisabled: {
    opacity: 0.5,
  },
  photoActionPrimaryText: {
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    fontWeight: FontWeight.extrabold,
  },
  photoActionSecondaryText: {
    fontSize: FontSize.sm,
    color: '#1D4ED8',
    fontWeight: FontWeight.extrabold,
  },

  // ── Info Cards ────────────────────────────────────────────────────────
  cardsSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  quickPanel: {
    borderRadius: 28,
    backgroundColor: '#DCEEFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    padding: Spacing.md,
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 6, height: 10 },
    elevation: 5,
  },
  quickPanelHeader: {
    marginBottom: Spacing.md,
  },
  quickPanelTitle: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.extrabold,
  },
  quickPanelSub: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickTile: {
    flex: 1,
    minHeight: 124,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  quickTilePrimary: {
    backgroundColor: '#155EEF',
    borderColor: '#155EEF',
    shadowColor: '#155EEF',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  quickTilePressed: {
    opacity: 0.86,
  },
  quickTileIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTileIconLight: {
    backgroundColor: '#EAF4FF',
  },
  quickTileTitle: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: '#FFFFFF',
    fontWeight: FontWeight.extrabold,
  },
  quickTileText: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: '#DCEBFF',
    fontWeight: FontWeight.semibold,
  },
  quickTileTitleDark: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.extrabold,
  },
  quickTileTextDark: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E4EEFC',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 4, height: 9 },
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  cardSectionTitle: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.extrabold,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryBg,
  },
  editBtnText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#DCFCE7',
  },
  verifiedText: {
    fontSize: FontSize.xs,
    color: '#16A34A',
    fontWeight: FontWeight.bold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 7,
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#EDF5FF',
    marginVertical: Spacing.sm,
  },
  iconActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
  },
  iconActionBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  actionRowText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },

  // ── Logout Section ────────────────────────────────────────────────────
  logoutSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 40,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.12)',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logoutBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  logoutText: {
    fontSize: FontSize.md,
    color: Colors.error,
    fontWeight: FontWeight.bold,
  },

  // ── Modals ────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: Colors.clayBase,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 20,
  },
  modalHandleHitArea: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D9E8',
  },
  modalTitle: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  verifyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
    marginTop: Spacing.md,
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: Colors.shadowDeep,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  modalCancelText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeight.bold,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnDisabled: {
    opacity: 0.6,
  },
  modalSaveText: {
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },

  // ── Loading / Error ───────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.clayBase,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.clayBase,
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
  },
  retryText: {
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
});
