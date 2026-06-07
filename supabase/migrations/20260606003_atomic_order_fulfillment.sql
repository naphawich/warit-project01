-- Migration: Atomic order fulfillment (mark paid + grant entitlements)
-- Created: 2026-06-06
-- Fixes the "paid but 0 courses" race (audit C1 / CQ#1): a webhook retry must
-- re-grant if a prior attempt marked the order paid but failed to grant.
-- Already applied to the live DB via MCP apply_migration on 2026-06-06.

create or replace function public.fulfill_paid_order(p_order_id uuid)
returns table (
  course_id integer,
  course_title text,
  price integer,
  order_user_id uuid,
  was_already_paid boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_was_paid boolean;
begin
  select o.user_id, (o.status = 'paid')
    into v_user_id, v_was_paid
  from orders o
  where o.id = p_order_id
  for update;

  if v_user_id is null then
    raise exception 'order_not_found';
  end if;

  insert into user_courses (user_id, course_id, order_id)
  select v_user_id, oi.course_id, p_order_id
  from order_items oi
  where oi.order_id = p_order_id
  on conflict (user_id, course_id) do nothing;

  update orders
  set status = 'paid',
      paid_at = coalesce(paid_at, now()),
      updated_at = now()
  where id = p_order_id;

  return query
  select oi.course_id, oi.course_title, oi.price, v_user_id, v_was_paid
  from order_items oi
  where oi.order_id = p_order_id;
end;
$$;

revoke execute on function public.fulfill_paid_order(uuid) from anon, authenticated, public;
grant execute on function public.fulfill_paid_order(uuid) to service_role;

-- ROLLBACK:
-- drop function if exists public.fulfill_paid_order(uuid);
