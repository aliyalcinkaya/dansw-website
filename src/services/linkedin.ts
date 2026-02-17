export interface LinkedInEmbedPost {
  id: string;
  sourceUrl: string;
  embedUrl: string;
}

const LINKEDIN_URN_REGEX = /(urn:li:(?:activity|share|ugcPost):[A-Za-z0-9-]+)/i;
const LINKEDIN_ACTIVITY_PATH_REGEX = /activity-(\d+)/i;

export function parseLinkedInPostInputs(raw: string | string[] | undefined): string[] {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw.map((input) => input.trim()).filter(Boolean);
  }

  return raw
    .split(/[,\n]/)
    .map((input) => input.trim())
    .filter(Boolean);
}

function extractUrn(rawInput: string): string | null {
  let decodedInput = rawInput;

  try {
    decodedInput = decodeURIComponent(rawInput);
  } catch {
    decodedInput = rawInput;
  }

  const urnMatch = decodedInput.match(LINKEDIN_URN_REGEX);

  if (urnMatch?.[1]) {
    return urnMatch[1];
  }

  const activityMatch = decodedInput.match(LINKEDIN_ACTIVITY_PATH_REGEX);

  if (activityMatch?.[1]) {
    return `urn:li:activity:${activityMatch[1]}`;
  }

  return null;
}

function toEmbedPost(rawInput: string): LinkedInEmbedPost | null {
  const urn = extractUrn(rawInput);

  if (!urn) {
    return null;
  }

  const id = urn.split(':').pop() ?? urn;
  const sourceUrl = rawInput.startsWith('urn:li:')
    ? `https://www.linkedin.com/feed/update/${urn}/`
    : rawInput;

  return {
    id,
    sourceUrl,
    embedUrl: `https://www.linkedin.com/embed/feed/update/${urn}`,
  };
}

export function getLinkedInEmbedPostsFromInputs(
  rawInputs: string | string[] | undefined,
  maxPosts = 3
): LinkedInEmbedPost[] {
  const parsedPosts = parseLinkedInPostInputs(rawInputs)
    .map(toEmbedPost)
    .filter((post): post is LinkedInEmbedPost => post !== null);

  const uniquePosts = Array.from(new Map(parsedPosts.map((post) => [post.id, post])).values());
  return uniquePosts.slice(0, maxPosts);
}

export function getLinkedInEmbedPosts(maxPosts = 3): LinkedInEmbedPost[] {
  const rawPosts = import.meta.env.VITE_LINKEDIN_POST_URLS as string | undefined;
  return getLinkedInEmbedPostsFromInputs(rawPosts, maxPosts);
}
