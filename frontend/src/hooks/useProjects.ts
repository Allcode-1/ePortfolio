import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useState } from 'react';
import { projectsApi } from '../api/projects';
import type { Project } from '../types/project';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

export const useProjects = () => {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await projectsApi.list(getToken);
      setProjects(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load projects.'));
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    projects,
    isLoading,
    error,
    reload,
  };
};
