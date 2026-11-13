-- LAKKA STORIES: neutral payment state for unconfirmed order requests
-- Run this migration BEFORE deploying the updated website and Edge Function.
-- Existing COD records are preserved unchanged.

alter table public.orders
  alter column payment_method set default 'to_be_agreed';

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('cod', 'to_be_agreed'));

comment on column public.orders.payment_method is
  'Payment method agreed with customer. New unconfirmed requests use to_be_agreed; legacy/confirmed COD records remain cod.';
