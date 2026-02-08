create extension if not exists pgcrypto;

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('member', 'speaker', 'sponsor')),
  source text not null,
  email text not null,
  name text,
  company text,
  message text,
  newsletter boolean not null default false,
  website text,
  mixpanel_anonymous_id text,
  user_agent text,
  page_path text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'stored',
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists form_submissions_created_at_idx on public.form_submissions (created_at desc);
create index if not exists form_submissions_type_idx on public.form_submissions (type);
create index if not exists form_submissions_email_idx on public.form_submissions (email);

create or replace function public.set_form_submissions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists form_submissions_set_updated_at on public.form_submissions;
create trigger form_submissions_set_updated_at
before update on public.form_submissions
for each row execute function public.set_form_submissions_updated_at();

alter table public.form_submissions enable row level security;

drop policy if exists "public_can_insert_form_submissions" on public.form_submissions;
create policy "public_can_insert_form_submissions"
on public.form_submissions
for insert
to anon, authenticated
with check (
  type in ('member', 'speaker', 'sponsor')
  and coalesce(website, '') = ''
);

revoke all on public.form_submissions from anon, authenticated;
grant insert on public.form_submissions to anon, authenticated;

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'newsletter' check (type = 'newsletter'),
  source text not null,
  email text not null,
  mixpanel_anonymous_id text,
  user_agent text,
  page_path text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'subscribed',
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscriptions
  drop column if exists name,
  drop column if exists company,
  drop column if exists message,
  drop column if exists newsletter;
  drop column if exists website;

create unique index if not exists newsletter_subscriptions_email_key
  on public.newsletter_subscriptions (email);
create index if not exists newsletter_subscriptions_created_at_idx
  on public.newsletter_subscriptions (created_at desc);

create or replace function public.set_newsletter_subscriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists newsletter_subscriptions_set_updated_at on public.newsletter_subscriptions;
create trigger newsletter_subscriptions_set_updated_at
before update on public.newsletter_subscriptions
for each row execute function public.set_newsletter_subscriptions_updated_at();

alter table public.newsletter_subscriptions enable row level security;

drop policy if exists "public_can_insert_newsletter_subscriptions" on public.newsletter_subscriptions;
create policy "public_can_insert_newsletter_subscriptions"
on public.newsletter_subscriptions
for insert
to anon, authenticated
with check (
  type = 'newsletter'
  and coalesce(website, '') = ''
);

revoke all on public.newsletter_subscriptions from anon, authenticated;
grant insert on public.newsletter_subscriptions to anon, authenticated;
