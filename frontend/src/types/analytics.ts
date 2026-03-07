export type AnalyticsEventKey =
  | 'shareClicks'
  | 'projectDetailViews'
  | 'certificateFileOpens'
  | 'cvDownloads';

export interface AnalyticsSnapshot {
  publicViews: number;
  shareClicks: number;
  projectDetailViews: number;
  certificateFileOpens: number;
  cvDownloads: number;
  lastUpdated?: string | null;
  monthlyActivity: Record<string, number>;
}
