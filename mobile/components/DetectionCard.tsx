import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, MapPin, Camera as CameraIcon, Clock, ChevronRight } from 'lucide-react-native';
import { Detection, resolveUrl } from '../api/detectionService';
// Removed expo-linear-gradient to prevent bundling errors - using standard View for overlay instead

interface DetectionCardProps {
  detection: Detection;
}

const statusConfig: any = {
  unassigned: { bg: '#8E8E9320', text: '#8E8E93', label: 'Unassigned' },
  pending: { bg: '#FF3B3015', text: '#FF3B30', label: 'Pending Action' },
  in_progress: { bg: '#FF950015', text: '#FF9500', label: 'In Progress' },
  resolved: { bg: '#34C75915', text: '#34C759', label: 'Resolved' },
  failed: { bg: '#FF3B3015', text: '#FF3B30', label: 'Failed' },
};

const { width } = Dimensions.get('window');

export default function DetectionCard({ detection }: DetectionCardProps) {
  const router = useRouter();
  const status = statusConfig[detection.handlingStatus || 'unassigned'] || statusConfig.unassigned;
  
  const mainScreenshot = detection.imageUrls?.[0] || detection.detectionEvents?.[0]?.snapshotUrl;
  const sourceCamera = detection.detectionEvents?.[0]?.cameraName || "Unknown Camera";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push(`/assigned/${detection.id}`)}
    >
      {/* Card Image Header */}
      <View style={styles.imageContainer}>
        {mainScreenshot ? (
          <Image 
            source={{ uri: resolveUrl(mainScreenshot) || undefined }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <CameraIcon size={40} color="#AEAEB2" />
          </View>
        )}
        
        {/* Gradient Overlay Replaced with Solid Semi-Transparent View */}
        <View style={styles.gradient} />

        {/* Floating Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{detection.category}</Text>
        </View>

        {/* Content Overlap */}
        <View style={styles.imageContent}>
          <Text style={styles.title} numberOfLines={1}>{detection.name}</Text>
          <View style={styles.timeContainer}>
            <Clock size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.timeText}>
              {new Date(detection.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        {/* Status and Camera */}
        <View style={styles.metaRow}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
          <View style={styles.cameraInfo}>
            <CameraIcon size={12} color="#8E8E93" />
            <Text style={styles.cameraText} numberOfLines={1}>{sourceCamera}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          "{detection.description || "No description provided."}"
        </Text>

        {/* Detailed Grid */}
        <View style={styles.attributeGrid}>
          <View style={styles.attributeItem}>
            <Text style={styles.attributeLabel}>Type</Text>
            <Text style={styles.attributeValue} numberOfLines={1}>
                {detection.subcategory?.replace('_', ' ') || "Standard"}
            </Text>
          </View>
          <View style={[styles.attributeItem, styles.attributeBorder]}>
            <Text style={styles.attributeLabel}>Age Group</Text>
            <Text style={styles.attributeValue}>{detection.age || "N/A"}</Text>
          </View>
        </View>

        {/* Footer Link */}
        <View style={styles.footer}>
          <View style={styles.locationInfo}>
            <MapPin size={14} color="#007AFF" />
            <Text style={styles.locationText}>Location details available</Text>
          </View>
          <ChevronRight size={16} color="#C7C7CC" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  imageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#F2F2F7',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,122,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  imageContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  infoSection: {
    padding: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cameraInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 12,
  },
  cameraText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#636366',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 16,
  },
  attributeGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  attributeItem: {
    flex: 1,
  },
  attributeBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5EA',
    paddingLeft: 12,
  },
  attributeLabel: {
    fontSize: 9,
    color: '#8E8E93',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  attributeValue: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
});
