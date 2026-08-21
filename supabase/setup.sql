-- CLOUDTECH – databáze souborů a zabezpečení
-- Spusť jednou v Supabase Dashboard > SQL Editor.

-- 1) Profil uživatele: doplnění role pro budoucí administraci.
alter table public.profiles
  add column if not exists role text not null default 'user';

-- 2) Metadata nahraných souborů.
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  file_size bigint not null default 0 check (file_size >= 0),
  mime_type text not null default 'application/octet-stream',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists files_user_id_idx on public.files(user_id);
create index if not exists files_created_at_idx on public.files(created_at desc);

alter table public.files enable row level security;

revoke all on table public.files from anon, authenticated;
grant select, insert, delete on table public.files to authenticated;

-- Opakované spuštění skriptu je bezpečné.
drop policy if exists "Users can view own files" on public.files;
drop policy if exists "Users can insert own files" on public.files;
drop policy if exists "Users can delete own files" on public.files;

create policy "Users can view own files"
on public.files
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own files"
on public.files
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete own files"
on public.files
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- 3) Soukromý Storage bucket.
insert into storage.buckets (id, name, public)
values ('user-files', 'user-files', false)
on conflict (id) do update set public = false;

-- 4) Storage policies: každý uživatel pracuje pouze ve své složce user_id/.
drop policy if exists "Users can upload own storage files" on storage.objects;
drop policy if exists "Users can read own storage files" on storage.objects;
drop policy if exists "Users can delete own storage files" on storage.objects;

create policy "Users can upload own storage files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can read own storage files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'user-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete own storage files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'user-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
