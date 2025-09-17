-- 1) Tipos e tabelas-base
do $$ begin
  create type public.company_role as enum ('owner','admin','staff','receptionist','professional');
exception when duplicate_object then null; end $$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  role public.company_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

-- 2) Função que valida acesso por empresa
create or replace function public.user_has_company_access(c_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.company_members
    where company_id = c_id and user_id = auth.uid()
  );
$$;

-- 3) RLS em companies/company_members
alter table public.companies enable row level security;
alter table public.company_members enable row level security;

do $$ begin
  -- companies: listar/usar apenas as que o usuário pertence
  create policy companies_select on public.companies
    for select using (
      exists (
        select 1 from public.company_members m
        where m.company_id = id and m.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy company_members_select on public.company_members
    for select using (user_has_company_access(company_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy company_members_insert on public.company_members
    for insert with check (user_has_company_access(company_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy company_members_update on public.company_members
    for update using (user_has_company_access(company_id))
    with check (user_has_company_access(company_id));
exception when duplicate_object then null; end $$;

-- 4) Função de bootstrap: o primeiro usuário autenticado pode criar a empresa e virar OWNER
--    Regra: só permite se ainda não existir QUALQUER owner no sistema (bootstrap único)
create or replace function public.claim_system_owner(p_company_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_company_id uuid;
  v_owner_exists boolean;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;

  -- Já existe owner no sistema?
  select exists (
    select 1 from public.company_members where role = 'owner'
  ) into v_owner_exists;

  if v_owner_exists then
    raise exception 'owner_already_exists';
  end if;

  -- Cria empresa e membership OWNER para o usuário atual
  insert into public.companies(name) values (coalesce(p_company_name, 'Minha Barbearia'))
  returning id into v_company_id;

  insert into public.company_members(company_id, user_id, role)
  values (v_company_id, v_uid, 'owner');

  return v_company_id;
end;
$$;

-- 5) Função de grant admin por e-mail (para uso no SQL Editor)
--    Observação: requer que o e-mail já exista no Auth.
create or replace function public.grant_admin_by_email(p_company_name text, p_email text, p_owner boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
  v_company_id uuid;
begin
  if p_email is null or length(p_email) = 0 then
    raise exception 'email_required';
  end if;

  select id into v_uid from auth.users where lower(email) = lower(p_email);
  if v_uid is null then
    raise exception 'auth_user_not_found';
  end if;

  select id into v_company_id from public.companies where name = p_company_name limit 1;
  if v_company_id is null then
    insert into public.companies(name) values (p_company_name) returning id into v_company_id;
  end if;

  insert into public.company_members(company_id, user_id, role)
  values (v_company_id, v_uid, case when p_owner then 'owner' else 'admin' end)
  on conflict (company_id, user_id) do update
    set role = excluded.role;

  return v_company_id;
end;
$$;
