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
  assignmentType?: 'company' | 'user';
  assignedOfficers?: Array<{
    officerName: string;
    officerEmail: string;
    distanceKm?: number;
    status: string;
    assignmentId: string;
    assignedAt?: string;
  }>;
  eligibleForAssignment?: boolean;
  createdAt: string;
  updatedAt: string;
  detectionEvents?: DetectionEvent[];
  // Vehicle-specific
  plateNumber?: string;
  code?: string;
  region?: string;
}

export interface Assignment {
  id: string;
  detectionId: string;
  cameraId: string;
  cameraName: string;
  distanceKm: number;
  status: string;
  notes?: string;
  proofUrls?: string[];
  createdAt: string;
  closedAt?: string;
  detectionInfo?: {
    category: string;
    name: string;
    plateNumber?: string;
    code?: string;
    region?: string;
    description?: string;
    imageUrls?: string[];
  };
  cameraInfo?: {
    lat: number;
    lng: number;
  };
}

export interface DetectionActionPayload {
  status: "closed_resolved" | "closed_failed";
  notes?: string;
  proofFiles?: any[];
}

export const detectionService = {
  getDetections: async (): Promise<Detection[]> => {
    const response = await apiClient.get('/detections/');
    return response.data;
  },

  getAssignmentDetail: async (id: string): Promise<Assignment> => {
    const response = await apiClient.get(`/officers/assignments/${id}`);
    return response.data;
  },

  handleAssignmentAction: async (id: string, payload: DetectionActionPayload): Promise<any> => {
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

    const response = await apiClient.post(`/officers/assignments/${id}/close`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export const resolveUrl = (url: string | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${cleanPath}`;
};
