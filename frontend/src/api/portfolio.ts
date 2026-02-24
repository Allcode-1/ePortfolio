import type { PortfolioResponse } from '../types/portfolio';
import { apiClient } from './client';

export const portfolioApi = {
  async getByUserId(userId: string) {
    const response = await apiClient.get<PortfolioResponse>(`/api/public/portfolio/${userId}`);
    return response.data;
  },
};
