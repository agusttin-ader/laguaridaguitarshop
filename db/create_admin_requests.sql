-- Create table to store admin access requests
create extension if not exists pgcrypto;

create table if not exists admin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  status text default 'pending', -- pending, approved, rejected
  message text,
  created_at timestamptz default now()
);
