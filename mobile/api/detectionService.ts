import apiClient, { BASE_URL } from './client';

export interface DetectionEvent {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  snapshotUrl: string;
  lat?: number;
  lng?: number;
}

export interface Detection {
  id: string;
  category: 'person' | 'vehicle';
  name: string;
  description?: string;
  age?: string;
  location?: string;
  subcategory?: string;
  crimeType?: string;
  imageUrls?: string[];
  status: string;
  handlingStatus?: 'unassigned' | 'pending' | 'in_progress' | 'resolved' | 'failed';
  handlingNotes?: string;
  handlingProofUrls?: string[];
  formTemplateId?: string;
  dynamicData?: Record<string, any>;
  resolvedDynamicData?: Array<{ label: string; value: any }>;
  assignedCompanyId?: string;
  assignedCompanyName?: string;
  eligibleForAssignment?: boolean;
  createdAt: string;
  updatedAt: string;
  detectionEvents?: DetectionEvent[];
  // Vehicle-specific
  plateNumber?: string;
  code?: string;
  region?: string;
}

export interface DetectionActionPayload {
  status: "in_progress" | "resolved" | "failed";
  notes?: string;
  proofFiles?: any[];
}

export const detectionService = {
  getDetections: async (): Promise<Detection[]> => {
    const response = await apiClient.get('/detections/');
    return response.data;
  },

  getDetectionDetail: async (id: string): Promise<Detection> => {
    const response = await apiClient.get(`/detections/${id}`);
    return response.data;
  },

  handleDetectionAction: async (id: string, payload: DetectionActionPayload): Promise<Detection> => {
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

    // axios-native will automatically add the correct multipart/form-data boundary 
    // IF we don't have a default Content-Type header.
    const response = await apiClient.post(`/detections/${id}/action`, formData);
    return response.data;
  }
};

export const resolveUrl = (url: string | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${cleanPath}`;
};
