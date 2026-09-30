-- Cent's Detailing&Customs — shared backend schema (Supabase/Postgres)
-- v2: klient ma prywatny kod śledzenia i może odczytać tylko swój status.

create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'staff' check (role in ('staff','owner')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  tracking_code text unique,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  converted_order_id text
);
alter table public.projects add column if not exists tracking_code text;
create unique index if not exists projects_tracking_code_idx on public.projects(tracking_code);

create table if not exists public.orders (
  id text primary key,
  project_id text references public.projects(id) on delete set null,
  tracking_code text unique,
  payload jsonb not null,
  status text not null default 'PRZYJĘCIE',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.orders add column if not exists tracking_code text;
create unique index if not exists orders_tracking_code_idx on public.orders(tracking_code);

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

-- Klient może jedynie wysłać nowe zgłoszenie. Nie może listować projektów.
drop policy if exists "public create project" on public.projects;
create policy "public create project" on public.projects
for insert to anon, authenticated
with check (true);

-- Pracownik może czytać i aktualizować projekty.
drop policy if exists "staff read projects" on public.projects;
create policy "staff read projects" on public.projects
for select to authenticated using (public.is_hsc_staff());

drop policy if exists "staff update projects" on public.projects;
create policy "staff update projects" on public.projects
for update to authenticated using (public.is_hsc_staff()) with check (public.is_hsc_staff());

-- Zlecenia są kontrolowane wyłącznie przez pracowników.
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

-- Publiczny odczyt statusu po długim, losowym kodzie śledzenia.
-- Funkcja zwraca tylko dane potrzebne klientowi, bez dostępu do listy wszystkich zleceń.
create or replace function public.hsc_public_status(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  o record;
  p record;
begin
  select * into o from public.orders where upper(tracking_code)=upper(p_token) limit 1;
  if found then
    return jsonb_build_object(
      'id',o.id,
      'status',o.status,
      'vehicle',o.payload->'vehicle',
      'registration',o.payload->'registration',
      'bay',o.payload->'bay',
      'paymentStatus',o.payload->'paymentStatus',
      'history',coalesce(o.payload->'history','[]'::jsonb)
    );
  end if;

  select * into p from public.projects where upper(tracking_code)=upper(p_token) limit 1;
  if found then
    return jsonb_build_object(
      'id',p.id,
      'status','CZEKA NA PRZYJĘCIE',
      'vehicle',p.payload->'vehicle',
      'registration',p.payload->'registration',
      'bay',null,
      'paymentStatus','NIEOPŁACONE',
      'history',coalesce(p.payload->'history','[]'::jsonb)
    );
  end if;

  return null;
end;
$$;

revoke all on function public.hsc_public_status(text) from public;
grant execute on function public.hsc_public_status(text) to anon, authenticated;
