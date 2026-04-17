import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, FlatList, SafeAreaView, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { officerService } from '../../api/officerService';
import { useOfficerAlerts } from '../../hooks/useOfficerAlerts';
import { MapPin, Navigation, ShieldAlert, Clock, AlertTriangle } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Sample coordinates for Addis Ababa if current location fails
const defaultRegion = {
  latitude: 9.0300,
  longitude: 38.7400,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function AlertsScreen() {
  const router = useRouter();
  const { isConnected } = useOfficerAlerts(); // Initializes WS and listens for traffic_alert

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['officer-alerts'],
    queryFn: () => officerService.getAlerts()
  });

  const renderAlertCard = ({ item }: { item: any }) => {
    const isActive = item.status === 'assigned';
    const isClosed = item.status === 'closed_resolved' || item.status === 'closed_failed';

    let cardColor = '#FFFFFF';
    let borderColor = '#E5E5EA';
    
    if (isActive) {
      borderColor = '#FF3B30';
      cardColor = '#FFF5F5';
    } else if (isClosed) {
      borderColor = item.status === 'closed_resolved' ? '#34C759' : '#8E8E93';
    }

    return (
      <TouchableOpacity 
        style={[styles.alertCard, { borderColor, backgroundColor: cardColor }]}
        onPress={() => router.push(`/alerts/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
             {isActive ? <AlertTriangle size={16} color="#FF3B30" /> : <Navigation size={16} color="#34C759" />}
             <Text style={[styles.statusText, { color: isActive ? '#FF3B30' : '#34C759' }]}>
               {item.status.replace(/_/g, ' ').toUpperCase()}
             </Text>
          </View>
          <Text style={styles.distanceText}>{item.distanceKm?.toFixed(1)} km away</Text>
        </View>

        <Text style={styles.plateText}>{item.detectionInfo?.plateNumber || 'Unknown Vehicle'}</Text>
        <Text style={styles.locationText}>{item.cameraName}</Text>
        
        <View style={styles.cardFooter}>
           <Clock size={12} color="#8E8E93" />
           <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const activeAlerts = alerts?.filter((a: any) => a.status === 'assigned') || [];

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={defaultRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {activeAlerts.map((alert, index) => {
          if (!alert.cameraInfo?.lat || !alert.cameraInfo?.lng) return null;
          
          // Apply a microscopic offset to prevent identical coordinates from stacking perfectly
          const offsetLat = alert.cameraInfo.lat + (index * 0.00015);
          const offsetLng = alert.cameraInfo.lng + (index * 0.00015);

          return (
            <Marker
              key={alert.id}
              coordinate={{ latitude: offsetLat, longitude: offsetLng }}
              title={alert.detectionInfo?.plateNumber || 'Alert'}
              description={alert.status}
              pinColor={'red'}
              onCalloutPress={() => router.push(`/assigned/${alert.id}`)}
            />
          );
        })}
      </MapView>

      <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <ShieldAlert size={28} color="#1C1C1E" />
                <Text style={styles.headerTitle}>Live Dispatch</Text>
            </View>
            <View style={[styles.wsIndicator, { backgroundColor: isConnected ? '#34C759' : '#FF3B30' }]} />
        </View>

        <View style={styles.bottomOverlay}>
            {isLoading ? (
               <ActivityIndicator size="small" color="#007AFF" style={{ margin: 20 }} />
            ) : activeAlerts.length > 0 ? (
               <FlatList
                 data={activeAlerts}
                 horizontal
                 showsHorizontalScrollIndicator={false}
                 contentContainerStyle={styles.listContent}
                 keyExtractor={item => item.id}
                 renderItem={renderAlertCard}
                 snapToInterval={width * 0.8 + 16}
                 decelerationRate="fast"
               />
            ) : (
               <View style={styles.emptyCard}>
                 <Text style={styles.emptyText}>No active alerts nearby.</Text>
               </View>
            )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  map: { width: '100%', height: '100%', position: 'absolute' },
  overlayContainer: { flex: 1, justifyContent: 'space-between' },
  header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255,255,255,0.9)', 
      margin: 16, 
      padding: 16, 
      borderRadius: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
  wsIndicator: { width: 12, height: 12, borderRadius: 6 },
  bottomOverlay: { paddingBottom: Platform.OS === 'ios' ? 0 : 20 },
  listContent: { paddingHorizontal: 16, gap: 16 },
  alertCard: { 
      width: width * 0.8, 
      backgroundColor: '#fff', 
      borderRadius: 20, 
      padding: 20, 
      borderWidth: 2,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, fontWeight: '800' },
  distanceText: { fontSize: 13, color: '#8E8E93', fontWeight: '700' },
  plateText: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
  locationText: { fontSize: 15, color: '#636366', fontWeight: '500', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 12 },
  timeText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  emptyCard: { backgroundColor: 'rgba(255,255,255,0.9)', margin: 16, padding: 20, borderRadius: 20, alignItems: 'center' },
  emptyText: { color: '#8E8E93', fontSize: 15, fontWeight: '600' }
});
