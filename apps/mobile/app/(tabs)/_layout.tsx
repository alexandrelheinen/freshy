import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 10, fontWeight: '700', color: focused ? '#0c6780' : '#4f616a' }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0c6780',
        tabBarInactiveTintColor: '#4f616a',
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarLabel: ({ focused }) => <TabLabel label="EXPLORE" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cooling"
        options={{
          title: 'Cooling',
          tabBarLabel: ({ focused }) => <TabLabel label="COOLING" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: ({ focused }) => <TabLabel label="PROFILE" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
