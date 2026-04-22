alter table services
add column if not exists detail_sections jsonb not null default '[]'::jsonb;

update services
set detail_sections = case id
  when 'service-1' then
    $$[
      {"title":"1. Financial Leadership & Strategy","points":["Lead the overall UAE finance function aligned with group business objectives.","Develop and execute long-term financial strategy to support growth and profitability in the UAE market.","Act as strategic financial advisor to Directors and Board members.","Drive financial planning, budgeting, and forecasting processes."]},
      {"title":"2. Board Reporting & Management Information","points":["Prepare and present monthly and quarterly financial reports to the Board.","Deliver detailed MIS reports including profitability, margin analysis, and KPI performance.","Provide financial insights and variance analysis with actionable recommendations.","Support strategic decision-making with scenario planning and financial modelling."]}
    ]$$::jsonb
  when 'service-2' then
    $$[
      {"title":"1. Regulatory Strategy & Planning","points":["Develop regulatory pathways for new products.","Advise leadership on approval requirements, timelines, and risks.","Identify the most efficient route to market (e.g., MHRA, EUCEG, Trading Standards).","Support expansion into new countries by assessing regulatory requirements."]},
      {"title":"2. Regulatory Submissions & Approvals","points":["Prepare and submit applications to regulatory authorities.","Manage product registrations, renewals, and amendments.","Respond to agency questions or deficiency letters.","Maintain regulatory documentation and records."]}
    ]$$::jsonb
  when 'service-3' then
    $$[
      {"title":"1. Talent Acquisition & Workforce Planning","points":["Plan workforce requirements aligned with business growth in UAE and UK.","Draft job descriptions tailored to market requirements and legal standards.","Screen, shortlist, and interview candidates in compliance with UAE and UK rules."]},
      {"title":"2. Employee Lifecycle Management","points":["Prepare contracts, promotions, transfers, and exit documentation.","Monitor probation periods in line with local regulations.","Manage resignations and final settlements according to statutory requirements."]}
    ]$$::jsonb
  when 'service-4' then
    $$[
      {"title":"1. Department Coverage","points":["Finance leadership and UAE statutory oversight.","Regulatory strategy, approvals, and compliance operations.","UAE and UK HR lifecycle, payroll, legal compliance, and workforce planning."]},
      {"title":"2. Project Management Integration","points":["Cross-functional planning that aligns departments, milestones, and reporting.","Program tracking with clear ownership, escalations, and performance indicators.","Unified governance so every team action supports business outcomes."]}
    ]$$::jsonb
  else detail_sections
end
where id in ('service-1', 'service-2', 'service-3', 'service-4');
