import { apiClient, getAuthHeaders, type TokenGetter } from './client';

export const usersApi = {
  async deleteMe(getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    await apiClient.delete('/api/users/me', { headers });
  },
};
