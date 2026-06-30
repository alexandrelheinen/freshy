import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { themeColors } from '../../src/theme';

const categories = [
  'Cafés',
  'Restaurants',
  'Bars',
  'Libraries',
  'Malls & Shops',
  'Museums',
  'Coworking',
];

export default function CoolingScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="cooling-screen"
    >
      <Text style={styles.title}>Categories</Text>
      <Text style={styles.subtitle}>Find the perfect refuge from the heat.</Text>
      <View style={styles.grid}>
        {categories.map((cat) => (
          <View key={cat} style={styles.card}>
            <Text style={styles.cardTitle}>{cat}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '600', color: themeColors.onSurface },
  subtitle: { color: themeColors.onSurfaceVariant, marginTop: 8, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    backgroundColor: themeColors.glassSurface,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    justifyContent: 'center',
  },
  cardTitle: { fontWeight: '600', textAlign: 'center' },
});
