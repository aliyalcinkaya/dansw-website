create extension if not exists pgcrypto;

create table if not exists public.speakers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  headline text,
  bio text,
  photo_url text,
  linkedin_url text,
  website_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  location_name text not null default 'Sydney',
  timezone text not null default 'Australia/Sydney',
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'draft',
  eventbrite_event_id text unique,
  eventbrite_url text,
  sync_status text not null default 'not_synced',
  sync_error text,
  last_synced_at timestamptz,
  created_by_email text,
  updated_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_talks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events (id) on delete cascade,
  speaker_id uuid references public.speakers (id) on delete set null,
  title text not null,
  description text not null default '',
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_events
  drop constraint if exists community_events_status_check,
  drop constraint if exists community_events_sync_status_check,
  drop constraint if exists community_events_start_end_check;

alter table public.community_events
  add constraint community_events_status_check check (
    status in ('draft', 'scheduled', 'published', 'archived')
  ),
  add constraint community_events_sync_status_check check (
    sync_status in ('not_synced', 'synced', 'sync_error')
  ),
  add constraint community_events_start_end_check check (end_at > start_at);

alter table public.event_talks
  drop constraint if exists event_talks_event_order_key;

alter table public.event_talks
  add constraint event_talks_event_order_key unique (event_id, sort_order);

create index if not exists speakers_active_idx on public.speakers (is_active);
create index if not exists speakers_name_idx on public.speakers (full_name);
create index if not exists community_events_status_idx on public.community_events (status);
create index if not exists community_events_start_at_idx on public.community_events (start_at desc);
create index if not exists community_events_eventbrite_id_idx on public.community_events (eventbrite_event_id);
create index if not exists event_talks_event_id_idx on public.event_talks (event_id);
create index if not exists event_talks_speaker_id_idx on public.event_talks (speaker_id);

create or replace function public.set_speakers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_community_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_event_talks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists speakers_set_updated_at on public.speakers;
create trigger speakers_set_updated_at
before update on public.speakers
for each row execute function public.set_speakers_updated_at();

drop trigger if exists community_events_set_updated_at on public.community_events;
create trigger community_events_set_updated_at
before update on public.community_events
for each row execute function public.set_community_events_updated_at();

drop trigger if exists event_talks_set_updated_at on public.event_talks;
create trigger event_talks_set_updated_at
before update on public.event_talks
for each row execute function public.set_event_talks_updated_at();

alter table public.speakers enable row level security;
alter table public.community_events enable row level security;
alter table public.event_talks enable row level security;

drop policy if exists "public_can_view_active_speakers" on public.speakers;
create policy "public_can_view_active_speakers"
on public.speakers
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "admins_can_manage_speakers" on public.speakers;
create policy "admins_can_manage_speakers"
on public.speakers
for all
to authenticated
using (public.is_job_admin())
with check (public.is_job_admin());

drop policy if exists "public_can_view_published_or_scheduled_events" on public.community_events;
create policy "public_can_view_published_or_scheduled_events"
on public.community_events
for select
to anon, authenticated
using (status in ('scheduled', 'published'));

drop policy if exists "admins_can_manage_community_events" on public.community_events;
create policy "admins_can_manage_community_events"
on public.community_events
for all
to authenticated
using (public.is_job_admin())
with check (public.is_job_admin());

drop policy if exists "public_can_view_talks_for_visible_events" on public.event_talks;
create policy "public_can_view_talks_for_visible_events"
on public.event_talks
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.community_events events
    where events.id = event_talks.event_id
      and events.status in ('scheduled', 'published')
  )
);

drop policy if exists "admins_can_manage_event_talks" on public.event_talks;
create policy "admins_can_manage_event_talks"
on public.event_talks
for all
to authenticated
using (public.is_job_admin())
with check (public.is_job_admin());

revoke all on public.speakers from anon, authenticated;
revoke all on public.community_events from anon, authenticated;
revoke all on public.event_talks from anon, authenticated;

grant select on public.speakers to anon, authenticated;
grant select on public.community_events to anon, authenticated;
grant select on public.event_talks to anon, authenticated;

grant insert, update, delete on public.speakers to authenticated;
grant insert, update, delete on public.community_events to authenticated;
grant insert, update, delete on public.event_talks to authenticated;
