-- Payment Review Desk (replaces the auditor portal). Run once in the vault project's SQL editor.
create table if not exists pr_reviews (
  id uuid primary key default gen_random_uuid(),
  reference text not null,                -- IPML0346, RTP6501
  round int,                              -- 1..n for the same reference
  title text not null,
  letter_date date,
  due_date date,
  email_to text,
  status text not null default 'open' check (status in ('open','sent','closed')),
  sent_date date,
  notes text,
  letter_path text,                        -- storage path of the NDIA letter (bucket documents)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists pr_reviews_ref_round on pr_reviews (reference, coalesce(round, 0));

create table if not exists pr_claims (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references pr_reviews(id) on delete cascade,
  participant_id uuid references participants(id),
  participant_name text not null,
  ndis_number text,
  posted date,
  prn text not null,
  amount numeric(10,2) not null default 0,
  support text,
  invoice_no text,
  finding text,                            -- the NDIA's wording
  week_start date,                         -- service week the claim belongs to (set by us)
  week_end date,
  status text not null default 'open' check (status in ('open','evidenced','sent','paid','cancelled','not_ours')),
  notes text,
  created_at timestamptz not null default now()
);
create unique index if not exists pr_claims_review_prn on pr_claims (review_id, prn);
create index if not exists pr_claims_week on pr_claims (participant_id, week_start);

-- evidence is attached per review + participant + service week; a claim is covered when its week is
create table if not exists pr_evidence (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references pr_reviews(id) on delete cascade,
  participant_id uuid references participants(id),
  week_start date,
  week_end date,
  kind text not null check (kind in ('notes','roster','timesheet','payslip','contractor_invoice','invoice','service_agreement','contacts','schedule','travel','other')),
  file_id uuid references participant_files(id) on delete set null,
  file_name text,
  storage_path text,
  sent_date date,                           -- when it went to the NDIA (null = not yet)
  note text,
  created_at timestamptz not null default now()
);
create index if not exists pr_evidence_week on pr_evidence (review_id, participant_id, week_start);

alter table pr_reviews enable row level security;
alter table pr_claims enable row level security;
alter table pr_evidence enable row level security;
create policy "pr auth all reviews" on pr_reviews for all to authenticated using (true) with check (true);
create policy "pr auth all claims" on pr_claims for all to authenticated using (true) with check (true);
create policy "pr auth all evidence" on pr_evidence for all to authenticated using (true) with check (true);
