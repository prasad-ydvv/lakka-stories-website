-- LAKKA STORIES: optional shipment tracking details
-- Apply once in the Supabase SQL Editor for the production project.

alter table public.orders
  add column if not exists courier_name text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists dispatched_at timestamptz;

alter table public.orders
  drop constraint if exists orders_tracking_url_https_check;

alter table public.orders
  add constraint orders_tracking_url_https_check
  check (tracking_url is null or tracking_url ~* '^https://');

comment on column public.orders.courier_name is 'Optional courier or postal service name.';
comment on column public.orders.tracking_number is 'Optional courier AWB or consignment number.';
comment on column public.orders.tracking_url is 'Optional HTTPS courier tracking page.';
comment on column public.orders.dispatched_at is 'Timestamp when manager marked the order dispatched.';
