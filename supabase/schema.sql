create table if not exists public.planner_snapshots (
  sync_key text primary key,
  planner_state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.planner_snapshots enable row level security;

drop policy if exists "planner snapshots read by sync key" on public.planner_snapshots;
drop policy if exists "planner snapshots insert by sync key" on public.planner_snapshots;
drop policy if exists "planner snapshots update by sync key" on public.planner_snapshots;

create policy "planner snapshots read by sync key"
on public.planner_snapshots
for select
to anon
using (true);

create policy "planner snapshots insert by sync key"
on public.planner_snapshots
for insert
to anon
with check (true);

create policy "planner snapshots update by sync key"
on public.planner_snapshots
for update
to anon
using (true)
with check (true);

create or replace function public.set_planner_snapshot_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_planner_snapshot_updated_at on public.planner_snapshots;

create trigger set_planner_snapshot_updated_at
before update on public.planner_snapshots
for each row
execute function public.set_planner_snapshot_updated_at();
