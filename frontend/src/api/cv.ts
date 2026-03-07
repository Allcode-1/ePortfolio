import type { Cv, CvSavePayload } from '../types/cv';
import { apiClient, getAuthHeaders, type TokenGetter } from './client';

export const cvApi = {
  async getMine(getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.get<Cv | null>('/api/cv', { headers });
    return response.data;
  },

  async save(payload: CvSavePayload, getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.post<Cv>('/api/cv', payload, { headers });
    return response.data;
  },

  async remove(getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    await apiClient.delete('/api/cv', { headers });
  },
};
