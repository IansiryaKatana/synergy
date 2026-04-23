create extension if not exists pgcrypto;

create table if not exists branding_content (
  id text primary key,
  company_name text not null,
  hero_eyebrow text not null,
  hero_title text not null,
  hero_subtitle text not null,
  services_title text not null,
  services_description text not null,
  team_title text not null,
  insights_title text not null,
  insights_description text not null,
  footer_address text not null,
  footer_newsletter_title text not null,
  footer_pitch text not null,
  footer_wordmark text not null,
  footer_email text not null,
  logo_url text,
  favicon_url text
);

create table if not exists team_members (
  id text primary key,
  initials text not null,
  name text not null,
  role text not null,
  bio text not null,
  email text not null,
  number text not null,
  avatar_url text,
  sort_order int not null default 1,
  is_active boolean not null default true
);

create table if not exists services (
  id text primary key,
  tag text not null,
  title text not null,
  description text not null,
  quote text not null,
  image_url text,
  detail_sections jsonb not null default '[]'::jsonb,
  sort_order int not null default 1,
  is_active boolean not null default true
);

create table if not exists insights (
  id text primary key,
  chip text not null,
  date_label text not null,
  title text not null,
  image_url text,
  alt_style boolean not null default false,
  sort_order int not null default 1,
  is_active boolean not null default true
);

create table if not exists media_items (
  id text primary key,
  kind text not null check (kind in ('trust','social','asset')),
  label text not null,
  value text not null,
  file_path text,
  file_url text,
  sort_order int not null default 1,
  is_active boolean not null default true
);

alter table media_items drop constraint if exists media_items_kind_check;
alter table media_items
  add constraint media_items_kind_check
  check (kind in ('trust','social','asset'));

alter table team_members add column if not exists avatar_url text;
alter table services add column if not exists image_url text;
alter table services add column if not exists detail_sections jsonb not null default '[]'::jsonb;
alter table insights add column if not exists image_url text;
alter table media_items add column if not exists file_path text;
alter table media_items add column if not exists file_url text;

alter table branding_content add column if not exists logo_url text;
alter table branding_content add column if not exists favicon_url text;

insert into branding_content (
  id, company_name, hero_eyebrow, hero_title, hero_subtitle, services_title,
  services_description, team_title, insights_title, insights_description,
  footer_address, footer_newsletter_title, footer_pitch, footer_wordmark, footer_email, logo_url, favicon_url
) values (
  'default', 'Synergy Project Management', 'Synergy Project Management',
  'Your growth partner for companies ready to scale.',
  'Synergy Project Management helps corporate teams align strategy, delivery, and operational clarity.',
  'Services',
  'Department-focused delivery across Finance, Compliance, HR, and integrated Project Management.',
  'Meet the team behind the growth.',
  'Projects.',
  'We are a leading Project Management Company providing an International proactive, hands-on approach to managing projects.',
  E'287 Mission Street\nSan Francisco, CA 94110',
  'Subscribe to our newsletter.',
  'Stalled revenue, leaky funnels, stretched leadership. Whatever is holding you back, let''s solve it.',
  'synergy',
  'Hello@synergypm.ae',
  null,
  null
) on conflict (id) do update set
  company_name = excluded.company_name,
  hero_eyebrow = excluded.hero_eyebrow,
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  services_title = excluded.services_title,
  services_description = excluded.services_description,
  team_title = excluded.team_title,
  insights_title = excluded.insights_title,
  insights_description = excluded.insights_description,
  footer_address = excluded.footer_address,
  footer_newsletter_title = excluded.footer_newsletter_title,
  footer_pitch = excluded.footer_pitch,
  footer_wordmark = excluded.footer_wordmark,
  footer_email = excluded.footer_email,
  logo_url = excluded.logo_url,
  favicon_url = excluded.favicon_url;

update team_members
set is_active = false
where id not in (
  'ahmad-al-akhras',
  'raj-gopal',
  'saju-pandarakandy',
  'rafa-nalakath',
  'jofeli-gelid',
  'anu-liju',
  'anish-vettuvelil',
  'imran-essack',
  'mohd-nafas',
  'khalid-omran',
  'jipson-k-j',
  'urvi-patel'
);

insert into team_members (id, initials, name, role, bio, email, number, avatar_url, sort_order, is_active) values
('ahmad-al-akhras','AH','Ahmad Al Akhras','Project Director','Directs project strategy, governance, and delivery standards across all active programs.','ahmad.al.akhras@synergypm.com','01','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',1,true),
('raj-gopal','RA','Raj Gopal','Project Administrator','Administers schedules, records, and documentation to keep projects organized and compliant.','raj.gopal@synergypm.com','02','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',2,true),
('saju-pandarakandy','SA','Saju Pandarakandy','Project Manager','Plans execution milestones, aligns teams, and delivers outcomes within scope commitments.','saju.pandarakandy@synergypm.com','03','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',3,true),
('rafa-nalakath','RA','Rafa Nalakath','Project Engineer','Oversees technical tasks, resolves engineering issues, and supports reliable project delivery.','rafa.nalakath@synergypm.com','04','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',4,true),
('jofeli-gelid','JO','Jofeli Gelid','QA/QC Engineer','Ensures quality standards, inspections, and corrective actions meet required specifications consistently.','jofeli.gelid@synergypm.com','05','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',5,true),
('anu-liju','AN','Anu Liju','Projects Coordinator','Coordinates teams, updates trackers, and follows through on day-to-day deliverables consistently.','anu.liju@synergypm.com','06','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',6,true),
('anish-vettuvelil','AN','Anish Vettuvelil','Chief Financial Officer','Leads financial planning, budgeting, and controls to support sustainable project growth.','anish.vettuvelil@synergypm.com','07','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',7,true),
('imran-essack','IM','Imran Essack','Project Financial Auditor','Audits project finances, verifies controls, and reports risks with clear recommendations.','imran.essack@synergypm.com','08','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',8,true),
('mohd-nafas','MO','Mohd. Nafas','Human Resource Manager','Manages hiring, people policies, and team development to strengthen project performance.','mohd.nafas@synergypm.com','09','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',9,true),
('khalid-omran','KH','Khalid Omran','Legal Advisor','Advises on contracts, compliance, and legal risk across project operations daily.','khalid.omran@synergypm.com','10','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',10,true),
('jipson-k-j','JI','Jipson K J','System Administrator','Maintains infrastructure, access, and system reliability for uninterrupted team operations daily.','jipson.kj@synergypm.com','11','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',11,true),
('urvi-patel','UR','Urvi Patel','Customer Service Executive','Supports client communication, resolves requests, and ensures responsive service experiences consistently.','urvi.patel@synergypm.com','12','https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg',12,true)
on conflict (id) do update set
initials = excluded.initials, name = excluded.name, role = excluded.role, bio = excluded.bio, email = excluded.email, number = excluded.number, avatar_url = excluded.avatar_url, sort_order = excluded.sort_order, is_active = excluded.is_active;

update services
set is_active = false
where id not in ('service-1', 'service-2', 'service-3', 'service-4');

insert into services (id, tag, title, description, quote, image_url, detail_sections, sort_order, is_active) values
('service-1','01 - Finance','Finance Head / UAE Finance Controller','Financial leadership, board reporting, UAE statutory compliance, and process transformation.','"Finance strategy aligned to UAE growth and governance."',null,$$[
  {"title":"1. Financial Leadership & Strategy","points":["Lead the overall UAE finance function aligned with group business objectives.","Develop and execute long-term financial strategy to support growth and profitability in the UAE market.","Act as strategic financial advisor to Directors and Board members.","Drive financial planning, budgeting, and forecasting processes."]},
  {"title":"2. Board Reporting & Management Information","points":["Prepare and present monthly and quarterly financial reports to the Board.","Deliver detailed MIS reports including profitability, margin analysis, and KPI performance.","Provide financial insights and variance analysis with actionable recommendations.","Support strategic decision-making with scenario planning and financial modelling."]}
]$$::jsonb,1,true),
('service-2','02 - Compliance','Compliance Department','Regulatory strategy, submissions, licensing, risk controls, and cross-functional compliance advisory.','"Regulatory pathways built for fast and safe market entry."',null,$$[
  {"title":"1. Regulatory Strategy & Planning","points":["Develop regulatory pathways for new products.","Advise leadership on approval requirements, timelines, and risks.","Identify the most efficient route to market (e.g., MHRA, EUCEG, Trading Standards).","Support expansion into new countries by assessing regulatory requirements."]},
  {"title":"2. Regulatory Submissions & Approvals","points":["Prepare and submit applications to regulatory authorities.","Manage product registrations, renewals, and amendments.","Respond to agency questions or deficiency letters.","Maintain regulatory documentation and records."]}
]$$::jsonb,2,true),
('service-3','03 - Human Resources','HR Department','UAE and UK hiring, lifecycle, payroll, compliance, engagement, and strategic workforce support.','"People operations built for UAE and UK scale."',null,$$[
  {"title":"1. Talent Acquisition & Workforce Planning","points":["Plan workforce requirements aligned with business growth in UAE and UK.","Draft job descriptions tailored to market requirements and legal standards.","Screen, shortlist, and interview candidates in compliance with UAE and UK rules."]},
  {"title":"2. Employee Lifecycle Management","points":["Prepare contracts, promotions, transfers, and exit documentation.","Monitor probation periods in line with local regulations.","Manage resignations and final settlements according to statutory requirements."]}
]$$::jsonb,3,true),
('service-4','04 - Integrated Delivery','General Services + Project Management','One coordinated delivery model across finance, compliance, HR, and project management execution.','"One operating system across all departments."',null,$$[
  {"title":"1. Department Coverage","points":["Finance leadership and UAE statutory oversight.","Regulatory strategy, approvals, and compliance operations.","UAE and UK HR lifecycle, payroll, legal compliance, and workforce planning."]},
  {"title":"2. Project Management Integration","points":["Cross-functional planning that aligns departments, milestones, and reporting.","Program tracking with clear ownership, escalations, and performance indicators.","Unified governance so every team action supports business outcomes."]}
]$$::jsonb,4,true)
on conflict (id) do update set
tag = excluded.tag, title = excluded.title, description = excluded.description, quote = excluded.quote, image_url = excluded.image_url, detail_sections = excluded.detail_sections, sort_order = excluded.sort_order, is_active = excluded.is_active;

insert into insights (id, chip, date_label, title, image_url, alt_style, sort_order, is_active) values
('insight-1','Status: Completed, December 2020','Location: Jumeirah Village Circle, Dubai','G + 14 Hotel Apartment',null,false,1,true),
('insight-2','Status: Completed, 2016','Location: Dubai Sports City, Dubai','G + 20 Hotel Apartment',null,true,2,true),
('insight-3','Status: Under Construction','Location: Jumeirah Village Circle, Dubai','G + 11 Hotel Apartment',null,false,3,true),
('insight-4','Status: Ongoing','Location: UAE','Major Hospital Project',null,true,4,true)
on conflict (id) do update set
chip = excluded.chip, date_label = excluded.date_label, title = excluded.title, image_url = excluded.image_url, alt_style = excluded.alt_style, sort_order = excluded.sort_order, is_active = excluded.is_active;

insert into media_items (id, kind, label, value, file_path, file_url, sort_order, is_active) values
('trust-1','trust','Venice','Venice',null,null,1,true),
('trust-2','trust','Lightspeed','Lightspeed',null,null,2,true),
('trust-3','trust','Sitemark','Sitemark',null,null,3,true),
('trust-4','trust','Hamilton','Hamilton',null,null,4,true),
('social-1','social','x','x',null,null,1,true),
('social-2','social','in','in',null,null,2,true),
('social-3','social','ig','ig',null,null,3,true),
('social-4','social','f','f',null,null,4,true)
on conflict (id) do update set
kind = excluded.kind, label = excluded.label, value = excluded.value, file_path = excluded.file_path, file_url = excluded.file_url, sort_order = excluded.sort_order, is_active = excluded.is_active;
