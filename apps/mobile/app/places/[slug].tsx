import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { themeColors } from '../../src/theme';

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
      <Text style={styles.description}>The perfect refuge from urban heat.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  hero: {
    height: 220,
    backgroundColor: themeColors.primaryContainer,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroTitle: { color: themeColors.onScrim, fontSize: 28, fontWeight: '700' },
  slug: { color: themeColors.onPrimaryContainer, marginTop: 4 },
  metrics: { flexDirection: 'row', gap: 12, padding: 20, marginTop: -24 },
  metric: {
    flex: 1,
    backgroundColor: themeColors.markerLabelBg,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricLabel: { fontSize: 10, fontWeight: '700', color: themeColors.secondary },
  metricValue: { fontSize: 24, fontWeight: '700', color: themeColors.primary, marginTop: 4 },
  description: { paddingHorizontal: 20, color: themeColors.onSurfaceVariant, lineHeight: 22 },
});
