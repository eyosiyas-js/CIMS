import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { officerService } from '../api/officerService';
import { useAuth } from '../context/AuthContext';

const BACKGROUND_LOCATION_TASK = 'CIMS_BACKGROUND_LOCATION';

// ── Define the background task at the module level ──
// This runs even when the app is backgrounded/killed
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('[BG Location] Error:', error.message);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (location) {
      try {
        await officerService.updateLocation(
          location.coords.latitude,
          location.coords.longitude,
          location.coords.heading,
          location.coords.speed
        );
      } catch (e) {
        console.error('[BG Location] Failed to push location:', e);
      }
    }
  }
});

export function useLocationTracking() {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startTracking = async () => {
    try {
      // Request foreground permission first
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        setErrorMsg('Foreground location permission denied');
        return;
      }

      // Request background permission
      let bgStatus = 'denied';
      const Constants = require('expo-constants').default;
      const isExpoGoIOS = Platform.OS === 'ios' && Constants.appOwnership === 'expo';
      
      if (!isExpoGoIOS) {
        try {
          const res = await Location.requestBackgroundPermissionsAsync();
          bgStatus = res.status;
        } catch (err: any) {
          console.warn('[Location] Background permission denied or not configured. Fallback to foreground.');
        }
      } else {
        console.warn('[Location] Skipping background location on Expo Go iOS to prevent Info.plist crash. Using foreground only.');
      }

      if (bgStatus !== 'granted') {
        console.warn('[Location] Background permission not granted, using foreground only');
      }

      // Check if background task is already running
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);

      if (bgStatus === 'granted' && !isRegistered) {
        // Start background location updates
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: Location.Accuracy.High,
          distanceInterval: 50,        // Update every 50 meters
          timeInterval: 30000,         // Or every 30 seconds
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'CIMS Traffic',
            notificationBody: 'You are on duty — location tracking active.',
            notificationColor: '#007AFF',
          },
        });
        console.log('[Location] Background tracking started');
      } else if (!isRegistered) {
        // Fallback: foreground-only tracking
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 50,
            timeInterval: 30000,
          },
          (location) => {
            officerService.updateLocation(
              location.coords.latitude,
              location.coords.longitude,
              location.coords.heading,
              location.coords.speed
            ).catch(err => console.error('[FG Location] Sync failed:', err));
          }
        );
        console.log('[Location] Foreground-only tracking started');
      }

      setIsTracking(true);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(e.message);
      setIsTracking(false);
      console.error('[Location] Start tracking error:', e);
    }
  };

  const stopTracking = async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch (e) {
      console.error('[Location] Stop tracking error:', e);
    }

    setIsTracking(false);

    try {
      await officerService.goOffline();
    } catch (e) {
      console.error('[Location] Failed to mark offline:', e);
    }
  };

  useEffect(() => {
    // Auto-start only for traffic police officers
    const orgType = (user as any)?.organizationFeatures?.company_type || (user as any)?.companyType;
    if (user && orgType === 'traffic_police') {
      startTracking();
    }

    return () => {
      // Don't stop background tracking on unmount — it should persist
    };
  }, [user]);

  return { isTracking, startTracking, stopTracking, errorMsg };
}
