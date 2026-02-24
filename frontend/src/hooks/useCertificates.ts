import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useState } from 'react';
import { certificateApi } from '../api/certificates';
import type { Certificate } from '../types/certificate';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

export const useCertificates = () => {
  const { getToken } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await certificateApi.list(getToken);
      setCertificates(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load certificates.'));
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    certificates,
    isLoading,
    error,
    reload,
  };
};
