import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PlaceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <ScrollView style={styles.container} testID="place-detail-screen">
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Ice Coffee Central</Text>
        <Text style={styles.slug}>{slug}</Text>
      </View>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>INTERIOR</Text>
          <Text style={styles.metricValue}>19°C</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>AC</Text>
          <Text style={styles.metricValue}>Frigid</Text>
        </View>
      </View>
      <Text style={styles.description}>O refúgio perfeito para escapar do calor urbano.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fb' },
  hero: {
    height: 220,
    backgroundColor: '#87ceeb',
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '700' },
  slug: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  metrics: { flexDirection: 'row', gap: 12, padding: 20, marginTop: -24 },
  metric: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricLabel: { fontSize: 10, fontWeight: '700', color: '#4f616a' },
  metricValue: { fontSize: 24, fontWeight: '700', color: '#0c6780', marginTop: 4 },
  description: { paddingHorizontal: 20, color: '#3f484c', lineHeight: 22 },
});
