import React from 'react';
import { SymbolView } from 'expo-symbols';
import { Link, Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { ClipboardList, User, MapPin } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

function TabBarIcon(props: {
  name: 'clipboard-list' | 'user' | 'map-pin';
  color: string;
}) {
  if (props.name === 'clipboard-list') return <ClipboardList size={28} style={{ marginBottom: -3 }} color={props.color} />;
  if (props.name === 'map-pin') return <MapPin size={28} style={{ marginBottom: -3 }} color={props.color} />;
  return <User size={28} style={{ marginBottom: -3 }} color={props.color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  
  const orgType = (user as any)?.organizationFeatures?.company_type || (user as any)?.companyType;
  const isTrafficPolice = orgType === 'traffic_police';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Assigned',
          tabBarIcon: ({ color }) => <TabBarIcon name="clipboard-list" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={{ marginRight: 15 }}>
                {({ pressed }) => (
                  <SymbolView
                    name={{ ios: 'info.circle', android: 'info', web: 'info' }}
                    size={25}
                    tintColor={Colors[colorScheme].text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <TabBarIcon name="map-pin" color={color} />,
          href: isTrafficPolice ? '/(tabs)/alerts' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
