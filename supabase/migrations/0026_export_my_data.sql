-- Everything the app holds about the signed-in person, in one JSON document:
-- the "download my data" button (GDPR articles 15 and 20). Only their own
-- rows, and nothing about anyone else (an order's lines, not who served it).
-- Photo files themselves come as links the app signs, not inside this.

create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  return jsonb_build_object(
    'exported_at', now(),
    'account', (
      select jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'guest', coalesce(u.is_anonymous, false),
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at
      )
      from auth.users u where u.id = v_user
    ),
    'profile', (
      select to_jsonb(p) - 'role' || jsonb_build_object('role', p.role)
      from public.profiles p where p.id = v_user
    ),
    'orders', coalesce((
      select jsonb_agg(
        to_jsonb(o) || jsonb_build_object(
          'items', coalesce((
            select jsonb_agg(to_jsonb(i) - 'order_id' order by i.name_snapshot)
            from public.order_items i where i.order_id = o.id
          ), '[]'::jsonb)
        ) order by o.created_at
      )
      from public.orders o where o.user_id = v_user
    ), '[]'::jsonb),
    'points', coalesce((
      select jsonb_agg(to_jsonb(e) - 'user_id' order by e.created_at)
      from public.point_events e where e.user_id = v_user
    ), '[]'::jsonb),
    'badges', coalesce((
      select jsonb_agg(jsonb_build_object('badge', b.title, 'earned_at', ub.earned_at) order by ub.earned_at)
      from public.user_badges ub join public.badges b on b.id = ub.badge_id
      where ub.user_id = v_user
    ), '[]'::jsonb),
    'rewards', coalesce((
      select jsonb_agg(
        jsonb_build_object('reward', r.title, 'redeemed_at', ur.redeemed_at, 'used_at', ur.used_at)
        order by ur.redeemed_at
      )
      from public.user_rewards ur join public.rewards r on r.id = ur.reward_id
      where ur.user_id = v_user
    ), '[]'::jsonb),
    'check_ins', coalesce((
      select jsonb_agg(
        jsonb_build_object('pop_up', e.title, 'checked_in_at', c.checked_in_at, 'by_qr_code', c.verified_by_qr)
        order by c.checked_in_at
      )
      from public.check_ins c join public.events e on e.id = c.event_id
      where c.user_id = v_user
    ), '[]'::jsonb),
    'challenge_results', coalesce((
      select jsonb_agg(
        jsonb_build_object('challenge', ch.title, 'completed_at', cc.completed_at, 'result', cc.data)
        order by cc.completed_at
      )
      from public.challenge_completions cc join public.challenges ch on ch.id = cc.challenge_id
      where cc.user_id = v_user
    ), '[]'::jsonb),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object('file', ph.storage_path, 'taken_at', ph.created_at) order by ph.created_at)
      from public.photos ph where ph.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
