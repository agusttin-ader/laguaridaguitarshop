-- SQL to create products table for Supabase (Postgres)
create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  specs jsonb,
  price numeric(10,2),
  images jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
