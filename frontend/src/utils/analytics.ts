export type AnalyticsSnapshot = {
  publicViews: number;
  shareClicks: number;
  projectDetailViews: number;
  certificateFileOpens: number;
  cvDownloads: number;
  lastUpdated: string;
  monthlyActivity: Record<string, number>;
};

const initialSnapshot = (): AnalyticsSnapshot => ({
  publicViews: 0,
  shareClicks: 0,
  projectDetailViews: 0,
  certificateFileOpens: 0,
  cvDownloads: 0,
  lastUpdated: new Date().toISOString(),
  monthlyActivity: {},
});

const toKey = (userId: string) => `eportfolio.analytics.v1.${userId}`;

export const readAnalytics = (userId: string): AnalyticsSnapshot => {
  try {
    const raw = window.localStorage.getItem(toKey(userId));
    if (!raw) {
      return initialSnapshot();
    }
    const parsed = JSON.parse(raw) as Partial<AnalyticsSnapshot>;
    return {
      ...initialSnapshot(),
      ...parsed,
      monthlyActivity: parsed.monthlyActivity ?? {},
    };
  } catch {
    return initialSnapshot();
  }
};

export const updateAnalytics = (
  userId: string,
  updater: (snapshot: AnalyticsSnapshot) => AnalyticsSnapshot,
) => {
  const next = updater(readAnalytics(userId));
  next.lastUpdated = new Date().toISOString();
  window.localStorage.setItem(toKey(userId), JSON.stringify(next));
  return next;
};

export const bumpAnalytics = (userId: string, key: keyof Omit<AnalyticsSnapshot, 'lastUpdated' | 'monthlyActivity'>) =>
  updateAnalytics(userId, (snapshot) => {
    const monthKey = new Date().toISOString().slice(0, 7);
    return {
      ...snapshot,
      [key]: snapshot[key] + 1,
      monthlyActivity: {
        ...snapshot.monthlyActivity,
        [monthKey]: (snapshot.monthlyActivity[monthKey] ?? 0) + 1,
      },
    };
  });
