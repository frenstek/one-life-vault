-- Progress Notes table for daily shift records
-- Run this in the Supabase SQL editor for project: czdlemutsimvwfpwylxh

create table if not exists progress_notes (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid,
  participant_name text not null,
  note_date date not null,
  shift text,
  day_of_week text,
  staff_name text,
  content text not null,
  bsl_reading text,
  medication_notes text,
  concerns text,
  mood text,
  sleep_quality text,
  meals text,
  activities text,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_progress_notes_participant on progress_notes(participant_id);
create index if not exists idx_progress_notes_date on progress_notes(note_date desc);
create index if not exists idx_progress_notes_name on progress_notes(participant_name);

alter table progress_notes enable row level security;
create policy progress_notes_sel on progress_notes for select to authenticated using (true);
create policy progress_notes_ins on progress_notes for insert to authenticated with check (true);
create policy progress_notes_upd on progress_notes for update to authenticated using (true) with check (true);
create policy progress_notes_del on progress_notes for delete to authenticated using (true);

-- Also allow service role (for API functions via service key)
create policy progress_notes_service_all on progress_notes for all using (true) with check (true);
