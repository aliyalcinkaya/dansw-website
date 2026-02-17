create extension if not exists pgcrypto;

create table if not exists public.job_board_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create or replace function public.is_job_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.job_board_admins admins
    where lower(trim(admins.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

revoke all on function public.is_job_admin() from public;
grant execute on function public.is_job_admin() to anon, authenticated;

create or replace function public.is_job_admin_email(candidate_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.job_board_admins admins
    where lower(trim(admins.email)) = lower(trim(coalesce(candidate_email, '')))
  );
$$;

revoke all on function public.is_job_admin_email(text) from public;
grant execute on function public.is_job_admin_email(text) to anon, authenticated;

create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'draft',
  package_type text,
  payment_status text not null default 'unpaid',
  title text not null,
  company_name text not null,
  company_website text,
  brand_logo_url text,
  brand_primary_color text,
  brand_secondary_color text,
  location_text text not null,
  location_mode text not null default 'hybrid',
  employment_type text not null default 'full-time',
  seniority_level text not null default 'mid',
  salary_min integer,
  salary_max integer,
  salary_currency text not null default 'AUD',
  salary_period text not null default 'year',
  summary text not null,
  responsibilities text not null,
  requirements text not null,
  nice_to_have text,
  application_mode text not null default 'external_apply',
  external_apply_url text,
  easy_apply_email text,
  easy_apply_fields jsonb not null default '{"collect_name": true, "collect_email": true, "collect_cv": true, "collect_linkedin": true, "collect_cover_letter": true}'::jsonb,
  application_deadline date,
  contact_name text,
  posted_by_email text not null,
  posted_by_user_id uuid references auth.users (id) on delete set null,
  stripe_checkout_session_id text,
  published_at timestamptz,
  publish_expires_at timestamptz,
  review_note text,
  last_reviewed_by_email text,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_posts
  add column if not exists brand_logo_url text,
  add column if not exists brand_primary_color text,
  add column if not exists brand_secondary_color text,
  add column if not exists easy_apply_fields jsonb not null default '{"collect_name": true, "collect_email": true, "collect_cv": true, "collect_linkedin": true, "collect_cover_letter": true}'::jsonb,
  add column if not exists review_note text,
  add column if not exists last_reviewed_by_email text,
  add column if not exists last_reviewed_at timestamptz;

alter table public.job_posts
  drop constraint if exists job_posts_status_check,
  drop constraint if exists job_posts_package_type_check,
  drop constraint if exists job_posts_payment_status_check,
  drop constraint if exists job_posts_location_mode_check,
  drop constraint if exists job_posts_employment_type_check,
  drop constraint if exists job_posts_seniority_level_check,
  drop constraint if exists job_posts_salary_period_check,
  drop constraint if exists job_posts_application_mode_check,
  drop constraint if exists job_posts_salary_range_check,
  drop constraint if exists job_posts_external_apply_check,
  drop constraint if exists job_posts_easy_apply_email_check;

alter table public.job_posts
  add constraint job_posts_status_check check (
    status in ('draft', 'pending_payment', 'pending_review', 'changes_requested', 'published', 'archived')
  ),
  add constraint job_posts_package_type_check check (
    package_type is null or package_type in ('standard', 'amplified')
  ),
  add constraint job_posts_payment_status_check check (
    payment_status in ('unpaid', 'paid', 'refunded', 'waived')
  ),
  add constraint job_posts_location_mode_check check (
    location_mode in ('remote', 'hybrid', 'onsite')
  ),
  add constraint job_posts_employment_type_check check (
    employment_type in ('full-time', 'part-time', 'contract', 'internship', 'temporary')
  ),
  add constraint job_posts_seniority_level_check check (
    seniority_level in ('entry', 'mid', 'senior', 'lead', 'manager', 'director')
  ),
  add constraint job_posts_salary_period_check check (
    salary_period in ('year', 'month', 'day', 'hour')
  ),
  add constraint job_posts_application_mode_check check (
    application_mode in ('easy_apply', 'external_apply', 'both')
  ),
  add constraint job_posts_salary_range_check check (
    salary_min is null or salary_max is null or salary_max >= salary_min
  ),
  add constraint job_posts_external_apply_check check (
    application_mode = 'easy_apply'
    or (external_apply_url is not null and char_length(trim(external_apply_url)) > 0)
  ),
  add constraint job_posts_easy_apply_email_check check (
    application_mode = 'external_apply'
    or (easy_apply_email is not null and char_length(trim(easy_apply_email)) > 0)
  );

create index if not exists job_posts_status_idx on public.job_posts (status);
create index if not exists job_posts_published_at_idx on public.job_posts (published_at desc);
create index if not exists job_posts_publish_expires_at_idx on public.job_posts (publish_expires_at);
create index if not exists job_posts_posted_by_email_idx on public.job_posts (posted_by_email);

create or replace function public.set_job_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists job_posts_set_updated_at on public.job_posts;
create trigger job_posts_set_updated_at
before update on public.job_posts
for each row execute function public.set_job_posts_updated_at();

alter table public.job_posts enable row level security;

drop policy if exists "public_can_view_published_jobs" on public.job_posts;
create policy "public_can_view_published_jobs"
on public.job_posts
for select
to anon, authenticated
using (
  status = 'published'
  and payment_status in ('paid', 'waived')
  and (publish_expires_at is null or publish_expires_at > now())
);

drop policy if exists "public_can_insert_job_drafts" on public.job_posts;
create policy "public_can_insert_job_drafts"
on public.job_posts
for insert
to anon, authenticated
with check (
  status = 'draft'
  and char_length(trim(posted_by_email)) > 0
);

drop policy if exists "owners_can_view_their_jobs" on public.job_posts;
create policy "owners_can_view_their_jobs"
on public.job_posts
for select
to authenticated
using (
  posted_by_user_id = auth.uid()
  or lower(posted_by_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "owners_can_update_their_submitted_jobs" on public.job_posts;
create policy "owners_can_update_their_submitted_jobs"
on public.job_posts
for update
to authenticated
using (
  posted_by_user_id = auth.uid()
  or lower(posted_by_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  (
    posted_by_user_id = auth.uid()
    or lower(posted_by_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  and status in ('draft', 'pending_payment', 'pending_review', 'changes_requested')
);

drop policy if exists "admins_can_manage_all_jobs" on public.job_posts;
create policy "admins_can_manage_all_jobs"
on public.job_posts
for all
to authenticated
using (public.is_job_admin())
with check (public.is_job_admin());

revoke all on public.job_posts from anon, authenticated;
grant select, insert, update on public.job_posts to anon, authenticated;

create table if not exists public.job_admin_notifications (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid references public.job_posts (id) on delete cascade,
  event_type text not null,
  title text not null,
  message text not null,
  recipient_scope text not null default 'admin',
  recipient_email text,
  status text not null default 'unread',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.job_admin_notifications
  drop constraint if exists job_admin_notifications_event_type_check,
  drop constraint if exists job_admin_notifications_recipient_scope_check,
  drop constraint if exists job_admin_notifications_status_check;

alter table public.job_admin_notifications
  add constraint job_admin_notifications_event_type_check check (
    event_type in (
      'job_submitted',
      'job_payment_succeeded',
      'job_published',
      'job_changes_requested',
      'job_archived',
      'job_expiring_soon',
      'job_expired',
      'job_extended'
    )
  ),
  add constraint job_admin_notifications_recipient_scope_check check (
    recipient_scope in ('admin', 'poster', 'all')
  ),
  add constraint job_admin_notifications_status_check check (
    status in ('unread', 'read')
  );

create index if not exists job_admin_notifications_created_at_idx
  on public.job_admin_notifications (created_at desc);
create index if not exists job_admin_notifications_event_type_idx
  on public.job_admin_notifications (event_type);
create index if not exists job_admin_notifications_job_post_id_idx
  on public.job_admin_notifications (job_post_id);

alter table public.job_admin_notifications enable row level security;

drop policy if exists "admins_can_manage_notifications" on public.job_admin_notifications;
create policy "admins_can_manage_notifications"
on public.job_admin_notifications
for all
to authenticated
using (public.is_job_admin())
with check (public.is_job_admin());

drop policy if exists "posters_can_view_own_notifications" on public.job_admin_notifications;
create policy "posters_can_view_own_notifications"
on public.job_admin_notifications
for select
to authenticated
using (
  recipient_scope in ('poster', 'all')
  and lower(coalesce(recipient_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "posters_can_mark_own_notifications_read" on public.job_admin_notifications;
create policy "posters_can_mark_own_notifications_read"
on public.job_admin_notifications
for update
to authenticated
using (
  recipient_scope in ('poster', 'all')
  and lower(coalesce(recipient_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  recipient_scope in ('poster', 'all')
  and lower(coalesce(recipient_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "public_can_create_submission_notifications" on public.job_admin_notifications;
create policy "public_can_create_submission_notifications"
on public.job_admin_notifications
for insert
to anon, authenticated
with check (
  recipient_scope = 'admin'
  and event_type in ('job_submitted', 'job_payment_succeeded')
  and job_post_id is not null
  and exists (
    select 1
    from public.job_posts jp
    where jp.id = job_post_id
      and jp.status in ('pending_payment', 'pending_review')
  )
);

revoke all on public.job_admin_notifications from anon, authenticated;
grant insert on public.job_admin_notifications to anon, authenticated;
grant select, update on public.job_admin_notifications to authenticated;

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references public.job_posts (id) on delete cascade,
  applicant_name text not null,
  applicant_email text not null,
  phone text,
  linkedin_url text,
  resume_url text,
  cover_note text,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_applications
  drop constraint if exists job_applications_status_check;

alter table public.job_applications
  add constraint job_applications_status_check check (
    status in ('submitted', 'reviewing', 'shortlisted', 'rejected', 'hired')
  );

create index if not exists job_applications_job_post_id_idx on public.job_applications (job_post_id);
create index if not exists job_applications_created_at_idx on public.job_applications (created_at desc);

create or replace function public.set_job_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists job_applications_set_updated_at on public.job_applications;
create trigger job_applications_set_updated_at
before update on public.job_applications
for each row execute function public.set_job_applications_updated_at();

alter table public.job_applications enable row level security;

drop policy if exists "public_can_submit_easy_apply" on public.job_applications;
create policy "public_can_submit_easy_apply"
on public.job_applications
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.job_posts jp
    where jp.id = job_post_id
      and jp.status = 'published'
      and jp.payment_status in ('paid', 'waived')
      and (jp.publish_expires_at is null or jp.publish_expires_at > now())
      and jp.application_mode in ('easy_apply', 'both')
  )
);

drop policy if exists "job_owners_can_view_applications" on public.job_applications;
create policy "job_owners_can_view_applications"
on public.job_applications
for select
to authenticated
using (
  exists (
    select 1
    from public.job_posts jp
    where jp.id = job_post_id
      and (
        jp.posted_by_user_id = auth.uid()
        or lower(jp.posted_by_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

drop policy if exists "job_admins_can_manage_applications" on public.job_applications;
create policy "job_admins_can_manage_applications"
on public.job_applications
for all
to authenticated
using (public.is_job_admin())
with check (public.is_job_admin());

revoke all on public.job_applications from anon, authenticated;
grant insert on public.job_applications to anon, authenticated;
grant select, update on public.job_applications to authenticated;

alter table public.job_board_admins enable row level security;

drop policy if exists "job_admins_can_view_admin_directory" on public.job_board_admins;
create policy "job_admins_can_view_admin_directory"
on public.job_board_admins
for select
to authenticated
using (public.is_job_admin());

drop policy if exists "job_admins_can_manage_admin_directory" on public.job_board_admins;
create policy "job_admins_can_manage_admin_directory"
on public.job_board_admins
for all
to authenticated
using (public.is_job_admin())
with check (public.is_job_admin());

revoke all on public.job_board_admins from anon, authenticated;
grant select on public.job_board_admins to authenticated;
grant insert, update, delete on public.job_board_admins to authenticated;

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by_email text,
  updated_at timestamptz not null default now()
);

create or replace function public.set_site_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_site_settings_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "public_can_view_site_settings" on public.site_settings;
create policy "public_can_view_site_settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "site_admins_can_manage_site_settings" on public.site_settings;
create policy "site_admins_can_manage_site_settings"
on public.site_settings
for all
to authenticated
using (public.is_job_admin())
with check (public.is_job_admin());

revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
