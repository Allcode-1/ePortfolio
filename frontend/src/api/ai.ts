import { apiClient, getAuthHeaders, type TokenGetter } from './client';
import type { AiImproveRequest, AiImproveResponse } from '../types/ai';

const postImprove = async (path: string, payload: AiImproveRequest, getToken: TokenGetter) => {
  const headers = await getAuthHeaders(getToken);
  const response = await apiClient.post<AiImproveResponse>(path, payload, { headers });
  return response.data;
};

export const aiApi = {
  improveCv(payload: AiImproveRequest, getToken: TokenGetter) {
    return postImprove('/api/ai/cv/improve', payload, getToken);
  },

  improveProject(payload: AiImproveRequest, getToken: TokenGetter) {
    return postImprove('/api/ai/project/improve', payload, getToken);
  },

  improveCertificate(payload: AiImproveRequest, getToken: TokenGetter) {
    return postImprove('/api/ai/certificate/improve', payload, getToken);
  },
};
