export interface CompanyBranding {
  domain: string;
  companyName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

interface BrandfetchColor {
  hex?: string | null;
  type?: string | null;
}

interface BrandfetchFormat {
  src?: string | null;
  format?: string | null;
  width?: number | null;
  height?: number | null;
}

interface BrandfetchLogo {
  type?: string | null;
  theme?: string | null;
  formats?: BrandfetchFormat[] | null;
}

interface BrandfetchResponse {
  name?: string | null;
  colors?: BrandfetchColor[] | null;
  logos?: BrandfetchLogo[] | null;
}

const BRANDFETCH_API_BASE = 'https://api.brandfetch.io/v2/brands';
const BRANDFETCH_API_KEY = (import.meta.env.VITE_BRANDFETCH_API_KEY as string | undefined)?.trim() ?? '';
const BRANDING_STORAGE_KEY = 'brandfetch_branding_cache_v2';
const BRANDING_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

const brandingValueCache = new Map<string, CompanyBranding | null>();
const brandingRequestCache = new Map<string, Promise<CompanyBranding | null>>();
const brandingStorageCache = new Map<string, { cachedAt: number; branding: CompanyBranding | null }>();
let storageCacheLoaded = false;

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^www\./, '');
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function hydrateStorageCache() {
  if (storageCacheLoaded || !canUseStorage()) {
    return;
  }

  storageCacheLoaded = true;

  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as Record<string, { cachedAt: number; branding: CompanyBranding | null }>;
    const now = Date.now();

    Object.entries(parsed).forEach(([domain, entry]) => {
      if (!entry || typeof entry.cachedAt !== 'number') {
        return;
      }

      if (now - entry.cachedAt > BRANDING_CACHE_TTL_MS) {
        return;
      }

      brandingStorageCache.set(normalizeDomain(domain), entry);
    });
  } catch {
    // Ignore cache hydration issues.
  }
}

function persistStorageCache() {
  if (!canUseStorage()) {
    return;
  }

  try {
    const now = Date.now();
    const serializable: Record<string, { cachedAt: number; branding: CompanyBranding | null }> = {};

    for (const [domain, entry] of brandingStorageCache.entries()) {
      if (now - entry.cachedAt > BRANDING_CACHE_TTL_MS) {
        continue;
      }

      serializable[domain] = entry;
    }

    window.localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore storage write failures.
  }
}

function readCachedBranding(domain: string): CompanyBranding | null | undefined {
  hydrateStorageCache();
  const entry = brandingStorageCache.get(domain);

  if (!entry) {
    return undefined;
  }

  if (Date.now() - entry.cachedAt > BRANDING_CACHE_TTL_MS) {
    brandingStorageCache.delete(domain);
    persistStorageCache();
    return undefined;
  }

  return entry.branding;
}

function writeCachedBranding(domain: string, branding: CompanyBranding | null) {
  hydrateStorageCache();
  brandingStorageCache.set(domain, { cachedAt: Date.now(), branding });
  persistStorageCache();
}

function normalizeHexColor(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(normalized)) {
    return null;
  }

  if (normalized.length === 4) {
    const [, r, g, b] = normalized;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return normalized.toLowerCase();
}

function normalizeCompanyName(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function toRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}

function shadeColor(hex: string, amount: number): string {
  const { r, g, b } = toRgb(hex);
  const target = amount >= 0 ? 255 : 0;
  const factor = Math.abs(amount);

  const nextR = r + (target - r) * factor;
  const nextG = g + (target - g) * factor;
  const nextB = b + (target - b) * factor;

  return `#${toHex(nextR)}${toHex(nextG)}${toHex(nextB)}`;
}

function pickLogoUrl(logos: BrandfetchLogo[] | null | undefined): string | null {
  if (!Array.isArray(logos) || logos.length === 0) {
    return null;
  }

  const formats = logos.flatMap((logo) => {
    const logoFormats = Array.isArray(logo.formats) ? logo.formats : [];

    return logoFormats
      .map((format) => ({
        src: typeof format.src === 'string' ? format.src : null,
        format: typeof format.format === 'string' ? format.format.toLowerCase() : '',
        type: typeof logo.type === 'string' ? logo.type.toLowerCase() : '',
        theme: typeof logo.theme === 'string' ? logo.theme.toLowerCase() : '',
        width: typeof format.width === 'number' && Number.isFinite(format.width) ? format.width : null,
        height: typeof format.height === 'number' && Number.isFinite(format.height) ? format.height : null,
      }))
      .filter((entry) => Boolean(entry.src));
  });

  if (formats.length === 0) {
    return null;
  }

  function typeRank(type: string) {
    if (type === 'icon') return 0;
    if (type === 'symbol') return 1;
    if (type === 'mark') return 2;
    if (type === 'logo') return 3;
    return 4;
  }

  function formatRank(format: string) {
    if (format === 'svg') return 0;
    if (format === 'webp') return 1;
    if (format === 'png') return 2;
    if (format === 'jpg' || format === 'jpeg') return 3;
    return 4;
  }

  function sizeRank(width: number | null, height: number | null) {
    const hasWidth = typeof width === 'number' && width > 0;
    const hasHeight = typeof height === 'number' && height > 0;

    if (!hasWidth && !hasHeight) {
      return Number.POSITIVE_INFINITY;
    }

    return Math.max(width ?? 0, height ?? 0);
  }

  const sorted = [...formats].sort((a, b) => {
    const byType = typeRank(a.type) - typeRank(b.type);
    if (byType !== 0) return byType;

    const bySize = sizeRank(a.width, a.height) - sizeRank(b.width, b.height);
    if (bySize !== 0) return bySize;

    const byFormat = formatRank(a.format) - formatRank(b.format);
    if (byFormat !== 0) return byFormat;

    if (a.theme === b.theme) return 0;
    if (a.theme === 'dark') return -1;
    if (b.theme === 'dark') return 1;
    return 0;
  });

  return sorted[0]?.src ?? null;
}

function pickBrandColors(colors: BrandfetchColor[] | null | undefined): {
  primaryColor: string | null;
  secondaryColor: string | null;
} {
  if (!Array.isArray(colors) || colors.length === 0) {
    return { primaryColor: null, secondaryColor: null };
  }

  const normalized = colors
    .map((color) => ({
      hex: normalizeHexColor(color.hex),
      type: typeof color.type === 'string' ? color.type.toLowerCase() : '',
    }))
    .filter((color): color is { hex: string; type: string } => Boolean(color.hex));

  if (normalized.length === 0) {
    return { primaryColor: null, secondaryColor: null };
  }

  const primary =
    normalized.find((color) => color.type === 'brand')?.hex ??
    normalized.find((color) => color.type === 'dark')?.hex ??
    normalized[0].hex;

  const secondary = normalized.find((color) => color.hex !== primary)?.hex ?? shadeColor(primary, -0.2);

  return {
    primaryColor: primary,
    secondaryColor: secondary,
  };
}

export function extractCompanyDomain(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const hostname = normalizeDomain(parsed.hostname);
    return hostname || null;
  } catch {
    return null;
  }
}

function getPrimaryDomainLabel(domain: string): string | null {
  const parts = normalizeDomain(domain).split('.').filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];

  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];
  const knownSecondLevel = new Set(['com', 'co', 'net', 'org', 'gov', 'edu']);

  if (parts.length >= 3 && last.length === 2 && knownSecondLevel.has(secondLast)) {
    return parts[parts.length - 3] ?? null;
  }

  return parts[parts.length - 2] ?? null;
}

export function inferCompanyNameFromDomain(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalizedDomain = normalizeDomain(value);
  if (!normalizedDomain) return null;

  const label = getPrimaryDomainLabel(normalizedDomain);
  if (!label) return null;

  const words = label
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return null;

  return words
    .map((word) => {
      if (/^[0-9]+$/.test(word)) return word;
      if (word.length <= 3) return word.toUpperCase();
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(' ');
}

export function isBrandfetchConfigured() {
  return Boolean(BRANDFETCH_API_KEY);
}

async function fetchBrandingForDomain(domain: string): Promise<CompanyBranding | null> {
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain || !BRANDFETCH_API_KEY) {
    return null;
  }

  if (brandingValueCache.has(normalizedDomain)) {
    return brandingValueCache.get(normalizedDomain) ?? null;
  }

  const cachedBranding = readCachedBranding(normalizedDomain);
  if (cachedBranding !== undefined) {
    brandingValueCache.set(normalizedDomain, cachedBranding);
    return cachedBranding;
  }

  const inFlight = brandingRequestCache.get(normalizedDomain);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    try {
      const response = await fetch(`${BRANDFETCH_API_BASE}/${encodeURIComponent(normalizedDomain)}`, {
        headers: {
          Authorization: `Bearer ${BRANDFETCH_API_KEY}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as BrandfetchResponse;
      const logoUrl = pickLogoUrl(payload.logos);
      const { primaryColor, secondaryColor } = pickBrandColors(payload.colors);
      const apiCompanyName = normalizeCompanyName(payload.name);
      const companyName = apiCompanyName ?? inferCompanyNameFromDomain(normalizedDomain);

      if (!logoUrl && !primaryColor && !secondaryColor && !apiCompanyName) {
        return null;
      }

      return {
        domain: normalizedDomain,
        companyName,
        logoUrl,
        primaryColor,
        secondaryColor,
      } satisfies CompanyBranding;
    } catch {
      return null;
    } finally {
      brandingRequestCache.delete(normalizedDomain);
    }
  })();

  brandingRequestCache.set(normalizedDomain, request);
  const result = await request;
  brandingValueCache.set(normalizedDomain, result);
  writeCachedBranding(normalizedDomain, result);
  return result;
}

export async function fetchCompanyBranding(
  companyWebsite: string | null | undefined
): Promise<CompanyBranding | null> {
  const domain = extractCompanyDomain(companyWebsite);
  if (!domain) {
    return null;
  }

  return fetchBrandingForDomain(domain);
}

export function getReadableTextColor(backgroundHex: string | null | undefined): string {
  const normalized = normalizeHexColor(backgroundHex);
  if (!normalized) {
    return '#0f172a';
  }

  const { r, g, b } = toRgb(normalized);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#0f172a' : '#ffffff';
}
