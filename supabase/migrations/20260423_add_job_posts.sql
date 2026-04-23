create table if not exists job_posts (
  id text primary key,
  title text not null,
  department text not null,
  summary text not null,
  location_label text not null default '100% remote',
  employment_type text not null default 'Full-time',
  workplace_type text not null default 'Remote',
  apply_url text,
  sort_order int not null default 1,
  is_active boolean not null default true
);

create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references job_posts(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  cover_note text,
  cv_url text,
  status text not null default 'new',
  submitted_at timestamptz not null default now()
);

alter table job_applications
add column if not exists cv_url text;

insert into job_posts (id, title, department, summary, location_label, employment_type, workplace_type, apply_url, sort_order, is_active) values
('job-product-designer','Product Designer','Design','We are looking for a mid-level product designer to join our team.','100% remote','Full-time','Remote','#',1,true),
('job-engineering-manager','Engineering Manager','Development','We are looking for an experienced engineering manager to join our team.','100% remote','Full-time','Remote','#',2,true),
('job-customer-success-manager','Customer Success Manager','Customer Service','We are looking for a customer success manager to join our team.','100% remote','Full-time','Remote','#',3,true)
on conflict (id) do update set
title = excluded.title,
department = excluded.department,
summary = excluded.summary,
location_label = excluded.location_label,
employment_type = excluded.employment_type,
workplace_type = excluded.workplace_type,
apply_url = excluded.apply_url,
sort_order = excluded.sort_order,
is_active = excluded.is_active;
