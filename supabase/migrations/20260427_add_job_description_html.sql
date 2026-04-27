alter table job_posts
add column if not exists job_description_html text not null default '';
