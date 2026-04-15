import apiClient from './client';

export const officerService = {
  updateLocation: async (lat: number, lng: number, heading?: number, speed?: number) => {
    const formData = new FormData();
    formData.append('lat', lat.toString());
    formData.append('lng', lng.toString());
    if (heading !== undefined && heading !== null) formData.append('heading', heading.toString());
    if (speed !== undefined && speed !== null) formData.append('speed', speed.toString());
    
    // axios-native works best when form data is passed directly
    const response = await apiClient.post('/officers/location', formData);
    return response.data;
  },

  goOffline: async () => {
    const response = await apiClient.post('/officers/offline');
    return response.data;
  },

  getLocationStatus: async () => {
    const response = await apiClient.get('/officers/location/status');
    return response.data;
  },

  getAlerts: async (status?: string) => {
    const response = await apiClient.get('/officers/alerts', { params: { status } });
    return response.data;
  },

  getAlertDetail: async (id: string) => {
    const response = await apiClient.get(`/officers/alerts/${id}`);
    return response.data;
  },

  respondToAlert: async (id: string, payload: { status: string; notes?: string; proofFiles?: any[] }) => {
    const formData = new FormData();
    formData.append('status', payload.status);
    if (payload.notes) formData.append('notes', payload.notes);
    
    if (payload.proofFiles && payload.proofFiles.length > 0) {
      payload.proofFiles.forEach((file, index) => {
        formData.append('proofFiles', {
          uri: file.uri,
          type: file.type || 'image/jpeg',
          name: file.name || `proof_${index}.jpg`,
        } as any);
      });
    }

    const response = await apiClient.post(`/officers/alerts/${id}/respond`, formData);
    return response.data;
  }
};
