import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { themeColors } from '../../src/theme';

export default function ProfileScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="profile-screen"
    >
      <View style={styles.avatar} />
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.username}>@lucas_frescor</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>1,250 Relief Points</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>REVIEWS</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>SAVED</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  content: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: themeColors.primaryContainer,
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '600' },
  username: { color: themeColors.onSurfaceVariant, marginTop: 4 },
  badge: {
    marginTop: 16,
    backgroundColor: themeColors.secondaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: { color: themeColors.primary, fontWeight: '700', fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 32, width: '100%' },
  stat: {
    flex: 1,
    backgroundColor: themeColors.glassSurface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '700', color: themeColors.primary },
  statLabel: { fontSize: 10, fontWeight: '700', color: themeColors.secondary, marginTop: 4 },
});
