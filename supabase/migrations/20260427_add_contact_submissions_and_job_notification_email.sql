create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  message text not null,
  status text not null default 'new',
  submitted_at timestamptz not null default now()
);

alter table job_posts
add column if not exists notification_email text;
