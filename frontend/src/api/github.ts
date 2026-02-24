import type { GithubRepoInfo } from '../types/project';
import { apiClient, getAuthHeaders, type TokenGetter } from './client';

type GithubRepoResponse = {
  fullName: string;
  name: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  forks: number;
  language: string | null;
  ownerAvatarUrl: string | null;
};

export const githubApi = {
  async fetchRepo(repoUrl: string, getToken: TokenGetter): Promise<GithubRepoInfo> {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.get<GithubRepoResponse>('/api/github/repo-info', {
      headers,
      params: {
        url: repoUrl,
      },
    });

    const data = response.data;

    return {
      fullName: data.fullName,
      name: data.name,
      description: data.description ?? '',
      htmlUrl: data.htmlUrl,
      stars: data.stars,
      forks: data.forks,
      language: data.language,
      ownerAvatarUrl: data.ownerAvatarUrl ?? null,
    };
  },
};
