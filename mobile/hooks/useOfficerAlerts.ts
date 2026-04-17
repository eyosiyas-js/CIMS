import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
// import { Audio } from 'expo-av'; // Optional: for playing notification sounds

export function useOfficerAlerts() {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    // Check if user is traffic police
    const orgType = (user as any)?.organizationFeatures?.company_type || (user as any)?.companyType;
    if (orgType !== 'traffic_police') return;

    const wsUrl = `${BASE_URL.replace('http', 'ws')}/api/v1/notifications/ws?token=${accessToken}`;
    
    const connect = () => {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
      };

      wsRef.current.onmessage = async (event) => {
        if (event.data === 'pong') return;

        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'assignment_created' || data.type === 'traffic_alert') {
            console.log('New traffic alert received:', data);
            
            // Invalidate alerts query to fetch new alerts
            queryClient.invalidateQueries({ queryKey: ['officer-alerts'] });
            // Also refresh the Assigned tab
            queryClient.invalidateQueries({ queryKey: ['assigned-detections'] });
          }
          
          if (data.type === 'assignment_updated') {
            console.log('Assignment updated:', data);
            queryClient.invalidateQueries({ queryKey: ['officer-alerts'] });
            queryClient.invalidateQueries({ queryKey: ['officer-alert'] });
            queryClient.invalidateQueries({ queryKey: ['assigned-detections'] });
          }

          if (data.type === 'new_detection') {
            console.log('New detection received:', data);
            queryClient.invalidateQueries({ queryKey: ['assigned-detections'] });
          }
        } catch (e) {
          console.error('Error parsing alert message', e);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [accessToken, user, queryClient]);

  return { isConnected };
}
