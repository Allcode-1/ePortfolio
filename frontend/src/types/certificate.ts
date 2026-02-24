export interface Certificate {
  id: number;
  title?: string | null;
  name: string;
  issuedBy: string;
  description?: string | null;
  city?: string | null;
  place?: string | null;
  eventName?: string | null;
  eventType?: string | null;
  fileUrl?: string | null;
  imageUrl: string;
  issueDate?: string | null;
  importance?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  pinned?: boolean;
  isPinned?: boolean;
}

export interface CreateCertificatePayload {
  name: string;
  issuedBy: string;
  imageUrl: string;
  issueDate?: string;
  description?: string;
  city?: string;
  place?: string;
  eventName?: string;
  eventType?: string;
  importance?: number;
  pinned?: boolean;
}
