import type { Cv, CvSavePayload } from '../types/cv';
import { apiClient, getAuthHeaders, type TokenGetter } from './client';
import { portfolioApi } from './portfolio';

export const cvApi = {
  async getByUserId(userId: string) {
    const response = await portfolioApi.getByUserId(userId);
    return response.cv as Cv | null | undefined;
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
