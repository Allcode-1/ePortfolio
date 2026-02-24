import type { Certificate } from './certificate';
import type { Cv } from './cv';
import type { ProjectApi } from './project';

export interface PortfolioResponse {
  fullName?: string | null;
  email?: string | null;
  cv?: Cv | null;
  projects?: ProjectApi[] | null;
  certificates?: Certificate[] | null;
}
