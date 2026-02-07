create extension if not exists "pgcrypto";

create table if not exists public.words_catalog (
  id uuid primary key,
  group_no smallint not null check (group_no between 1 and 10),
  ordinal smallint not null check (ordinal >= 0),
  unique (group_no, ordinal)
);

create table if not exists public.user_learning_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default
    '{"v":1,"s":{},"sp":{"c":7,"m":7},"rf":{"g":1023,"m":15},"h":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_associations (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.words_catalog(id),
  text_he text not null
    check (text_he = btrim(text_he))
    check (char_length(text_he) between 1 and 240),
  created_by_user_id text not null check (char_length(btrim(created_by_user_id)) > 0),
  like_count integer not null default 0 check (like_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists public_assoc_word_creator_text_ux
  on public.public_associations (word_id, created_by_user_id, text_he);

create index if not exists public_assoc_word_sort_idx
  on public.public_associations (word_id, like_count desc, created_at desc);

create table if not exists public.private_associations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words_catalog(id),
  text_he text not null
    check (text_he = btrim(text_he))
    check (char_length(text_he) between 1 and 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists private_assoc_user_word_created_idx
  on public.private_associations (user_id, word_id, created_at desc);

create table if not exists public.public_association_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  association_id uuid not null references public.public_associations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, association_id)
);

create index if not exists public_assoc_likes_assoc_idx
  on public.public_association_likes (association_id);

create table if not exists public.public_association_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  association_id uuid not null references public.public_associations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, association_id)
);

create index if not exists public_assoc_saves_assoc_idx
  on public.public_association_saves (association_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_uls_set_updated_at on public.user_learning_state;
create trigger trg_uls_set_updated_at
before update on public.user_learning_state
for each row execute function public.set_updated_at();

drop trigger if exists trg_public_assoc_set_updated_at on public.public_associations;
create trigger trg_public_assoc_set_updated_at
before update on public.public_associations
for each row execute function public.set_updated_at();

drop trigger if exists trg_private_assoc_set_updated_at on public.private_associations;
create trigger trg_private_assoc_set_updated_at
before update on public.private_associations
for each row execute function public.set_updated_at();

create or replace function public.like_count_inc()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.public_associations
  set like_count = like_count + 1
  where id = new.association_id;
  return new;
end;
$$;

create or replace function public.like_count_dec()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.public_associations
  set like_count = greatest(like_count - 1, 0)
  where id = old.association_id;
  return old;
end;
$$;


drop trigger if exists trg_like_inc on public.public_association_likes;
create trigger trg_like_inc
after insert on public.public_association_likes
for each row execute function public.like_count_inc();

drop trigger if exists trg_like_dec on public.public_association_likes;
create trigger trg_like_dec
after delete on public.public_association_likes
for each row execute function public.like_count_dec();
