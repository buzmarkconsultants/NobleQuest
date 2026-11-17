
-- ROLES ---------------------------------------------------------------
create type public.app_role as enum ('admin', 'staff');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_team(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','staff'))
$$;

create policy "Own profile readable" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_team(auth.uid()));
create policy "Own profile editable" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Own roles readable" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins grant roles" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins remove roles" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') and user_id <> auth.uid());

-- New account: create profile; the very first account becomes admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- TRIPS ---------------------------------------------------------------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  type text not null check (type in ('safari','day-trip','beach','corporate')),
  title text not null,
  destination text not null,
  days integer not null default 1 check (days >= 1),
  hours integer,
  duration_label text not null default '',
  price_usd integer not null check (price_usd >= 0),
  min_group integer not null default 1 check (min_group >= 1),
  pickup text not null default '',
  group_size text not null default '',
  image text not null default '',
  image_alt text not null default '',
  gallery jsonb not null default '[]'::jsonb,
  summary text not null default '',
  highlights text[] not null default '{}',
  itinerary jsonb not null default '[]'::jsonb,
  included text[] not null default '{}',
  excluded text[] not null default '{}',
  faqs jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.trips to anon;
grant select, insert, update, delete on public.trips to authenticated;
grant all on public.trips to service_role;
alter table public.trips enable row level security;
create policy "Published trips are public" on public.trips for select to anon, authenticated using (published);
create policy "Team reads all trips" on public.trips for select to authenticated using (public.is_team(auth.uid()));
create policy "Team adds trips" on public.trips for insert to authenticated with check (public.is_team(auth.uid()));
create policy "Team edits trips" on public.trips for update to authenticated using (public.is_team(auth.uid())) with check (public.is_team(auth.uid()));
create policy "Admins delete trips" on public.trips for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger trips_updated before update on public.trips for each row execute function public.touch_updated_at();

-- BOOKINGS ------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  trip_slug text not null,
  trip_title text not null,
  trip_type text not null,
  travel_date date not null,
  travelers integer not null check (travelers between 1 and 500),
  full_name text not null,
  email text not null,
  phone text not null,
  country text,
  pickup_location text,
  notes text,
  payment_method text not null check (payment_method in ('mpesa','card')),
  payment_plan text not null check (payment_plan in ('deposit','full')),
  total_usd integer not null,
  amount_due_usd integer not null,
  status text not null default 'new' check (status in ('new','confirmed','deposit-paid','paid','completed','cancelled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.bookings to anon, authenticated;
grant select, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "Anyone can book" on public.bookings for insert to anon, authenticated with check (status = 'new' and admin_notes is null);
create policy "Team reads bookings" on public.bookings for select to authenticated using (public.is_team(auth.uid()));
create policy "Team updates bookings" on public.bookings for update to authenticated using (public.is_team(auth.uid())) with check (public.is_team(auth.uid()));
create policy "Admins delete bookings" on public.bookings for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger bookings_updated before update on public.bookings for each row execute function public.touch_updated_at();

-- QUOTE REQUESTS ------------------------------------------------------
create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'custom' check (kind in ('custom','corporate')),
  full_name text not null,
  email text not null,
  phone text not null,
  company text,
  travel_dates text,
  group_size text,
  budget text,
  interests text[] not null default '{}',
  trip_slug text,
  message text,
  status text not null default 'new' check (status in ('new','contacted','quoted','won','lost')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.quote_requests to anon, authenticated;
grant select, update, delete on public.quote_requests to authenticated;
grant all on public.quote_requests to service_role;
alter table public.quote_requests enable row level security;
create policy "Anyone can request a quote" on public.quote_requests for insert to anon, authenticated with check (status = 'new' and admin_notes is null);
create policy "Team reads quotes" on public.quote_requests for select to authenticated using (public.is_team(auth.uid()));
create policy "Team updates quotes" on public.quote_requests for update to authenticated using (public.is_team(auth.uid())) with check (public.is_team(auth.uid()));
create policy "Admins delete quotes" on public.quote_requests for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger quotes_updated before update on public.quote_requests for each row execute function public.touch_updated_at();

-- REVIEWS -------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default '',
  flag text not null default '',
  rating integer not null default 5 check (rating between 1 and 5),
  trip text not null default '',
  quote text not null,
  source text not null default 'Google' check (source in ('TripAdvisor','Google','Direct')),
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Published reviews are public" on public.reviews for select to anon, authenticated using (published);
create policy "Team reads all reviews" on public.reviews for select to authenticated using (public.is_team(auth.uid()));
create policy "Team adds reviews" on public.reviews for insert to authenticated with check (public.is_team(auth.uid()));
create policy "Team edits reviews" on public.reviews for update to authenticated using (public.is_team(auth.uid())) with check (public.is_team(auth.uid()));
create policy "Team deletes reviews" on public.reviews for delete to authenticated using (public.is_team(auth.uid()));

-- ARTICLES ------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  image text not null default '',
  image_alt text not null default '',
  read_time text not null default '',
  published_on date not null default current_date,
  body jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;
alter table public.articles enable row level security;
create policy "Published articles are public" on public.articles for select to anon, authenticated using (published);
create policy "Team reads all articles" on public.articles for select to authenticated using (public.is_team(auth.uid()));
create policy "Team adds articles" on public.articles for insert to authenticated with check (public.is_team(auth.uid()));
create policy "Team edits articles" on public.articles for update to authenticated using (public.is_team(auth.uid())) with check (public.is_team(auth.uid()));
create policy "Team deletes articles" on public.articles for delete to authenticated using (public.is_team(auth.uid()));
create trigger articles_updated before update on public.articles for each row execute function public.touch_updated_at();

-- NEWSLETTER ----------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select, delete on public.newsletter_subscribers to authenticated;
grant all on public.newsletter_subscribers to service_role;
alter table public.newsletter_subscribers enable row level security;
create policy "Anyone can subscribe" on public.newsletter_subscribers for insert to anon, authenticated with check (true);
create policy "Team reads subscribers" on public.newsletter_subscribers for select to authenticated using (public.is_team(auth.uid()));
create policy "Admins remove subscribers" on public.newsletter_subscribers for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- PHOTO STORAGE (bucket site-photos) -----------------------------------
create policy "Team uploads photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-photos' and public.is_team(auth.uid()));
create policy "Team updates photos" on storage.objects for update to authenticated
  using (bucket_id = 'site-photos' and public.is_team(auth.uid()));
create policy "Team deletes photos" on storage.objects for delete to authenticated
  using (bucket_id = 'site-photos' and public.is_team(auth.uid()));
