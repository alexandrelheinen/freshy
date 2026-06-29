import { View, Text, StyleSheet, ScrollView } from 'react-native';

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
  container: { flex: 1, backgroundColor: '#f7f9fb' },
  content: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#87ceeb', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '600' },
  username: { color: '#3f484c', marginTop: 4 },
  badge: {
    marginTop: 16,
    backgroundColor: 'rgba(135,206,235,0.3)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: { color: '#0c6780', fontWeight: '700', fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 32, width: '100%' },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#0c6780' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#4f616a', marginTop: 4 },
});
