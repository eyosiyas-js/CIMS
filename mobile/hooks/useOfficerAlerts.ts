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
          
          if (data.type === 'traffic_alert') {
            // Play notification sound
            // const { sound } = await Audio.Sound.createAsync(require('../assets/alert.mp3'));
            // await sound.playAsync();

            console.log('New traffic alert received:', data);
            
            // Invalidate alerts query to fetch new alerts
            queryClient.invalidateQueries({ queryKey: ['officer-alerts'] });
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
