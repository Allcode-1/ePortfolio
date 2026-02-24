import type { CreateCertificatePayload, Certificate } from '../types/certificate';
import { apiClient, getAuthHeaders, type TokenGetter } from './client';

export const certificateApi = {
  async list(getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.get<Certificate[]>('/api/certificates', { headers });
    return response.data;
  },

  async uploadFile(file: File, getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<string>('/api/files/upload', formData, { headers });
    return response.data;
  },

  async create(payload: CreateCertificatePayload, getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.post<Certificate>('/api/certificates', payload, { headers });
    return response.data;
  },

  async remove(certificateId: number, getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    await apiClient.delete(`/api/certificates/${certificateId}`, { headers });
  },
};
