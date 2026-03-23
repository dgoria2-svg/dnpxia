create extension if not exists "pgcrypto";

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text not null default 'lab',
  created_at timestamptz not null default now()
);

create table if not exists users_account (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  password_hash text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users_account(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  price_monthly_cents integer not null default 0,
  price_yearly_cents integer not null default 0,
  max_devices integer not null default 1,
  trial_days integer not null default 15,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  plan_id uuid not null references plans(id),
  status text not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid references users_account(id) on delete set null,
  device_label text,
  platform text,
  device_fingerprint text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

insert into plans (code, name, price_monthly_cents, price_yearly_cents, max_devices, trial_days)
values
  ('trial', 'Trial', 0, 0, 1, 15),
  ('lab_basic', 'Lab Basic', 29900, 299000, 3, 15),
  ('lab_pro', 'Lab Pro', 59900, 599000, 10, 15)
on conflict (code) do nothing;
