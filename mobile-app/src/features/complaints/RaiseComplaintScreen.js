import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { workspaceApi } from '../../services/apiClient';

const categories = [
  { id: 'electricity', label: 'Electricity', icon: 'flash', helper: 'Power, fan, switch or meter issue' },
  { id: 'water', label: 'Water', icon: 'water', helper: 'Supply, leakage or purifier issue' },
  { id: 'wifi', label: 'WiFi', icon: 'wifi', helper: 'Internet speed or connectivity' },
  { id: 'cleaning', label: 'Cleaning', icon: 'broom', helper: 'Room, bathroom or common area' },
  { id: 'food', label: 'Food', icon: 'food', helper: 'Meal quality, timing or menu' },
  { id: 'furniture', label: 'Furniture', icon: 'table-chair', helper: 'Bed, table, chair or cupboard' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal-circle', helper: 'Anything else you need help with' },
];

const categoryIcons = {};
categories.forEach((item) => {
  categoryIcons[item.id] = item.icon;
});

export function RaiseComplaintScreen({ onBack }) {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === category),
    [category]
  );

  const canSubmit = Boolean(category && title.trim()) && !submitting;

  async function handleSubmit() {
    setErrorMessage('');

    if (!category) {
      setErrorMessage('Select a query category so the team can route it correctly.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Add a short query title before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await workspaceApi.complaints.create({
        category,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      Alert.alert('Query Submitted', 'Your query has been sent to the property team.', [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (err) {
      const message = err?.message || 'Failed to submit query. Please check your connection and try again.';
      setErrorMessage(message);
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>Tenant Support</Text>
          <Text style={styles.headerTitle}>Raise a Query</Text>
        </View>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="chat-question-outline" size={28} color="#1D4ED8" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>How can we help today?</Text>
            <Text style={styles.heroText}>
              Share your query with clear details. The property team can review it, add notes, and update the status.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose category</Text>
          <Text style={styles.requiredText}>Required</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRail}
        >
          {categories.map((item) => {
            const active = category === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.id)}
                style={({ pressed }) => [
                  styles.categoryPill,
                  active && styles.categoryPillActive,
                  pressed && styles.categoryPillPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${item.label} query category`}
              >
                <View style={[styles.categoryPillIcon, active && styles.categoryPillIconActive]}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={19}
                    color={active ? '#FFFFFF' : '#155EEF'}
                  />
                </View>
                <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                  {item.label}
                </Text>
                {active ? (
                  <MaterialCommunityIcons name="check-circle" size={17} color="#155EEF" />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.categoryPreviewCard}>
          <View style={styles.categoryPreviewIcon}>
            <MaterialCommunityIcons
              name={selectedCategory?.icon || 'cursor-default-click-outline'}
              size={24}
              color="#155EEF"
            />
          </View>
          <View style={styles.categoryPreviewCopy}>
            <Text style={styles.categoryPreviewLabel}>
              {selectedCategory ? selectedCategory.label : 'No category selected'}
            </Text>
            <Text style={styles.categoryPreviewText}>
              {selectedCategory
                ? selectedCategory.helper
                : 'Pick one category above so your query reaches the right team.'}
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitle}>Query details</Text>
              <Text style={styles.formSubtitle}>
                {selectedCategory ? `${selectedCategory.label} selected` : 'Select a category to start'}
              </Text>
            </View>
            {selectedCategory ? (
              <View style={styles.selectedBadge}>
                <MaterialCommunityIcons
                  name={categoryIcons[category] || 'clipboard-text'}
                  size={14}
                  color="#1D4ED8"
                />
                <Text style={styles.selectedBadgeText}>{selectedCategory.label}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.fieldLabel}>Query title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="Example: WiFi not working in my room"
            placeholderTextColor="#8DA0B8"
            maxLength={80}
            returnKeyType="next"
          />
          <Text style={styles.helperText}>Keep it short so staff can scan it quickly.</Text>

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add room details, timing, and what you already tried."
            placeholderTextColor="#8DA0B8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.counterText}>{description.length}/500</Text>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>What happens next</Text>
          {[
            ['send-circle-outline', 'Submitted', 'Your query reaches the property team.'],
            ['clipboard-check-outline', 'Reviewed', 'Manager checks category and priority.'],
            ['check-decagram-outline', 'Updated', 'You can track status from your queries tab.'],
          ].map(([icon, label, copy]) => (
            <View key={label} style={styles.timelineRow}>
              <View style={styles.timelineIcon}>
                <MaterialCommunityIcons name={icon} size={17} color="#1D4ED8" />
              </View>
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineLabel}>{label}</Text>
                <Text style={styles.timelineText}>{copy}</Text>
              </View>
            </View>
          ))}
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#B42318" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            !canSubmit && styles.submitBtnDisabled,
            pressed && canSubmit && styles.submitBtnPressed,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit, busy: submitting }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>Submit Query</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EAF4FF',
  },
  header: {
    backgroundColor: '#155EEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#0B3B8F',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  backBtnPlaceholder: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.72,
  },
  headerCopy: {
    alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 11,
    color: '#DCEBFF',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    marginTop: 2,
    fontSize: 19,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 112,
  },
  heroCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 24,
    backgroundColor: '#CFE6FF',
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAF4FF',
    shadowColor: '#1E40AF',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 8, height: 12 },
    elevation: 6,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '900',
  },
  heroText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: '#38506C',
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '900',
  },
  requiredText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  categoryRail: {
    gap: 10,
    paddingRight: 12,
  },
  categoryPill: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    paddingLeft: 8,
    paddingRight: 14,
    shadowColor: '#1E40AF',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 3, height: 7 },
    elevation: 3,
  },
  categoryPillActive: {
    backgroundColor: '#DCEEFF',
    borderColor: '#155EEF',
  },
  categoryPillPressed: {
    opacity: 0.86,
  },
  categoryPillIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillIconActive: {
    backgroundColor: '#155EEF',
  },
  categoryPillText: {
    fontSize: 14,
    color: '#102033',
    fontWeight: '900',
  },
  categoryPillTextActive: {
    color: '#123E9C',
  },
  categoryPreviewCard: {
    marginTop: 12,
    minHeight: 92,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1E40AF',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 5, height: 8 },
    elevation: 4,
  },
  categoryPreviewIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPreviewCopy: {
    flex: 1,
  },
  categoryPreviewLabel: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '900',
  },
  categoryPreviewText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#58708C',
    fontWeight: '700',
  },
  formCard: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCEBFF',
    shadowColor: '#1E40AF',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 6, height: 10 },
    elevation: 4,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 17,
    color: '#0F172A',
    fontWeight: '900',
  },
  formSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  selectedBadge: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#EAF4FF',
    paddingHorizontal: 10,
  },
  selectedBadgeText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '900',
  },
  fieldLabel: {
    marginTop: 12,
    marginBottom: 7,
    fontSize: 12,
    color: '#243B55',
    fontWeight: '900',
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#F7FBFF',
    borderWidth: 1,
    borderColor: '#CFE0F5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
    color: '#0F172A',
    fontWeight: '600',
  },
  textArea: {
    minHeight: 122,
    paddingTop: 12,
  },
  helperText: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: '#6B7C93',
    fontWeight: '600',
  },
  counterText: {
    marginTop: 6,
    alignSelf: 'flex-end',
    fontSize: 11,
    color: '#7A8CA4',
    fontWeight: '700',
  },
  timelineCard: {
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: '#DCEEFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F7FBFF',
  },
  timelineTitle: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '900',
    marginBottom: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCopy: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 13,
    color: '#17324D',
    fontWeight: '900',
  },
  timelineText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: '#49647F',
    fontWeight: '600',
  },
  errorBox: {
    marginTop: 16,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#B42318',
    fontWeight: '800',
  },
  submitBtn: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#155EEF',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  submitBtnPressed: {
    opacity: 0.9,
  },
  submitBtnDisabled: {
    opacity: 0.48,
  },
  submitText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
