import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { officerService } from '../../api/officerService';
import { Camera, Check, Navigation, AlertCircle, RefreshCw, XCircle } from 'lucide-react-native';
import { BASE_URL } from '../../api/client';

export default function AlertDetail() {
  const { id } = useLocalSearchParams();
  const alertId = typeof id === 'string' ? id : id[0];
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofImages, setProofImages] = useState<any[]>([]);

  const { data: alert, isLoading, refetch } = useQuery({
    queryKey: ['officer-alert', alertId],
    queryFn: () => officerService.getAlertDetail(alertId),
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setProofImages(prev => [...prev, result.assets[0]]);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (newStatus === 'resolved' && proofImages.length === 0) {
      Alert.alert('Proof Required', 'Please attach at least one photo before resolving.');
      return;
    }

    try {
      setIsSubmitting(true);
      await officerService.respondToAlert(alertId, {
        status: newStatus,
        proofFiles: proofImages.length > 0 ? proofImages : undefined
      });
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['officer-alerts'] });
      
      if (newStatus === 'resolved' || newStatus === 'failed') {
        router.back();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToCamera = () => {
    if (!alert?.cameraInfo) return;
    const { lat, lng } = alert.cameraInfo;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${alert.cameraName})`,
    });
    if (url) Linking.openURL(url);
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  if (!alert) {
    return <View style={styles.centered}><Text>Alert not found</Text></View>;
  }

  const { status, detectionInfo, cameraName, distanceKm, createdAt } = alert;
  const isNew = status === 'dispatched';
  const isAccepted = status === 'accepted';
  const isEnRoute = status === 'en_route';
  const isOnScene = status === 'on_scene';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{status.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.plate}>{detectionInfo?.plateNumber || 'N/A'}</Text>
        <Text style={styles.cameraName}>{cameraName} • {distanceKm.toFixed(1)} km</Text>
        <Text style={styles.timeInfo}>Dispatched: {new Date(createdAt).toLocaleString()}</Text>
      </View>

      {detectionInfo?.imageUrls?.length > 0 && (
        <View style={styles.imageCard}>
          <Text style={styles.sectionTitle}>Detection Snapshot</Text>
          <Image 
            source={{ uri: `${BASE_URL}${detectionInfo.imageUrls[0]}` }} 
            style={styles.snapshot} 
            resizeMode="cover"
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {isNew && (
          <TouchableOpacity style={styles.primaryButton} onPress={() => updateStatus('accepted')}>
            <Check color="#fff" />
            <Text style={styles.primaryButtonText}>Accept Alert</Text>
          </TouchableOpacity>
        )}

        {(isAccepted || isEnRoute) && (
          <View style={styles.multiActionGroup}>
            {isAccepted && (
              <TouchableOpacity style={styles.secondaryButton} onPress={() => updateStatus('en_route')}>
                <RefreshCw color="#007AFF" />
                <Text style={styles.secondaryButtonText}>Set En Route</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.primaryButton} onPress={() => updateStatus('on_scene')}>
              <Navigation color="#fff" />
              <Text style={styles.primaryButtonText}>Arrived On Scene</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={navigateToCamera}>
              <Text style={styles.navButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        )}

        {isOnScene && (
          <View style={styles.resolutionContainer}>
            <Text style={styles.sectionTitle}>Upload Proof</Text>
            <View style={styles.proofGrid}>
              {proofImages.map((img, i) => (
                <Image key={i} source={{ uri: img.uri }} style={styles.proofThumb} />
              ))}
              <TouchableOpacity style={styles.addProofBtn} onPress={pickImage}>
                <Camera color="#8E8E93" />
                <Text style={styles.addProofText}>Add Photo</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.resolveButton} onPress={() => updateStatus('resolved')} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Resolve Incident</Text>}
            </TouchableOpacity>
          </View>
        )}

        {!['resolved', 'failed', 'expired'].includes(status) && (
          <TouchableOpacity style={styles.failButton} onPress={() => updateStatus('failed')} disabled={isSubmitting}>
            <XCircle color="#FF3B30" />
            <Text style={styles.failButtonText}>Report issue / Fail</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#E5E5EA', marginBottom: 16 },
  statusText: { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  plate: { fontSize: 34, fontWeight: '800', color: '#1C1C1E', marginBottom: 8 },
  cameraName: { fontSize: 17, color: '#636366', fontWeight: '500', marginBottom: 8 },
  timeInfo: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  imageCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
  snapshot: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#E5E5EA' },
  actionsContainer: { gap: 12 },
  primaryButton: { backgroundColor: '#007AFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 14, gap: 10 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#E5F1FF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 14, gap: 10 },
  secondaryButtonText: { color: '#007AFF', fontSize: 17, fontWeight: '700' },
  resolveButton: { backgroundColor: '#34C759', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 14, marginTop: 16 },
  failButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, gap: 10, marginTop: 24 },
  failButtonText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
  navButton: { backgroundColor: '#1C1C1E', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  navButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  multiActionGroup: { gap: 12 },
  resolutionContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16 },
  proofGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  proofThumb: { width: 80, height: 80, borderRadius: 10 },
  addProofBtn: { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: '#E5E5EA', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addProofText: { fontSize: 12, color: '#8E8E93', fontWeight: '500', marginTop: 4 }
});
