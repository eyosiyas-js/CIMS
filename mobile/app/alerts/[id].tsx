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

  const closeAssignment = async (closeStatus: 'closed_resolved' | 'closed_failed') => {
    if (closeStatus === 'closed_resolved' && proofImages.length === 0) {
      Alert.alert('Proof Required', 'Please attach at least one photo before resolving.');
      return;
    }

    try {
      setIsSubmitting(true);
      await officerService.respondToAlert(alertId, {
        status: closeStatus,
        proofFiles: proofImages.length > 0 ? proofImages : undefined
      });
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['officer-alerts'] });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to close assignment');
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
  const isActive = status === 'assigned';
  const isClosed = status === 'closed_resolved' || status === 'closed_failed';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={[styles.statusBadge, { 
          backgroundColor: isActive ? '#FFF5F5' : isClosed ? '#F0FFF4' : '#F5F5F5' 
        }]}>
          <Text style={[styles.statusText, { 
            color: isActive ? '#FF3B30' : status === 'closed_resolved' ? '#34C759' : '#FF3B30' 
          }]}>
            {status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.plate}>{detectionInfo?.plateNumber || 'N/A'}</Text>
        <Text style={styles.cameraName}>{cameraName} • {distanceKm?.toFixed(1)} km</Text>
        <Text style={styles.timeInfo}>Assigned: {new Date(createdAt).toLocaleString()}</Text>
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

      {detectionInfo?.description && (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descText}>{detectionInfo.description}</Text>
        </View>
      )}

      {/* Action Buttons */}
      {!isClosed && (
        <View style={styles.actionsContainer}>
          {/* Navigate */}
          <TouchableOpacity style={styles.navButton} onPress={navigateToCamera}>
            <Navigation color="#fff" size={20} />
            <Text style={styles.navButtonText}>Get Directions to Camera</Text>
          </TouchableOpacity>

          {/* Upload proof & Resolve */}
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

            <TouchableOpacity 
              style={styles.resolveButton} 
              onPress={() => closeAssignment('closed_resolved')} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check color="#fff" size={20} />
                  <Text style={styles.primaryButtonText}>Resolve Incident</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.failButton} 
            onPress={() => closeAssignment('closed_failed')} 
            disabled={isSubmitting}
          >
            <XCircle color="#FF3B30" size={20} />
            <Text style={styles.failButtonText}>Report Issue / Fail</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Closed State */}
      {isClosed && (
        <View style={[styles.infoCard, { 
          borderColor: status === 'closed_resolved' ? '#34C759' : '#FF3B30',
          borderWidth: 2
        }]}>
          <Text style={[styles.sectionTitle, { 
            color: status === 'closed_resolved' ? '#34C759' : '#FF3B30' 
          }]}>
            {status === 'closed_resolved' ? '✅ Resolved' : '❌ Failed'}
          </Text>
          {alert.notes && <Text style={styles.descText}>{alert.notes}</Text>}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16 },
  statusText: { fontSize: 13, fontWeight: '700' },
  plate: { fontSize: 34, fontWeight: '800', color: '#1C1C1E', marginBottom: 8 },
  cameraName: { fontSize: 17, color: '#636366', fontWeight: '500', marginBottom: 8 },
  timeInfo: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  imageCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', padding: 16, marginBottom: 16 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
  descText: { fontSize: 15, color: '#636366', lineHeight: 22 },
  snapshot: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#E5E5EA' },
  actionsContainer: { gap: 12 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resolveButton: { backgroundColor: '#34C759', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 14, marginTop: 16, gap: 10 },
  failButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, gap: 10, marginTop: 12 },
  failButtonText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
  navButton: { backgroundColor: '#1C1C1E', padding: 16, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  navButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resolutionContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  proofGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  proofThumb: { width: 80, height: 80, borderRadius: 10 },
  addProofBtn: { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: '#E5E5EA', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addProofText: { fontSize: 12, color: '#8E8E93', fontWeight: '500', marginTop: 4 }
});
