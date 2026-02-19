export type CommunityEventStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type AdminEventStatus = CommunityEventStatus;

export interface AdminSpeaker {
  id: string;
  fullName: string;
  headline: string;
  bio: string;
  photoUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEventTalk {
  id: string;
  eventId: string;
  speakerId: string | null;
  title: string;
  description: string;
  sortOrder: number;
  speaker: AdminSpeaker | null;
}

export interface AdminEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  locationName: string;
  timezone: string;
  startAt: string;
  endAt: string;
  status: CommunityEventStatus;
  eventbriteEventId: string | null;
  eventbriteUrl: string | null;
  syncStatus: 'not_synced' | 'synced' | 'sync_error';
  syncError: string | null;
  lastSyncedAt: string | null;
  createdByEmail: string | null;
  updatedByEmail: string | null;
  createdAt: string;
  updatedAt: string;
  talks: AdminEventTalk[];
}

export interface AdminEventTalkInput {
  speakerId: string | null;
  title: string;
  description: string;
  sortOrder: number;
}

export interface UpsertSpeakerInput {
  id?: string;
  fullName: string;
  headline?: string;
  bio?: string;
  photoUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  isActive?: boolean;
}

export interface UpsertEventInput {
  id?: string;
  title: string;
  description?: string;
  locationName: string;
  timezone?: string;
  startAt: string;
  endAt: string;
  status: CommunityEventStatus;
  talks: AdminEventTalkInput[];
}
