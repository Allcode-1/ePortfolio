import type { Project, ProjectApi, ProjectPayload } from '../types/project';
import { apiClient, getAuthHeaders, type TokenGetter } from './client';

const normalizeProject = (project: ProjectApi): Project => ({
  id: project.id,
  title: project.title,
  description: project.description,
  githubUrl: project.githubUrl ?? null,
  liveUrl: project.liveUrl ?? null,
  imageUrl: project.imageUrl ?? null,
  role: project.role ?? null,
  stackSummary: project.stackSummary ?? null,
  projectType: project.projectType ?? null,
  status: project.status ?? null,
  startedAt: project.startedAt ?? null,
  finishedAt: project.finishedAt ?? null,
  createdAt: project.createdAt ?? null,
  updatedAt: project.updatedAt ?? null,
  isPinned: project.isPinned ?? project.pinned ?? false,
});

export const projectsApi = {
  async list(getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.get<ProjectApi[]>('/api/projects', { headers });
    return response.data.map(normalizeProject);
  },

  async create(payload: ProjectPayload, getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.post<ProjectApi>('/api/projects', payload, { headers });
    return normalizeProject(response.data);
  },

  async update(projectId: number, payload: ProjectPayload, getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    const response = await apiClient.put<ProjectApi>(`/api/projects/${projectId}`, payload, { headers });
    return normalizeProject(response.data);
  },

  async remove(projectId: number, getToken: TokenGetter) {
    const headers = await getAuthHeaders(getToken);
    await apiClient.delete(`/api/projects/${projectId}`, { headers });
  },
};
