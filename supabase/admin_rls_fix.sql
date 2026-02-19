-- Recreate admin helper functions with row_security disabled to avoid recursive RLS checks.
create or replace function public.is_job_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
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
set row_security = off
as $$
  select exists (
    select 1
    from public.job_board_admins admins
    where lower(trim(admins.email)) = lower(trim(coalesce(candidate_email, '')))
  );
$$;

revoke all on function public.is_job_admin_email(text) from public;
grant execute on function public.is_job_admin_email(text) to anon, authenticated;

alter table public.job_board_admins enable row level security;

drop policy if exists "job_admins_can_view_admin_directory" on public.job_board_admins;
drop policy if exists "users_can_view_own_admin_entry" on public.job_board_admins;
create policy "users_can_view_own_admin_entry"
on public.job_board_admins
for select
to authenticated
using (
  lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
);

drop policy if exists "job_admins_can_manage_admin_directory" on public.job_board_admins;

revoke all on public.job_board_admins from anon, authenticated;
grant select on public.job_board_admins to authenticated;
