function isNavigationReload() {
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return false;
  }

  const navEntries = performance.getEntriesByType?.('navigation');
  const navEntry = navEntries?.[0] as PerformanceNavigationTiming | undefined;
  if (navEntry?.type === 'reload') {
    return true;
  }

  const legacyPerformance = performance as Performance & {
    navigation?: { type?: number };
  };

  return legacyPerformance.navigation?.type === 1;
}

function hasRefreshQueryParam() {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('refreshEvents') === '1' || params.get('refresh') === 'events';
}

export function shouldForceEventbriteRefreshOnInitialLoad() {
  return isNavigationReload() || hasRefreshQueryParam();
}
