import { View, Text, StyleSheet } from 'react-native';
import { BRAND_NAME } from '@freshy/ui';

export default function ExploreScreen() {
  return (
    <View style={styles.container} testID="explore-screen">
      <Text style={styles.title}>{BRAND_NAME}</Text>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Cooling Map</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Arctic Brew Coffee</Text>
        <Text style={styles.cardMeta}>250m • 19°C • Frigid</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fb', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#0c6780', marginBottom: 16 },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#cfe3ee',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 100,
  },
  mapText: { color: '#4f616a', fontWeight: '600' },
  card: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardMeta: { color: '#4f616a', marginTop: 4 },
});
