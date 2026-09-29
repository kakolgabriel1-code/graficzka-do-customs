-- Hood Stories Customs — shared backend schema (Supabase/Postgres)
create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'staff' check (role in ('staff','owner')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  converted_order_id text
);

create table if not exists public.orders (
  id text primary key,
  project_id text references public.projects(id) on delete set null,
  payload jsonb not null,
  status text not null default 'PRZYJĘCIE',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.staff_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.orders enable row level security;

create or replace function public.is_hsc_staff()
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.staff_profiles
    where user_id = auth.uid() and role in ('staff','owner')
  );
$$;

-- Client: may only create a new project. No public listing.
drop policy if exists "public create project" on public.projects;
create policy "public create project" on public.projects
for insert to anon, authenticated
with check (true);

-- Staff: read/update projects.
drop policy if exists "staff read projects" on public.projects;
create policy "staff read projects" on public.projects
for select to authenticated using (public.is_hsc_staff());

drop policy if exists "staff update projects" on public.projects;
create policy "staff update projects" on public.projects
for update to authenticated using (public.is_hsc_staff()) with check (public.is_hsc_staff());

-- Orders are staff-controlled.
drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders" on public.orders
for select to authenticated using (public.is_hsc_staff());

drop policy if exists "staff create orders" on public.orders;
create policy "staff create orders" on public.orders
for insert to authenticated with check (public.is_hsc_staff());

drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders" on public.orders
for update to authenticated using (public.is_hsc_staff()) with check (public.is_hsc_staff());

drop policy if exists "staff profiles self read" on public.staff_profiles;
create policy "staff profiles self read" on public.staff_profiles
for select to authenticated using (user_id=auth.uid() or public.is_hsc_staff());
