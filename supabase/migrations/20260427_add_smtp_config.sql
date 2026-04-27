create table if not exists smtp_config (
  id text primary key default 'default',
  smtp_host text not null default '',
  smtp_port int not null default 587,
  smtp_user text not null default '',
  smtp_pass text not null default '',
  smtp_from text not null default '',
  updated_at timestamptz not null default now()
);

insert into smtp_config (id)
values ('default')
on conflict (id) do nothing;
