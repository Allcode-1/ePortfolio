import { apiClient, getAuthHeaders, type TokenGetter } from './client';
import type { NotificationItem } from '../types/notification';

export const notificationsApi = {
  async list(getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.get<NotificationItem[]>('/api/notifications', { headers });
    return response.data;
  },

  async unreadCount(getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.get<{ count: number }>('/api/notifications/unread-count', { headers });
    return response.data.count;
  },

  async markRead(notificationId: number, getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.patch<NotificationItem>(`/api/notifications/${notificationId}/read`, undefined, {
      headers,
    });
    return response.data;
  },

  async markAllRead(getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    await apiClient.post('/api/notifications/read-all', undefined, { headers });
  },
};
