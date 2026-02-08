const MIXPANEL_API_ENDPOINT = 'https://api.mixpanel.com/track';
const MIXPANEL_DISTINCT_ID_STORAGE_KEY = 'daws_mixpanel_distinct_id';

function getMixpanelToken() {
  return import.meta.env.VITE_MIXPANEL_TOKEN?.trim() ?? '';
}

function getStoredDistinctId() {
  if (typeof window === 'undefined') return '';

  try {
    return window.localStorage.getItem(MIXPANEL_DISTINCT_ID_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function storeDistinctId(value: string) {
  if (typeof window === 'undefined' || !value) return;

  try {
    window.localStorage.setItem(MIXPANEL_DISTINCT_ID_STORAGE_KEY, value);
  } catch {
    // Ignore storage errors in private mode or restricted environments.
  }
}

export function getAnalyticsAnonymousId() {
  const fromStorage = getStoredDistinctId();
  if (fromStorage) return fromStorage;

  const generated =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`;

  storeDistinctId(generated);
  return generated;
}

function cleanEventProperties(properties: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export async function trackAnalyticsEvent(event: string, properties: Record<string, unknown> = {}) {
  const token = getMixpanelToken();
  if (!token) return;

  const distinctId = getAnalyticsAnonymousId();
  const cleanedProperties = cleanEventProperties(properties);
  const email = typeof cleanedProperties.email === 'string' ? cleanedProperties.email : undefined;

  try {
    await fetch(MIXPANEL_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          event,
          properties: {
            token,
            distinct_id: email ?? distinctId,
            $device_id: distinctId,
            ...(email ? { $user_id: email } : {}),
            $insert_id: `${event}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            ...cleanedProperties,
          },
        },
      ]),
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Analytics tracking failed', error);
    }
  }
}
