import { apiClient, getAuthHeaders, type TokenGetter } from './client';
import type { AccountVisibility } from '../types/appSettings';

type UserSettingsResponse = {
  accountVisibility: AccountVisibility;
};

export const usersApi = {
  async getMySettings(getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.get<UserSettingsResponse>('/api/users/me/settings', { headers });
    return response.data;
  },

  async updateMySettings(accountVisibility: AccountVisibility, getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.patch<UserSettingsResponse>(
      '/api/users/me/settings',
      { accountVisibility },
      { headers },
    );
    return response.data;
  },

  async deleteMe(getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    await apiClient.delete('/api/users/me', { headers });
  },
};
