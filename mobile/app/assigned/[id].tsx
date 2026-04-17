import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, Image, Modal, Dimensions, FlatList, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { detectionService, resolveUrl, Assignment } from '../../api/detectionService';
import { ChevronLeft, Calendar, User, FileText, CheckCircle2, AlertTriangle, Info, MapPin, AlertCircle, X, Maximize2, Shield, Clock, Camera, Navigation } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const statusConfig: any = {
  unassigned: { bg: '#8E8E9320', text: '#8E8E93', label: 'Unassigned' },
  assigned: { bg: '#FF3B3015', text: '#FF3B30', label: 'Pending Action' },
  closed_resolved: { bg: '#34C75915', text: '#34C759', label: 'Incident Resolved' },
  closed_failed: { bg: '#FF3B3015', text: '#FF3B30', label: 'Incident Failed' },
};

export default function DetectionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState('');
  const [selectedProofImages, setSelectedProofImages] = useState<any[]>([]); // Future: add expo-image-picker
  const [isExpandingImage, setIsExpandingImage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  const { data: assignment, isLoading, refetch } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => detectionService.getAssignmentDetail(id as string),
    enabled: !!id,
  });

  const actionMutation = useMutation({
    mutationFn: (payload: { status: "closed_resolved" | "closed_failed", notes?: string, proofFiles?: any[] }) =>
      detectionService.handleAssignmentAction(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', id] });
      queryClient.invalidateQueries({ queryKey: ['assigned-detections'] });
      Alert.alert('Success', `Task status updated successfully.`);
      router.back();
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
      Alert.alert('Update Failed', `Error: ${errorMsg}`);
      console.error(err);
    }
  });

  const handleStatusChange = (newStatus: "closed_resolved" | "closed_failed") => {
    if (selectedProofImages.length === 0) {
      Alert.alert('Evidence Required', 'You must upload at least one piece of image evidence before closing this incident.');
      return;
    }

    actionMutation.mutate({
      status: newStatus,
      notes: notes,
      proofFiles: selectedProofImages
    });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setSelectedProofImages([...selectedProofImages, ...result.assets]);
    }
  };

  const openInMaps = () => {
    const lat = assignment?.cameraInfo?.lat;
    const lng = assignment?.cameraInfo?.lng;
    if (lat && lng) {
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Not Available', 'Coordinate data is missing for this incident.');
    }
  };

  useEffect(() => {
    if (mapRef.current && assignment?.cameraInfo?.lat && userLocation) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: assignment.cameraInfo.lat, longitude: assignment.cameraInfo.lng },
          userLocation
        ],
        { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true }
      );
    }
  }, [userLocation, assignment]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!assignment) return null;

  const currentStatus = statusConfig[assignment.status || 'assigned'] || statusConfig.unassigned;
  const isFinalized = assignment.status === 'closed_resolved' || assignment.status === 'closed_failed';

  // Gather all images (reference images + snapshots + proof photos)
  const allImages = [
    ...(assignment.detectionInfo?.imageUrls || []),
    ...(assignment.proofUrls || [])
  ].filter(Boolean);

  const region = {
      latitude: assignment.cameraInfo?.lat || -1.286389,
      longitude: assignment.cameraInfo?.lng || 36.817223,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.navbarTitle}>Incident Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: currentStatus.bg }]}>
            <Text style={[styles.statusText, { color: currentStatus.text }]}>
              {currentStatus.label}
            </Text>
          </View>
          <Text style={styles.idText}>ID: #{assignment.detectionId.split('-')[0].toUpperCase()}</Text>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.categoryLabel}>{assignment.detectionInfo?.category}</Text>
          <Text style={styles.title}>{assignment.detectionInfo?.name}</Text>
          {assignment.detectionInfo?.description && (
            <Text style={styles.description}>"{assignment.detectionInfo.description}"</Text>
          )}
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Clock size={16} color="#8E8E93" />
            <Text style={styles.metaLabel}>Timestamp</Text>
            <Text style={styles.metaValue}>{new Date(assignment.createdAt).toLocaleString()}</Text>
          </View>
          <View style={styles.metaRow}>
            <Camera size={16} color="#8E8E93" />
            <Text style={styles.metaLabel}>Camera</Text>
            <Text style={styles.metaValue}>{assignment.cameraName || 'Unknown Source'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Navigation size={16} color="#8E8E93" />
            <Text style={styles.metaLabel}>Maps</Text>
             <TouchableOpacity onPress={openInMaps}>
                <Text style={styles.linkText}>Open Google Maps</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* Detailed Attributes Parity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identification Metadata</Text>
          <View style={styles.attributeGrid}>
             <View style={styles.attributeBox}>
                <Text style={styles.attrLabel}>Sub-Category</Text>
                <Text style={styles.attrValue}>{assignment.detectionInfo?.category || "Standard"}</Text>
             </View>
             <View style={styles.attributeBox}>
                <Text style={styles.attrLabel}>Plate Number</Text>
                <Text style={styles.attrValue}>{assignment.detectionInfo?.plateNumber || "Unknown"}</Text>
             </View>
             <View style={[styles.attributeBox, { borderTopWidth: 1, borderTopColor: '#F2F2F7', width: '50%' }]}>
                <Text style={styles.attrLabel}>Region</Text>
                <Text style={styles.attrValue}>{assignment.detectionInfo?.region || "N/A"}</Text>
             </View>
             <View style={[styles.attributeBox, { borderTopWidth: 1, borderTopColor: '#F2F2F7', width: '50%' }]}>
                <Text style={styles.attrLabel}>Code</Text>
                <Text style={styles.attrValue}>{assignment.detectionInfo?.code || "N/A"}</Text>
             </View>
             {assignment.detectionInfo?.description && (
                <View style={[styles.attributeBox, { borderTopWidth: 1, borderTopColor: '#F2F2F7', width: '100%' }]}>
                    <Text style={styles.attrLabel}>Incident Type</Text>
                    <Text style={[styles.attrValue, { color: '#FF3B30' }]}>{assignment.detectionInfo.description}</Text>
                </View>
             )}
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trigger Point</Text>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={region}
            >
              <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} pinColor="red" />
              {userLocation && <Marker coordinate={userLocation} pinColor="blue" title="You are here" />}
            </MapView>
          </View>
        </View>

        {/* Visual Evidence List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual Evidence Archives</Text>
          <FlatList
            data={allImages}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setIsExpandingImage(item)} style={styles.imagePreview}>
                <Image source={{ uri: resolveUrl(item) || '' }} style={styles.previewImg} />
              </TouchableOpacity>
            )}
            keyExtractor={(item, idx) => idx.toString()}
            contentContainerStyle={styles.imageList}
          />
        </View>

        {/* Response Actions Hub */}
        {!isFinalized && (
          <View style={styles.actionPanel}>
             <View style={styles.panelHeader}>
                <Shield size={20} color="#1C1C1E" />
                <Text style={styles.panelTitle}>Operations Control</Text>
             </View>
            
             <View style={styles.resolutionLogic}>
                 <Text style={styles.label}>Notes (Optional)</Text>
                 <TextInput 
                     style={styles.notesInput}
                     multiline
                     placeholder="Detail your operational activity and findings..."
                     value={notes}
                     onChangeText={setNotes}
                 />
                 
                 <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                     <Camera size={18} color="#8E8E93" />
                     <Text style={styles.uploadText}>Attach Proof Photos ({selectedProofImages.length} selected)</Text>
                 </TouchableOpacity>

                 <View style={styles.dualControls}>
                     <TouchableOpacity 
                         style={[styles.smallCtrl, styles.resolveCtrl]}
                         onPress={() => handleStatusChange('closed_resolved')}
                         disabled={actionMutation.isPending}
                     >
                         {actionMutation.isPending ? <ActivityIndicator color="#fff" /> : (
                             <>
                                 <CheckCircle2 size={18} color="#fff" />
                                 <Text style={styles.ctrlText}>Resolve</Text>
                             </>
                         )}
                     </TouchableOpacity>
                     <TouchableOpacity 
                         style={[styles.smallCtrl, styles.failCtrl]}
                         onPress={() => handleStatusChange('closed_failed')}
                         disabled={actionMutation.isPending}
                     >
                         {actionMutation.isPending ? <ActivityIndicator color="#fff" /> : (
                             <>
                                 <AlertCircle size={18} color="#fff" />
                                 <Text style={styles.ctrlText}>Fail</Text>
                             </>
                         )}
                     </TouchableOpacity>
                 </View>
             </View>
          </View>
        )}

        {/* Finalized Banner */}
        {isFinalized && (
            <View style={styles.finalizedBanner}>
                <View style={styles.bannerHeader}>
                    <Info size={16} color="#8E8E93" />
                    <Text style={styles.bannerTitle}>Incident Finalized</Text>
                </View>
                <Text style={styles.bannerSubtitle}>This request has been completed and archived for history.</Text>
                {assignment.notes && (
                    <View style={styles.finalNotes}>
                        <Text style={styles.finalNotesLabel}>Official Findings:</Text>
                        <Text style={styles.finalNotesText}>{assignment.notes}</Text>
                    </View>
                )}
            </View>
        )}
      </ScrollView>

      {/* Image Zoom Modal */}
      <Modal visible={!!isExpandingImage} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
            <TouchableOpacity onPress={() => setIsExpandingImage(null)} style={styles.modalClose}>
                <X size={30} color="#fff" />
            </TouchableOpacity>
            {isExpandingImage && (
                <Image source={{ uri: resolveUrl(isExpandingImage) || '' }} style={styles.zoomImg} resizeMode="contain" />
            )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#8E8E93' },
  navbar: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  navbarTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  idText: { fontSize: 12, color: '#8E8E93', fontWeight: 'bold' },
  titleSection: { marginBottom: 24 },
  categoryLabel: { fontSize: 12, color: '#007AFF', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '800', color: '#1C1C1E', marginBottom: 12, letterSpacing: -0.5 },
  description: { fontSize: 16, color: '#636366', fontStyle: 'italic', lineHeight: 24 },
  metaCard: { backgroundColor: '#F9F9F9', borderRadius: 20, padding: 20, gap: 14, marginBottom: 30, borderWidth: 1, borderColor: '#F2F2F7' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaLabel: { fontSize: 13, color: '#8E8E93', width: 80, fontWeight: '600' },
  metaValue: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  linkText: { color: '#007AFF', fontSize: 14, fontWeight: '700' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', marginBottom: 16 },
  attributeGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F9F9F9', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7' },
  attributeBox: { flex: 1, minWidth: '45%', padding: 16, borderRightWidth: 1, borderRightColor: '#F2F2F7' },
  attrLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  attrValue: { fontSize: 15, color: '#1C1C1E', fontWeight: '700' },
  dataGrid: { backgroundColor: '#fdfdfd', borderRadius: 18, borderWidth: 1, borderColor: '#F2F2F7', overflow: 'hidden' },
  dataItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  dataLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  dataValue: { fontSize: 16, color: '#1C1C1E', fontWeight: '500' },
  mapContainer: { height: 200, borderRadius: 24, overflow: 'hidden', backgroundColor: '#F2F2F7' },
  map: { ...StyleSheet.absoluteFillObject },
  imagePreview: { width: 150, height: 150, borderRadius: 20, overflow: 'hidden', backgroundColor: '#F2F2F7', marginRight: 12 },
  previewImg: { width: '100%', height: '100%' },
  imageList: { paddingRight: 40 },
  actionPanel: { backgroundColor: '#F9F9F9', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#E5E5EA' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  panelTitle: { fontSize: 16, fontWeight: '800', color: '#1C1C1E' },
  pendingAction: { gap: 16 },
  pendingText: { fontSize: 15, color: '#636366', lineHeight: 22 },
  startBtn: { backgroundColor: '#007AFF', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resolutionLogic: { gap: 14 },
  label: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  notesInput: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5E5EA', padding: 16, fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', paddingVertical: 8 },
  uploadText: { color: '#8E8E93', fontWeight: '600', fontSize: 14 },
  dualControls: { flexDirection: 'row', gap: 12, marginTop: 10 },
  smallCtrl: { flex: 1, height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  resolveCtrl: { backgroundColor: '#34C759' },
  failCtrl: { backgroundColor: '#FF3B30' },
  ctrlText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  finalizedBanner: { backgroundColor: '#F9F9F9', padding: 24, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#C7C7CC', alignItems: 'center' },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase' },
  bannerSubtitle: { fontSize: 11, color: '#8E8E93', textAlign: 'center', marginBottom: 20 },
  finalNotes: { width: '100%', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F2F2F7' },
  finalNotesLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  finalNotesText: { fontSize: 15, color: '#1C1C1E', lineHeight: 22 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 60, right: 20, zIndex: 10 },
  zoomImg: { width: '100%', height: '80%' },
});
