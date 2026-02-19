-- Enable admin user management for job_board_admins.
-- Run this in Supabase SQL Editor before using /admin/users invite actions.

alter table public.job_board_admins enable row level security;

drop policy if exists "job_admins_can_manage_admin_directory" on public.job_board_admins;
create policy "job_admins_can_manage_admin_directory"
on public.job_board_admins
for all
to authenticated
using (public.is_job_admin())
with check (public.is_job_admin());

grant select, insert, update, delete on public.job_board_admins to authenticated;
