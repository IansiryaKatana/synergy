import { supabaseRest } from './supabase'

export type TeamMember = {
  id: string
  initials: string
  name: string
  role: string
  bio: string
  email: string
  number: string
  avatar_url?: string | null
  sort_order: number
  is_active: boolean
}

export type ServiceItem = {
  id: string
  tag: string
  title: string
  description: string
  quote: string
  detail_sections?: Array<{
    title: string
    points: string[]
  }>
  image_url?: string | null
  sort_order: number
  is_active: boolean
}

export type InsightItem = {
  id: string
  chip: string
  date_label: string
  title: string
  image_url?: string | null
  alt_style: boolean
  sort_order: number
  is_active: boolean
}

export type MediaItem = {
  id: string
  kind: 'trust' | 'social' | 'asset'
  label: string
  value: string
  file_path?: string | null
  file_url?: string | null
  sort_order: number
  is_active: boolean
}

export type JobPost = {
  id: string
  title: string
  department: string
  summary: string
  location_label: string
  employment_type: string
  workplace_type: string
  apply_url?: string | null
  sort_order: number
  is_active: boolean
}

export type JobApplicationInput = {
  job_id: string
  full_name: string
  email: string
  phone?: string
  cover_note?: string
  cv_url?: string
}

export type BrandingContent = {
  id: string
  company_name: string
  hero_eyebrow: string
  hero_title: string
  hero_subtitle: string
  services_title: string
  services_description: string
  team_title: string
  insights_title: string
  insights_description: string
  footer_address: string
  footer_newsletter_title: string
  footer_pitch: string
  footer_wordmark: string
  footer_email: string
  logo_url?: string | null
  favicon_url?: string | null
}

export type SiteContent = {
  branding: BrandingContent
  team: TeamMember[]
  services: ServiceItem[]
  insights: InsightItem[]
  media: MediaItem[]
  jobs: JobPost[]
}

const fallback: SiteContent = {
  branding: {
    id: 'default',
    company_name: 'Synergy Project Management',
    hero_eyebrow: 'Synergy Project Management',
    hero_title: 'Your growth partner for companies ready to scale.',
    hero_subtitle:
      'Synergy Project Management helps corporate teams align strategy, delivery, and operational clarity.',
    services_title: 'Services',
    services_description:
      'Department-focused delivery across Finance, Compliance, HR, and integrated Project Management.',
    team_title: 'Meet the team behind the growth.',
    insights_title: 'Projects.',
    insights_description:
      'We are a leading Project Management Company providing an International proactive, hands-on approach to managing projects.',
    footer_address: '287 Mission Street\nSan Francisco, CA 94110',
    footer_newsletter_title: 'Subscribe to our newsletter.',
    footer_pitch:
      "Stalled revenue, leaky funnels, stretched leadership. Whatever is holding you back, let's solve it.",
    footer_wordmark: 'synergy',
    footer_email: 'Hello@synergypm.ae',
    logo_url: null,
    favicon_url: null,
  },
  team: [
    { id: 'ahmad-al-akhras', initials: 'AH', name: 'Ahmad Al Akhras', role: 'Project Director', number: '01', email: 'ahmad.al.akhras@synergypm.com', bio: 'Directs project strategy, governance, and delivery standards across all active programs.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 1, is_active: true },
    { id: 'raj-gopal', initials: 'RA', name: 'Raj Gopal', role: 'Project Administrator', number: '02', email: 'raj.gopal@synergypm.com', bio: 'Administers schedules, records, and documentation to keep projects organized and compliant.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 2, is_active: true },
    { id: 'saju-pandarakandy', initials: 'SA', name: 'Saju Pandarakandy', role: 'Project Manager', number: '03', email: 'saju.pandarakandy@synergypm.com', bio: 'Plans execution milestones, aligns teams, and delivers outcomes within scope commitments.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 3, is_active: true },
    { id: 'rafa-nalakath', initials: 'RA', name: 'Rafa Nalakath', role: 'Project Engineer', number: '04', email: 'rafa.nalakath@synergypm.com', bio: 'Oversees technical tasks, resolves engineering issues, and supports reliable project delivery.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 4, is_active: true },
    { id: 'jofeli-gelid', initials: 'JO', name: 'Jofeli Gelid', role: 'QA/QC Engineer', number: '05', email: 'jofeli.gelid@synergypm.com', bio: 'Ensures quality standards, inspections, and corrective actions meet required specifications consistently.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 5, is_active: true },
    { id: 'anu-liju', initials: 'AN', name: 'Anu Liju', role: 'Projects Coordinator', number: '06', email: 'anu.liju@synergypm.com', bio: 'Coordinates teams, updates trackers, and follows through on day-to-day deliverables consistently.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 6, is_active: true },
    { id: 'anish-vettuvelil', initials: 'AN', name: 'Anish Vettuvelil', role: 'Chief Financial Officer', number: '07', email: 'anish.vettuvelil@synergypm.com', bio: 'Leads financial planning, budgeting, and controls to support sustainable project growth.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 7, is_active: true },
    { id: 'imran-essack', initials: 'IM', name: 'Imran Essack', role: 'Project Financial Auditor', number: '08', email: 'imran.essack@synergypm.com', bio: 'Audits project finances, verifies controls, and reports risks with clear recommendations.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 8, is_active: true },
    { id: 'mohd-nafas', initials: 'MO', name: 'Mohd. Nafas', role: 'Human Resource Manager', number: '09', email: 'mohd.nafas@synergypm.com', bio: 'Manages hiring, people policies, and team development to strengthen project performance.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 9, is_active: true },
    { id: 'khalid-omran', initials: 'KH', name: 'Khalid Omran', role: 'Legal Advisor', number: '10', email: 'khalid.omran@synergypm.com', bio: 'Advises on contracts, compliance, and legal risk across project operations daily.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 10, is_active: true },
    { id: 'jipson-k-j', initials: 'JI', name: 'Jipson K J', role: 'System Administrator', number: '11', email: 'jipson.kj@synergypm.com', bio: 'Maintains infrastructure, access, and system reliability for uninterrupted team operations daily.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 11, is_active: true },
    { id: 'urvi-patel', initials: 'UR', name: 'Urvi Patel', role: 'Customer Service Executive', number: '12', email: 'urvi.patel@synergypm.com', bio: 'Supports client communication, resolves requests, and ensures responsive service experiences consistently.', avatar_url: 'https://fjnzcubicgrkhbwwrtpu.supabase.co/storage/v1/object/public/media/admin/1775821932031-cjdfu8xdn6k.jpg', sort_order: 12, is_active: true },
  ],
  services: [
    {
      id: 'service-1',
      tag: '01 - Finance',
      title: 'Finance Head / UAE Finance Controller',
      description: 'Financial leadership, board reporting, UAE statutory compliance, and process transformation.',
      quote: '"Finance strategy aligned to UAE growth and governance."',
      detail_sections: [
        {
          title: '1. Financial Leadership & Strategy',
          points: [
            'Lead the overall UAE finance function aligned with group business objectives.',
            'Develop and execute long-term financial strategy to support growth and profitability in the UAE market.',
            'Act as strategic financial advisor to Directors and Board members.',
            'Drive financial planning, budgeting, and forecasting processes.',
          ],
        },
        {
          title: '2. Board Reporting & Management Information',
          points: [
            'Prepare and present monthly and quarterly financial reports to the Board.',
            'Deliver detailed MIS reports including profitability, margin analysis, and KPI performance.',
            'Provide financial insights and variance analysis with actionable recommendations.',
            'Support strategic decision-making with scenario planning and financial modelling.',
          ],
        },
      ],
      sort_order: 1,
      is_active: true,
    },
    {
      id: 'service-2',
      tag: '02 - Compliance',
      title: 'Compliance Department',
      description: 'Regulatory strategy, submissions, licensing, risk controls, and cross-functional compliance advisory.',
      quote: '"Regulatory pathways built for fast and safe market entry."',
      detail_sections: [
        {
          title: '1. Regulatory Strategy & Planning',
          points: [
            'Develop regulatory pathways for new products.',
            'Advise leadership on approval requirements, timelines, and risks.',
            'Identify the most efficient route to market (e.g., MHRA, EUCEG, Trading Standards).',
            'Support expansion into new countries by assessing regulatory requirements.',
          ],
        },
        {
          title: '2. Regulatory Submissions & Approvals',
          points: [
            'Prepare and submit applications to regulatory authorities.',
            'Manage product registrations, renewals, and amendments.',
            'Respond to agency questions or deficiency letters.',
            'Maintain regulatory documentation and records.',
          ],
        },
      ],
      sort_order: 2,
      is_active: true,
    },
    {
      id: 'service-3',
      tag: '03 - Human Resources',
      title: 'HR Department',
      description: 'UAE and UK hiring, lifecycle, payroll, compliance, engagement, and strategic workforce support.',
      quote: '"People operations built for UAE and UK scale."',
      detail_sections: [
        {
          title: '1. Talent Acquisition & Workforce Planning',
          points: [
            'Plan workforce requirements aligned with business growth in UAE and UK.',
            'Draft job descriptions tailored to market requirements and legal standards.',
            'Screen, shortlist, and interview candidates in compliance with UAE and UK rules.',
          ],
        },
        {
          title: '2. Employee Lifecycle Management',
          points: [
            'Prepare contracts, promotions, transfers, and exit documentation.',
            'Monitor probation periods in line with local regulations.',
            'Manage resignations and final settlements according to statutory requirements.',
          ],
        },
      ],
      sort_order: 3,
      is_active: true,
    },
    {
      id: 'service-4',
      tag: '04 - Integrated Delivery',
      title: 'General Services + Project Management',
      description: 'One coordinated delivery model across finance, compliance, HR, and project management execution.',
      quote: '"One operating system across all departments."',
      detail_sections: [
        {
          title: '1. Department Coverage',
          points: [
            'Finance leadership and UAE statutory oversight.',
            'Regulatory strategy, approvals, and compliance operations.',
            'UAE and UK HR lifecycle, payroll, legal compliance, and workforce planning.',
          ],
        },
        {
          title: '2. Project Management Integration',
          points: [
            'Cross-functional planning that aligns departments, milestones, and reporting.',
            'Program tracking with clear ownership, escalations, and performance indicators.',
            'Unified governance so every team action supports business outcomes.',
          ],
        },
      ],
      sort_order: 4,
      is_active: true,
    },
  ],
  insights: [
    { id: 'insight-1', chip: 'Status: Completed, December 2020', date_label: 'Location: Jumeirah Village Circle, Dubai', title: 'G + 14 Hotel Apartment', alt_style: false, sort_order: 1, is_active: true },
    { id: 'insight-2', chip: 'Status: Completed, 2016', date_label: 'Location: Dubai Sports City, Dubai', title: 'G + 20 Hotel Apartment', alt_style: true, sort_order: 2, is_active: true },
    { id: 'insight-3', chip: 'Status: Under Construction', date_label: 'Location: Jumeirah Village Circle, Dubai', title: 'G + 11 Hotel Apartment', alt_style: false, sort_order: 3, is_active: true },
    { id: 'insight-4', chip: 'Status: Ongoing', date_label: 'Location: UAE', title: 'Major Hospital Project', alt_style: true, sort_order: 4, is_active: true },
  ],
  media: [
    { id: 'trust-1', kind: 'trust', label: 'Venice', value: 'Venice', sort_order: 1, is_active: true },
    { id: 'trust-2', kind: 'trust', label: 'Lightspeed', value: 'Lightspeed', sort_order: 2, is_active: true },
    { id: 'trust-3', kind: 'trust', label: 'Sitemark', value: 'Sitemark', sort_order: 3, is_active: true },
    { id: 'trust-4', kind: 'trust', label: 'Hamilton', value: 'Hamilton', sort_order: 4, is_active: true },
    { id: 'social-1', kind: 'social', label: 'x', value: 'x', sort_order: 1, is_active: true },
    { id: 'social-2', kind: 'social', label: 'in', value: 'in', sort_order: 2, is_active: true },
    { id: 'social-3', kind: 'social', label: 'ig', value: 'ig', sort_order: 3, is_active: true },
    { id: 'social-4', kind: 'social', label: 'f', value: 'f', sort_order: 4, is_active: true },
  ],
  jobs: [
    {
      id: 'job-product-designer',
      title: 'Product Designer',
      department: 'Design',
      summary: 'We are looking for a mid-level product designer to join our team.',
      location_label: '100% remote',
      employment_type: 'Full-time',
      workplace_type: 'Remote',
      apply_url: '#',
      sort_order: 1,
      is_active: true,
    },
    {
      id: 'job-engineering-manager',
      title: 'Engineering Manager',
      department: 'Development',
      summary: 'We are looking for an experienced engineering manager to join our team.',
      location_label: '100% remote',
      employment_type: 'Full-time',
      workplace_type: 'Remote',
      apply_url: '#',
      sort_order: 2,
      is_active: true,
    },
    {
      id: 'job-customer-success-manager',
      title: 'Customer Success Manager',
      department: 'Customer Service',
      summary: 'We are looking for a customer success manager to join our team.',
      location_label: '100% remote',
      employment_type: 'Full-time',
      workplace_type: 'Remote',
      apply_url: '#',
      sort_order: 3,
      is_active: true,
    },
  ],
}

const orderBy = <T extends { sort_order: number }>(items: T[]) =>
  [...items].sort((a, b) => a.sort_order - b.sort_order)

export const contentApi = {
  fallback,
  async getSiteContent(): Promise<SiteContent> {
    try {
      const [branding, team, services, insights, media, jobs] = await Promise.all([
        supabaseRest.selectOne<BrandingContent>('branding_content'),
        supabaseRest.select<TeamMember>('team_members'),
        supabaseRest.select<ServiceItem>('services'),
        supabaseRest.select<InsightItem>('insights'),
        supabaseRest.select<MediaItem>('media_items'),
        supabaseRest.select<JobPost>('job_posts'),
      ])
      return {
        branding: branding ?? fallback.branding,
        team: orderBy(team).filter((x) => x.is_active),
        services: orderBy(services).filter((x) => x.is_active),
        insights: orderBy(insights).filter((x) => x.is_active),
        media: orderBy(media).filter((x) => x.is_active),
        jobs: orderBy(jobs).filter((x) => x.is_active),
      }
    } catch {
      return {
        branding: fallback.branding,
        team: [],
        services: [],
        insights: [],
        media: [],
        jobs: [],
      }
    }
  },
  async bulkDelete(table: string, ids: string[]) {
    await supabaseRest.deleteByIds(table, ids)
  },
  async bulkSetActive(table: string, ids: string[], is_active: boolean) {
    await supabaseRest.patchByIds(table, ids, { is_active })
  },
  async upsertRow(table: string, payload: Record<string, unknown>) {
    await supabaseRest.upsert(table, payload)
  },
  async submitJobApplication(payload: JobApplicationInput) {
    await supabaseRest.upsert('job_applications', {
      ...payload,
      submitted_at: new Date().toISOString(),
      status: 'new',
    })
  },
  async uploadMedia(file: File, folder?: string, onProgress?: (percent: number) => void) {
    return supabaseRest.uploadMedia(file, folder, undefined, onProgress)
  },
  async listMediaFiles() {
    try {
      const files = await supabaseRest.listMedia()
      return files.map((entry) => ({
        path: entry.name,
        publicUrl: supabaseRest.getPublicMediaUrl(entry.name),
      }))
    } catch {
      const assets = await supabaseRest.select<MediaItem>('media_items')
      return assets
        .filter((item) => item.kind === 'asset' && Boolean(item.file_url || item.value))
        .map((item) => ({
          path: item.file_path ?? item.label ?? item.id,
          publicUrl: item.file_url ?? item.value,
        }))
    }
  },
}
