
REVOKE EXECUTE ON FUNCTION public.join_open_cup_queue(text,int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_open_cup_queue() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_open_cup_result(uuid,int,int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirm_open_cup_result(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_resolve_open_cup_match(uuid,int,int) FROM PUBLIC, anon;
