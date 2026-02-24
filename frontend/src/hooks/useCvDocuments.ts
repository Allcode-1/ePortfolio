import { useUser } from '@clerk/clerk-react';
import { useEffect, useMemo, useState } from 'react';
import type { CvDocument } from '../types/cvDocument';

const STORAGE_PREFIX = 'eportfolio.cvDocuments.v1';

const readDocuments = (storageKey: string): CvDocument[] => {
  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CvDocument[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const ensureSinglePrimary = (documents: CvDocument[]) => {
  if (documents.length === 0) {
    return documents;
  }

  const hasPrimary = documents.some((document) => document.isPrimary);
  if (hasPrimary) {
    return documents;
  }

  return documents.map((document, index) => ({
    ...document,
    isPrimary: index === 0,
  }));
};

export const useCvDocuments = () => {
  const { user } = useUser();
  const storageKey = useMemo(() => `${STORAGE_PREFIX}.${user?.id ?? 'anonymous'}`, [user?.id]);
  const [documents, setDocuments] = useState<CvDocument[]>([]);

  useEffect(() => {
    const stored = readDocuments(storageKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage key switch must reload user-scoped documents
    setDocuments(ensureSinglePrimary(stored));
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(ensureSinglePrimary(documents)));
  }, [documents, storageKey]);

  const addDocument = (nextDocument: CvDocument) => {
    setDocuments((prev) => {
      const next = prev.map((document) => ({ ...document, isPrimary: false }));
      return [...next, { ...nextDocument, isPrimary: true }];
    });
  };

  const updateDocument = (documentId: string, next: CvDocument) => {
    setDocuments((prev) =>
      ensureSinglePrimary(
        prev.map((document) => (document.id === documentId ? { ...next, id: document.id } : document)),
      ),
    );
  };

  const deleteDocument = (documentId: string) => {
    setDocuments((prev) => {
      const filtered = prev.filter((document) => document.id !== documentId);
      if (filtered.length === 0) {
        return filtered;
      }

      if (filtered.some((document) => document.isPrimary)) {
        return filtered;
      }

      return filtered.map((document, index) => ({ ...document, isPrimary: index === filtered.length - 1 }));
    });
  };

  const setPrimaryDocument = (documentId: string) => {
    setDocuments((prev) =>
      prev.map((document) => ({
        ...document,
        isPrimary: document.id === documentId,
      })),
    );
  };

  return {
    documents: ensureSinglePrimary(documents).sort((a, b) => {
      if (a.isPrimary === b.isPrimary) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }

      return a.isPrimary ? -1 : 1;
    }),
    addDocument,
    updateDocument,
    deleteDocument,
    setPrimaryDocument,
  };
};
