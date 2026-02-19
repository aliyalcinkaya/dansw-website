type AnalyticsPrimitive = string | number | boolean | null;
type AnalyticsParams = Record<string, AnalyticsPrimitive | undefined>;
const ANALYTICS_ANON_ID_KEY = 'daws_analytics_anonymous_id';

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

function getDataLayer(): Array<Record<string, unknown>> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!Array.isArray(window.dataLayer)) {
    window.dataLayer = [];
  }

  return window.dataLayer;
}

function sanitizeParams(params: AnalyticsParams | undefined): Record<string, AnalyticsPrimitive> {
  if (!params) {
    return {};
  }

  return Object.entries(params).reduce<Record<string, AnalyticsPrimitive>>((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function normalizeEventName(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || 'custom_event';
}

export function trackEvent(eventName: string, params?: AnalyticsParams): void {
  const dataLayer = getDataLayer();
  if (!dataLayer) {
    return;
  }

  dataLayer.push({
    event: eventName,
    ...sanitizeParams(params),
  });
}

export function trackPageView(path: string): void {
  trackEvent('page_view', {
    page_path: path,
    page_title: typeof document !== 'undefined' ? document.title : undefined,
  });
}

export function getAnalyticsAnonymousId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const existingValue = window.localStorage.getItem(ANALYTICS_ANON_ID_KEY);
  if (existingValue) {
    return existingValue;
  }

  const generatedValue =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(ANALYTICS_ANON_ID_KEY, generatedValue);
  return generatedValue;
}

export async function trackAnalyticsEvent(eventLabel: string, params?: AnalyticsParams): Promise<void> {
  trackEvent(normalizeEventName(eventLabel), {
    event_label: eventLabel,
    ...params,
  });
}
