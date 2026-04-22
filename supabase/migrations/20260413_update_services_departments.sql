-- Update services and branding copy to department-based content.
alter table services
add column if not exists detail_sections jsonb not null default '[]'::jsonb;

update branding_content
set services_description = 'Department-focused delivery across Finance, Compliance, HR, and integrated Project Management.'
where id = 'default';

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
  tag = excluded.tag,
  title = excluded.title,
  description = excluded.description,
  quote = excluded.quote,
  image_url = excluded.image_url,
  detail_sections = excluded.detail_sections,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
