import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { authStorage } from '@/lib/auth';
import { toast } from 'sonner';

interface SocketContextType {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ isConnected: false });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const token = authStorage.getToken();
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // The backend is running on 8000 (usually) or the same host as the API
    const wsUrl = `${protocol}//${window.location.hostname}:8000/api/v1/notifications/ws?token=${token}`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket Message Received:', data);

        if (data.type === 'alert' || data.type === 'weapon_alert') {
          // New notification/alert received
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          // If it's a weapon alert, invalidate specifically that query
          if (data.type === 'weapon_alert') {
            queryClient.invalidateQueries({ queryKey: ['weaponDetections'] });
          }
          
          // If it's a detection update, invalidate detections too
          if (data.detectionId) {
            queryClient.invalidateQueries({ queryKey: ['detections'] });
          }
          
          const toastType = data.type === 'weapon_alert' ? 'error' : 'info';
          (toast as any)[toastType](data.title || 'New Alert', {
            description: data.message,
          });
        }

        // Handle assignment events — refresh detection data so officer info shows up
        if (data.type === 'assignment_created') {
          queryClient.invalidateQueries({ queryKey: ['detections'] });
          toast.info('Officer Dispatched', {
            description: `Officer dispatched ${data.distanceKm ? `(${Number(data.distanceKm).toFixed(1)} km)` : ''} to ${data.plateNumber || 'detection'}`,
          });
        }

        if (data.type === 'assignment_updated') {
          queryClient.invalidateQueries({ queryKey: ['detections'] });
          toast.info('Assignment Updated', {
            description: `Detection status changed to ${data.status || 'updated'}`,
          });
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      // Optional: implement exponential backoff reconnection
    };

    socket.onerror = (err) => {
      console.error('WebSocket Error:', err);
    };

    return () => {
      socket.close();
    };
  }, [token, user, queryClient]);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
