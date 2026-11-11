-- LAKKA STORIES: rate-limit public order tracking lookups.
-- Run this once in the Supabase SQL Editor for project gsesangwrryzbpudusfl.
create table if not exists public.order_tracking_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists order_tracking_attempts_ip_time_idx
  on public.order_tracking_attempts (ip_hash, attempted_at desc);

alter table public.order_tracking_attempts enable row level security;
revoke all on public.order_tracking_attempts from anon, authenticated;
-- The tracking Edge Function accesses this table using the server-side service role.
