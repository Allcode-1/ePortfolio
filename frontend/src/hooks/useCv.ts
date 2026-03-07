import { useAuth, useUser } from '@clerk/clerk-react';
import { useCallback, useEffect, useState } from 'react';
import { cvApi } from '../api/cv';
import type { Cv } from '../types/cv';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

export const useCv = () => {
  const { getToken } = useAuth();
  const { user, isLoaded, isSignedIn } = useUser();
  const [cv, setCv] = useState<Cv | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !user?.id) {
      setCv(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await cvApi.getMine(getToken);
      setCv(data ?? null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load CV data.'));
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    cv,
    isLoading,
    error,
    reload,
  };
};
