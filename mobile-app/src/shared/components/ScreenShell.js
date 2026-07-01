import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export function ScreenShell({ title, children }) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

export function PlaceholderBox({ text }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
  },
  body: {
    flex: 1,
    padding: 20,
  },
  placeholder: {
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  placeholderText: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 22,
  },
});
