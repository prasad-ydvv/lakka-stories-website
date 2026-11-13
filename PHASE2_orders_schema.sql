-- LAKKA STORIES Phase 2 order schema
-- Review the project ID and manager UID before running in Mumbai Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  pin_code text not null,
  address text not null,
  city text not null,
  state text not null,
  notes text,
  payment_method text not null default 'to_be_agreed' check (payment_method in ('cod','to_be_agreed')),
  order_status text not null default 'pending_review'
    check (order_status in ('pending_review','awaiting_customer_confirmation','confirmed','rejected','dispatched','delivered','cancelled')),
  payment_status text not null default 'not_collected'
    check (payment_status in ('not_collected','collected','remitted','refunded')),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  final_delivery_charge numeric(12,2),
  final_payable numeric(12,2),
  price_needs_confirmation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null,
  product_name text not null,
  quantity integer not null check (quantity between 1 and 99),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  price_needs_confirmation boolean not null default true
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(order_status,created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- No direct public access. The Edge Function uses server-side service role.
revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;

-- Manager-only access. Verify this UID is still the authorised manager UID.
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;

drop policy if exists "Manager can view and update orders" on public.orders;
create policy "Manager can view and update orders"
on public.orders for select to authenticated
using ((select auth.uid()) = '5eaca531-3d59-4878-822c-da9c359dd259'::uuid);

create policy "Manager can update orders"
on public.orders for update to authenticated
using ((select auth.uid()) = '5eaca531-3d59-4878-822c-da9c359dd259'::uuid)
with check ((select auth.uid()) = '5eaca531-3d59-4878-822c-da9c359dd259'::uuid);

drop policy if exists "Manager can view order items" on public.order_items;
create policy "Manager can view order items"
on public.order_items for select to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_items.order_id
    and (select auth.uid()) = '5eaca531-3d59-4878-822c-da9c359dd259'::uuid
));
