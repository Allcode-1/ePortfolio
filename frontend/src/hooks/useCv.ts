import { useUser } from '@clerk/clerk-react';
import { useCallback, useEffect, useState } from 'react';
import { cvApi } from '../api/cv';
import type { Cv } from '../types/cv';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

const isUserNotFoundMessage = (message: string) => message.toLowerCase().includes('user not found');

export const useCv = () => {
  const { user, isLoaded } = useUser();
  const [cv, setCv] = useState<Cv | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    if (!user?.id) {
      setCv(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await cvApi.getByUserId(user.id);
      setCv(data ?? null);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Failed to load CV data.');

      if (isUserNotFoundMessage(message)) {
        setCv(null);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, user?.id]);

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
