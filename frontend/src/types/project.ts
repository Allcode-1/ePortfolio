export interface ProjectApi {
  id: number;
  title: string;
  description: string;
  githubUrl?: string | null;
  liveUrl?: string | null;
  imageUrl?: string | null;
  role?: string | null;
  stackSummary?: string | null;
  projectType?: string | null;
  status?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  pinned?: boolean;
  isPinned?: boolean;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  githubUrl?: string | null;
  liveUrl?: string | null;
  imageUrl?: string | null;
  role?: string | null;
  stackSummary?: string | null;
  projectType?: string | null;
  status?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isPinned: boolean;
}

export interface ProjectPayload {
  title: string;
  description: string;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  role?: string;
  stackSummary?: string;
  projectType?: string;
  status?: string;
  startedAt?: string;
  finishedAt?: string;
  pinned: boolean;
}

export interface GithubRepoInfo {
  fullName: string;
  name: string;
  description: string;
  htmlUrl: string;
  stars: number;
  forks: number;
  language: string | null;
  ownerAvatarUrl: string | null;
}
