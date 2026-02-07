alter table public.user_learning_state enable row level security;
alter table public.public_associations enable row level security;
alter table public.private_associations enable row level security;
alter table public.public_association_likes enable row level security;
alter table public.public_association_saves enable row level security;

drop policy if exists uls_select_own on public.user_learning_state;
create policy uls_select_own on public.user_learning_state
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists uls_insert_own on public.user_learning_state;
create policy uls_insert_own on public.user_learning_state
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists uls_update_own on public.user_learning_state;
create policy uls_update_own on public.user_learning_state
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists pa_select_auth on public.public_associations;
create policy pa_select_auth on public.public_associations
for select to authenticated
using (true);

drop policy if exists pa_insert_own on public.public_associations;
create policy pa_insert_own on public.public_associations
for insert to authenticated
with check (created_by_user_id = (select auth.uid())::text);

drop policy if exists pa_delete_own on public.public_associations;
create policy pa_delete_own on public.public_associations
for delete to authenticated
using (created_by_user_id = (select auth.uid())::text);

drop policy if exists prv_select_own on public.private_associations;
create policy prv_select_own on public.private_associations
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists prv_insert_own on public.private_associations;
create policy prv_insert_own on public.private_associations
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists prv_update_own on public.private_associations;
create policy prv_update_own on public.private_associations
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists prv_delete_own on public.private_associations;
create policy prv_delete_own on public.private_associations
for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists likes_select_own on public.public_association_likes;
create policy likes_select_own on public.public_association_likes
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists likes_insert_own on public.public_association_likes;
create policy likes_insert_own on public.public_association_likes
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists likes_delete_own on public.public_association_likes;
create policy likes_delete_own on public.public_association_likes
for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists saves_select_own on public.public_association_saves;
create policy saves_select_own on public.public_association_saves
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists saves_insert_own on public.public_association_saves;
create policy saves_insert_own on public.public_association_saves
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists saves_delete_own on public.public_association_saves;
create policy saves_delete_own on public.public_association_saves
for delete to authenticated
using (user_id = (select auth.uid()));

grant usage on schema public to authenticated;
grant usage on schema public to service_role;

revoke all on table public.words_catalog from public, anon, authenticated;

grant select, insert, update on table public.words_catalog to service_role;

grant select, insert, update on table public.user_learning_state to authenticated;
grant select, insert, delete on table public.public_associations to authenticated;
grant select, insert, update, delete on table public.private_associations to authenticated;
grant select, insert, delete on table public.public_association_likes to authenticated;
grant select, insert, delete on table public.public_association_saves to authenticated;
