-- Admin magic-link setup for /admin and /admin/jobs
-- Run this in Supabase SQL Editor.

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

-- Add your admin email(s) here. Replace with real values.
insert into public.job_board_admins (email)
values
  ('you@company.com')
on conflict (email) do nothing;
