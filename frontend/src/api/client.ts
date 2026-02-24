import axios from 'axios';

export type TokenGetter = () => Promise<string | null>;

const fallbackBaseUrl = '/';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? fallbackBaseUrl,
});

export const getAuthHeaders = async (getToken: TokenGetter) => {
  const token = await getToken();

  if (!token) {
    throw new Error('Authentication token is missing. Please sign in again.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};
