import { apiClient, getAuthHeaders, type TokenGetter } from './client';
import type { AnalyticsEventKey, AnalyticsSnapshot } from '../types/analytics';

export const analyticsApi = {
  async getMine(getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.get<AnalyticsSnapshot>('/api/analytics/me', { headers });
    return response.data;
  },

  async trackMyEvent(eventKey: AnalyticsEventKey, getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.post<AnalyticsSnapshot>(`/api/analytics/me/events/${eventKey}`, undefined, {
      headers,
    });
    return response.data;
  },

  async trackPublicView(userId: string) {
    await apiClient.post(`/api/analytics/public-view/${userId}`);
  },
};
