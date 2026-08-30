export const SCHEMA_SQL = `
create table if not exists users (
  id text primary key,
  email text not null unique,
  password_hash text not null
);
create table if not exists profiles (
  user_id text primary key references users(id) on delete cascade,
  display_name text not null
);
create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create table if not exists organizations (
  id text primary key,
  name text not null,
  slug text not null unique
);
create table if not exists organization_members (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  role text not null,
  unique (organization_id, user_id)
);

create table if not exists api_keys (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  token_hash text not null unique,
  name text not null
);
create table if not exists events (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  source text not null,
  severity text not null,
  title text not null,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, fingerprint)
);
create table if not exists alert_rules (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  source text not null,
  threshold integer not null
);
create table if not exists incidents (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  title text not null,
  status text not null,
  created_at timestamptz not null default now()
);
`;
