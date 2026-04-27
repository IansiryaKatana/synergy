import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ComponentType,
  type FormEvent,
} from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import PhoneInputLib from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { AdminDashboard, type AdminPage } from './components/AdminDashboard'
import { TextPressureWord } from './components/TextPressureWord'
import { contentApi, type JobPost, type ServiceItem, type SiteContent, type TeamMember } from './lib/content'

type DialogMode = 'none' | 'book'
type PhoneInputProps = {
  country?: string
  value?: string
  onChange?: (value: string) => void
  inputProps?: Record<string, unknown>
  placeholder?: string
  enableSearch?: boolean
  disableSearchIcon?: boolean
  countryCodeEditable?: boolean
  containerClass?: string
  buttonClass?: string
  inputClass?: string
  dropdownClass?: string
}
const PhoneInputComponent =
  ((PhoneInputLib as unknown as { default?: ComponentType<PhoneInputProps> }).default ??
    (PhoneInputLib as unknown as ComponentType<PhoneInputProps>))

function PlusGlyph() {
  return (
    <span className="plus-glyph" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </span>
  )
}

function UpRightArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 16L16 8M10 8h6v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function normalizeExternalLink(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function sanitizeRichHtml(input?: string | null) {
  if (!input) return ''
  if (typeof window === 'undefined') return input
  const parser = new DOMParser()
  const doc = parser.parseFromString(input, 'text/html')
  doc.querySelectorAll('script,iframe,object,embed').forEach((node) => node.remove())
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const attrName = attr.name.toLowerCase()
      const attrValue = attr.value.trim().toLowerCase()
      if (attrName.startsWith('on')) el.removeAttribute(attr.name)
      if ((attrName === 'href' || attrName === 'src') && attrValue.startsWith('javascript:')) {
        el.removeAttribute(attr.name)
      }
    }
  })
  return doc.body.innerHTML
}

function stripHtml(input?: string | null) {
  if (!input) return ''
  if (typeof window === 'undefined') return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const parser = new DOMParser()
  const doc = parser.parseFromString(input, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function SocialIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase()
  if (normalized.includes('instagram') || normalized === 'ig') return <span aria-hidden="true">IG</span>
  if (normalized.includes('linkedin') || normalized === 'in') return <span aria-hidden="true">in</span>
  if (normalized.includes('facebook') || normalized === 'f' || normalized === 'fb') return <span aria-hidden="true">f</span>
  if (normalized.includes('x') || normalized.includes('twitter')) return <span aria-hidden="true">X</span>
  return <span aria-hidden="true">o</span>
}

function AboutTeamCardImage({ member }: { member: TeamMember }) {
  const avatarUrl = member.avatar_url?.trim() ?? ''
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [avatarUrl, member.id])

  if (!avatarUrl || failed) {
    return <span className="about-team-card-fallback">{member.initials}</span>
  }

  return (
    <>
      {!loaded ? <span className="about-team-card-skeleton" aria-hidden="true" /> : null}
      <img
        src={avatarUrl}
        alt={member.name}
        className={`about-team-card-image ${loaded ? 'loaded' : ''}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true)
          setLoaded(false)
        }}
      />
    </>
  )
}

function formatProjectTitle(title: string) {
  const firstLineRaw = title.includes('Hotel Apartment')
    ? title.replace('Hotel Apartment', '').trim()
    : title
  const firstLine = firstLineRaw.replace(/\s\+\s/, ' + ')
  const gPlusMatch = firstLine.match(/^G\s\+\s(\d+)$/i)
  const firstLineNode = gPlusMatch ? (
    <>
      G<sup>+</sup>{gPlusMatch[1]}
    </>
  ) : (
    firstLine
  )

  if (title.includes('Hotel Apartment')) {
    return (
      <>
        {firstLineNode}
        <br />
        Hotel Apartment
      </>
    )
  }
  return firstLineNode
}

function getStatusBadgeClass(statusText: string) {
  const clean = statusText.replace(/^Status:\s*/i, '').toLowerCase()
  if (clean.includes('completed')) return 'status-completed'
  if (clean.includes('under construction')) return 'status-under-construction'
  if (clean.includes('ongoing')) return 'status-ongoing'
  return 'status-default'
}

function resolveServiceHref(service: ServiceItem) {
  const id = service.id.toLowerCase()
  const title = service.title.toLowerCase()
  const tag = service.tag.toLowerCase()

  if (id.includes('finance') || title.includes('finance') || tag.includes('finance')) return '/services/finance'
  if (id.includes('compliance') || title.includes('compliance') || tag.includes('compliance')) return '/services/compliance'
  if (
    id.includes('project') ||
    title.includes('project management') ||
    tag.includes('project management')
  ) {
    return '/services/project-management'
  }
  if (
    id === 'service-3' ||
    id.includes('hr') ||
    title.includes('human resources') ||
    title === 'hr department' ||
    tag.includes('human resources')
  ) {
    return '/services/hr'
  }
  return '/services/project-management'
}

function resolveCurrentRoute() {
  if (typeof window === 'undefined') return '/home'
  const path = window.location.pathname.toLowerCase()
  if (path !== '/') return path
  const hash = window.location.hash.toLowerCase()
  return hash && hash !== '#' ? hash : '#home'
}

function getShowcaseRatioClass(index: number, total: number) {
  if (total === 3) {
    return index === 1 ? 'ratio-5-4' : 'ratio-3-4'
  }
  return index % 2 === 0 ? 'ratio-3-4' : 'ratio-5-4'
}

const ADMIN_USERNAME = 'Hello@iankatana.com'
const ADMIN_PASSWORD = 'B@zildog605'
const ADMIN_AUTH_STORAGE_KEY = 'synergy_backend_auth'

function NotFoundPage({ onGoHome }: { onGoHome: () => void }) {
  return (
    <main className="not-found-page">
      <section className="not-found-card">
        <p className="not-found-code">404</p>
        <h1>This page does not exist.</h1>
        <p>
          The link may be outdated or the page has moved. Use the button below to return to the Synergy homepage.
        </p>
        <button type="button" className="not-found-home-btn" onClick={onGoHome}>
          Back to homepage
        </button>
      </section>
    </main>
  )
}

function App() {
  const [dialogMode, setDialogMode] = useState<DialogMode>('none')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [heroProgress, setHeroProgress] = useState(0)
  const [thirdProgress, setThirdProgress] = useState(0)
  const [sixthProgress, setSixthProgress] = useState(0)
  const [footerProgress, setFooterProgress] = useState(0)
  const [showReturnHeader, setShowReturnHeader] = useState(false)
  const [showProjectsHeader, setShowProjectsHeader] = useState(true)
  const [showcaseIndex, setShowcaseIndex] = useState(0)
  const [servicesHubIndex, setServicesHubIndex] = useState(0)
  const [insightsIndex, setInsightsIndex] = useState(0)
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 680 : false,
  )
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [emailCopied, setEmailCopied] = useState(false)
  const [memberEmailCopied, setMemberEmailCopied] = useState(false)
  const [memberEmailLabel, setMemberEmailLabel] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const [contactSubmissionStatus, setContactSubmissionStatus] = useState('')
  const [jobApplicantName, setJobApplicantName] = useState('')
  const [jobApplicantEmail, setJobApplicantEmail] = useState('')
  const [jobApplicantPhone, setJobApplicantPhone] = useState('')
  const [jobApplicantNote, setJobApplicantNote] = useState('')
  const [jobApplicantCvFile, setJobApplicantCvFile] = useState<File | null>(null)
  const [jobApplicantCvUrl, setJobApplicantCvUrl] = useState('')
  const [isUploadingJobApplicantCv, setIsUploadingJobApplicantCv] = useState(false)
  const [jobCvUploadProgress, setJobCvUploadProgress] = useState(0)
  const [isSubmittingJobApplication, setIsSubmittingJobApplication] = useState(false)
  const [jobApplicationStatus, setJobApplicationStatus] = useState('')
  const [showCareersReturnHeader, setShowCareersReturnHeader] = useState(false)
  const [aboutServicesIndex, setAboutServicesIndex] = useState(0)
  const [aboutTeamIndex, setAboutTeamIndex] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  )
  const [activeRoute, setActiveRoute] = useState(resolveCurrentRoute)
  const [isBackendAuthenticated, setIsBackendAuthenticated] = useState(false)
  const [backendUsername, setBackendUsername] = useState('')
  const [backendPassword, setBackendPassword] = useState('')
  const [backendAuthError, setBackendAuthError] = useState('')
  const [showBackendPassword, setShowBackendPassword] = useState(false)
  const [hasLoadedContent, setHasLoadedContent] = useState(false)
  const [siteContent, setSiteContent] = useState<SiteContent>(() => ({
    ...contentApi.fallback,
    team: [],
    services: [],
    insights: [],
    media: [],
    jobs: [],
  }))
  const [emailLabel, setEmailLabel] = useState(contentApi.fallback.branding.footer_email)
  const heroSceneRef = useRef<HTMLElement | null>(null)
  const thirdSceneRef = useRef<HTMLElement | null>(null)
  const sixthSceneRef = useRef<HTMLElement | null>(null)
  const insightsSceneRef = useRef<HTMLElement | null>(null)
  const footerSceneRef = useRef<HTMLElement | null>(null)
  const showcaseTrackRef = useRef<HTMLDivElement | null>(null)
  const showcaseCardRefs = useRef<Array<HTMLElement | null>>([])
  const servicesHubTrackRef = useRef<HTMLDivElement | null>(null)
  const servicesHubCardRefs = useRef<Array<HTMLElement | null>>([])
  const careerCvInputRef = useRef<HTMLInputElement | null>(null)
  const lastScrollYRef = useRef(0)
  const careersLastScrollRef = useRef(0)
  const jobNoteEditor = useEditor({
    extensions: [StarterKit],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'career-note-editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      setJobApplicantNote(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!jobNoteEditor) return
    const currentHtml = jobNoteEditor.getHTML()
    const nextHtml = jobApplicantNote || '<p></p>'
    if (currentHtml !== nextHtml) {
      jobNoteEditor.commands.setContent(nextHtml, { emitUpdate: false })
    }
  }, [jobNoteEditor, jobApplicantNote])

  const navigateWithTransition = useCallback(
    (target: string, options?: { replace?: boolean }) => {
      if (typeof window === 'undefined') return
      const nextUrl = new URL(target, window.location.origin)
      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (currentPath === nextPath) return

      const applyNavigation = () => {
        if (options?.replace) {
          window.history.replaceState({}, '', nextPath)
        } else {
          window.history.pushState({}, '', nextPath)
        }
        setActiveRoute(resolveCurrentRoute())
        setIsMobileMenuOpen(false)

        if (nextUrl.hash) {
          const hashTarget = document.querySelector(nextUrl.hash)
          if (hashTarget instanceof HTMLElement) {
            hashTarget.scrollIntoView({ block: 'start' })
            return
          }
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      }

      const docWithViewTransition = document as Document & {
        startViewTransition?: (update: () => void) => { finished: Promise<void> }
      }
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (docWithViewTransition.startViewTransition && !prefersReducedMotion) {
        docWithViewTransition.startViewTransition(() => {
          applyNavigation()
        })
        return
      }
      applyNavigation()
    },
    [],
  )

  const heroExit = Math.max(0, Math.min(1, heroProgress / 0.45))
  const expandProgress = Math.max(0, Math.min(1, (heroProgress - 0.45) / 0.27))
  const textReveal = Math.max(0, Math.min(1, (heroProgress - 0.72) / 0.22))
  const heroFade = 1 - heroExit
  const headerSwap = Math.max(0, Math.min(1, (expandProgress - 0.78) / 0.22))
  const lineExit = Math.max(0, Math.min(1, (thirdProgress - 0.32) / 0.28))
  const fourthReveal = Math.max(0, Math.min(1, (thirdProgress - 0.56) / 0.26))
  const leftZoom = Math.max(0, Math.min(1, (thirdProgress - 0.64) / 0.14))
  const rightReveal = Math.max(0, Math.min(1, (thirdProgress - 0.8) / 0.14))
  const serviceCards = useMemo(
    () =>
      siteContent.services.map((service) => ({
        ...service,
        href: resolveServiceHref(service),
      })),
    [siteContent.services],
  )
  const aboutServiceCards = serviceCards.length > 0
    ? serviceCards
    : contentApi.fallback.services.map((service) => ({
        ...service,
        href: resolveServiceHref(service),
      }))
  const aboutVisibleCards = 1
  const aboutMaxSlideIndex = Math.max(0, aboutServiceCards.length - aboutVisibleCards)
  const aboutTeamMembers = siteContent.team.length > 0 ? siteContent.team : contentApi.fallback.team
  const aboutTeamVisibleCards = isMobileViewport ? 1 : viewportWidth >= 1440 ? 4 : viewportWidth >= 1024 ? 3 : 2
  const aboutTeamMaxSlideIndex = Math.max(0, aboutTeamMembers.length - aboutTeamVisibleCards)
  const aboutTeamVisualDotCount = 4
  const aboutTeamDotTargets = useMemo(
    () =>
      Array.from({ length: aboutTeamVisualDotCount }, (_, index) => {
        if (aboutTeamMaxSlideIndex === 0) return 0
        return Math.round((index / (aboutTeamVisualDotCount - 1)) * aboutTeamMaxSlideIndex)
      }),
    [aboutTeamMaxSlideIndex],
  )
  const aboutTeamActiveVisualDot = aboutTeamMaxSlideIndex === 0
    ? 0
    : Math.round((aboutTeamIndex / aboutTeamMaxSlideIndex) * (aboutTeamVisualDotCount - 1))
  const featuredInsights = useMemo(() => {
    const insightsWithImages = siteContent.insights.filter(
      (insight) => typeof insight.image_url === 'string' && insight.image_url.trim().length > 0,
    )
    if (insightsWithImages.length >= 3) return insightsWithImages.slice(0, 3)
    return siteContent.insights.slice(0, 3)
  }, [siteContent.insights])
  const maxInsightsCards = isMobileViewport ? 1 : viewportWidth <= 1100 ? 2 : 3
  const visibleInsights = useMemo(
    () => featuredInsights.slice(0, maxInsightsCards),
    [featuredInsights, maxInsightsCards],
  )
  const canSlideServices = isMobileViewport || serviceCards.length > 3

  useEffect(() => {
    const computeProgress = (element: HTMLElement | null) => {
      if (!element) return 0
      const rect = element.getBoundingClientRect()
      const maxTravel = Math.max(1, rect.height - window.innerHeight)
      const raw = -rect.top / maxTravel
      return Math.min(1, Math.max(0, raw))
    }

    const computeFooterProgress = (element: HTMLElement | null) => {
      if (!element) return 0
      const rect = element.getBoundingClientRect()
      const end = -rect.height * 0.45
      const raw = -rect.top / Math.abs(end)
      return Math.min(1, Math.max(0, raw))
    }

    const onScroll = () => {
      const currentScrollY = window.scrollY || 0
      const nextHeroProgress = computeProgress(heroSceneRef.current)
      const nextFooterProgress = computeFooterProgress(footerSceneRef.current)
      const scrollingUp = currentScrollY < lastScrollYRef.current - 4
      const scrollingDown = currentScrollY > lastScrollYRef.current + 4
      const isProjectsPath = window.location.pathname.toLowerCase().startsWith('/projects')
      const heroFullyPassed = nextHeroProgress > 0.98
      const returnHeaderEligible = currentScrollY > window.innerHeight + 40
      const footerActive = nextFooterProgress > 0.02

      setShowReturnHeader((previous) => {
        if (!heroFullyPassed || !returnHeaderEligible || footerActive) return false
        if (scrollingUp) return true
        if (scrollingDown) return false
        return previous
      })

      setShowProjectsHeader((previous) => {
        if (!isProjectsPath) return true
        if (isMobileMenuOpen || currentScrollY <= 12) return true
        if (scrollingUp) return true
        if (scrollingDown) return false
        return previous
      })
      lastScrollYRef.current = currentScrollY

      setHeroProgress(nextHeroProgress)
      setThirdProgress(computeProgress(thirdSceneRef.current))
      setSixthProgress(computeProgress(sixthSceneRef.current))
      setFooterProgress(nextFooterProgress)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const onLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const link = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!link) return
      if (link.target && link.target !== '_self') return
      if (link.hasAttribute('download')) return

      const href = link.getAttribute('href')
      if (!href || (!href.startsWith('/') && !href.startsWith('#'))) return

      event.preventDefault()
      navigateWithTransition(href)
    }

    document.addEventListener('click', onLinkClick)
    return () => document.removeEventListener('click', onLinkClick)
  }, [navigateWithTransition])

  useEffect(() => {
    setShowcaseIndex((previous) => {
      if (serviceCards.length === 0) return 0
      return Math.min(previous, serviceCards.length - 1)
    })
  }, [serviceCards.length])

  useEffect(() => {
    setInsightsIndex((previous) => {
      if (visibleInsights.length === 0) return 0
      return Math.min(previous, visibleInsights.length - 1)
    })
  }, [visibleInsights.length])

  useEffect(() => {
    setAboutServicesIndex((previous) => {
      if (aboutServiceCards.length === 0) return 0
      return Math.min(previous, aboutMaxSlideIndex)
    })
  }, [aboutMaxSlideIndex, aboutServiceCards.length])

  useEffect(() => {
    setAboutTeamIndex((previous) => {
      if (aboutTeamMembers.length === 0) return 0
      return Math.min(previous, aboutTeamMaxSlideIndex)
    })
  }, [aboutTeamMaxSlideIndex, aboutTeamMembers.length])

  useEffect(() => {
    const onResize = () => {
      setIsMobileViewport(window.innerWidth <= 680)
      setViewportWidth(window.innerWidth)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const track = showcaseTrackRef.current
    const card = showcaseCardRefs.current[showcaseIndex]
    if (!track) return
    if (!canSlideServices) {
      track.scrollTo({ left: 0, behavior: 'smooth' })
      return
    }
    if (!card) return
    const left = Math.max(0, card.offsetLeft)
    track.scrollTo({ left, behavior: 'smooth' })
  }, [showcaseIndex, canSlideServices])

  useEffect(() => {
    if (!canSlideServices && showcaseIndex !== 0) {
      setShowcaseIndex(0)
    }
  }, [canSlideServices, showcaseIndex])

  const heroVars = {
    '--hero-progress': heroProgress,
    '--hero-fade': heroFade,
    '--expand-progress': expandProgress,
    '--text-reveal': textReveal,
  } as CSSProperties

  const headerBlendVars = {
    '--header-swap': headerSwap,
  } as CSSProperties

  const thirdVars = {
    '--line-exit': lineExit,
    '--fourth-reveal': fourthReveal,
    '--left-zoom': leftZoom,
    '--right-reveal': rightReveal,
  } as CSSProperties

  const sixthVars = {
    '--sixth-progress': sixthProgress,
  } as CSSProperties

  const footerVars = {
    '--footer-progress': footerProgress,
  } as CSSProperties

  const loadContent = async () => {
    try {
      const next = await contentApi.getSiteContent()
      setSiteContent(next)
      setEmailLabel(next.branding.footer_email)
    } finally {
      setHasLoadedContent(true)
    }
  }

  useEffect(() => {
    void loadContent()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsBackendAuthenticated(window.sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === '1')
  }, [])

  useEffect(() => {
    const faviconUrl = siteContent.branding.favicon_url
    if (!faviconUrl) return
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = faviconUrl
  }, [siteContent.branding.favicon_url])

  useEffect(() => {
    const syncRoute = () => {
      setActiveRoute(resolveCurrentRoute())
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
    syncRoute()
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const pathname = window.location.pathname.toLowerCase()
    if (!pathname.startsWith('/admin')) return
    window.history.replaceState({}, '', '/')
    setActiveRoute(resolveCurrentRoute())
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [activeRoute])

  useEffect(() => {
    if (!selectedMember) {
      setMemberEmailCopied(false)
      setMemberEmailLabel('')
      return
    }
    setMemberEmailCopied(false)
    setMemberEmailLabel(selectedMember.email)
  }, [selectedMember])

  useEffect(() => {
    setJobApplicationStatus('')
    setJobApplicantName('')
    setJobApplicantEmail('')
    setJobApplicantPhone('')
    setJobApplicantNote('')
    setJobApplicantCvFile(null)
  }, [activeRoute])

  const isBackendPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/backend')
  const adminPage: AdminPage = (() => {
    if (typeof window === 'undefined') return 'dashboard'
    const part = window.location.pathname.replace(/^\/backend\/?/, '').split('/')[0]
    if (!part) return 'dashboard'
    if (part === 'branding' || part === 'smtp' || part === 'team' || part === 'services' || part === 'insights' || part === 'media' || part === 'careers') return part
    return 'dashboard'
  })()
  const homepageTeam = siteContent.team.slice(0, 6)
  const teamCols = [
    homepageTeam.slice(0, 3),
    homepageTeam.slice(3, 6),
  ]

  const submitBackendLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (backendUsername === ADMIN_USERNAME && backendPassword === ADMIN_PASSWORD) {
      setIsBackendAuthenticated(true)
      setBackendAuthError('')
      setBackendPassword('')
      if (typeof window !== 'undefined') window.sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, '1')
      return
    }
    setBackendAuthError('Invalid credentials. Please use the provided admin username and password.')
  }

  if (isBackendPath) {
    if (!isBackendAuthenticated) {
      return (
        <main className="backend-login-page">
          <section className="backend-login-card">
            <p className="backend-login-kicker">Backend access</p>
            <h1>Admin login</h1>
            <p>Sign in with your admin username and password to access the backend.</p>
            <form className="backend-login-form" onSubmit={submitBackendLogin}>
              <label>
                Username
                <input
                  type="email"
                  value={backendUsername}
                  onChange={(event) => {
                    setBackendUsername(event.target.value)
                    if (backendAuthError) setBackendAuthError('')
                  }}
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type={showBackendPassword ? 'text' : 'password'}
                  value={backendPassword}
                  onChange={(event) => {
                    setBackendPassword(event.target.value)
                    if (backendAuthError) setBackendAuthError('')
                  }}
                  autoComplete="current-password"
                  required
                />
              </label>
              <label className="backend-login-toggle">
                <input
                  type="checkbox"
                  checked={showBackendPassword}
                  onChange={(event) => setShowBackendPassword(event.target.checked)}
                />
                Show password
              </label>
              {backendAuthError ? <p className="backend-login-error">{backendAuthError}</p> : null}
              <button type="submit" className="backend-login-submit">Login</button>
            </form>
          </section>
        </main>
      )
    }
    return (
      <AdminDashboard
        page={adminPage}
        branding={siteContent.branding}
        team={siteContent.team}
        services={siteContent.services}
        insights={siteContent.insights}
        media={siteContent.media}
        jobs={siteContent.jobs}
        onRefresh={loadContent}
      />
    )
  }

  const copyFooterEmail = async () => {
    const email = siteContent.branding.footer_email
    try {
      await navigator.clipboard.writeText(email)
      setEmailCopied(true)
      const copiedWord = 'Copied'
      setEmailLabel('')
      copiedWord.split('').forEach((char, index) => {
        window.setTimeout(() => {
          setEmailLabel((prev) => prev + char)
        }, index * 70)
      })
      window.setTimeout(() => {
        setEmailCopied(false)
        setEmailLabel(email)
      }, 1450)
    } catch {
      setEmailCopied(false)
      setEmailLabel(email)
    }
  }

  const copyMemberEmail = async () => {
    if (!selectedMember) return
    const email = selectedMember.email
    try {
      await navigator.clipboard.writeText(email)
      setMemberEmailCopied(true)
      const copiedWord = 'Copied'
      setMemberEmailLabel('')
      copiedWord.split('').forEach((char, index) => {
        window.setTimeout(() => {
          setMemberEmailLabel((prev) => prev + char)
        }, index * 70)
      })
      window.setTimeout(() => {
        setMemberEmailCopied(false)
        setMemberEmailLabel(email)
      }, 1450)
    } catch {
      setMemberEmailCopied(false)
      setMemberEmailLabel(email)
    }
  }

  const navClass = (route: string) => (activeRoute === route ? 'active' : '')
  const normalizedActiveRoute = activeRoute.toLowerCase()
  const activePathname = normalizedActiveRoute.startsWith('/') ? normalizedActiveRoute : '/'
  const isHomeRoute = activePathname === '/' || activePathname === '/index.html'
  const isServicesRoute = activePathname.startsWith('/services')
  const isProjectsRoute = activePathname === '/projects' || activePathname.startsWith('/projects/')
  const isAboutRoute = activePathname === '/about-us' || activePathname.startsWith('/about-us/')
  const isCareersRoute =
    activePathname === '/careers' ||
    activePathname.startsWith('/careers/') ||
    activePathname === '/career' ||
    activePathname.startsWith('/career/')
  const isContactRoute = activePathname === '/contact-us' || activePathname.startsWith('/contact-us/')
  const serviceNavClass = () => (isServicesRoute ? 'active' : '')
  const projectNavClass = () => (isProjectsRoute ? 'active' : '')
  const aboutNavClass = () => (isAboutRoute ? 'active' : '')
  const careersNavClass = () => (isCareersRoute ? 'active' : '')
  const contactNavClass = () => (isContactRoute ? 'active' : '')
  const [careersDepartment, setCareersDepartment] = useState('View all')
  const visibleJobs = useMemo(() => {
    const jobs = siteContent.jobs
    if (careersDepartment === 'View all') return jobs
    return jobs.filter((job) => job.department === careersDepartment)
  }, [careersDepartment, siteContent.jobs])
  const careerDepartments = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(siteContent.jobs.map((job) => job.department).filter(Boolean)))
    return ['View all', ...uniqueDepartments]
  }, [siteContent.jobs])
  const selectedCareerId = useMemo(() => {
    if (!isCareersRoute) return ''
    const pathWithoutQuery = activePathname.split('?')[0]
    const normalizedCareerPath = pathWithoutQuery.replace(/^\/careers?\/?/i, '')
    const [firstSegment = ''] = normalizedCareerPath.split('/').filter(Boolean)
    return firstSegment
  }, [activePathname, isCareersRoute])
  const selectedCareerJob = useMemo(
    () => siteContent.jobs.find((job) => job.id.toLowerCase() === selectedCareerId.toLowerCase()) ?? null,
    [selectedCareerId, siteContent.jobs],
  )
  const isCareerDetailRoute = isCareersRoute && selectedCareerId.length > 0
  const homepageHeroVideoSrc = siteContent.branding.homepage_hero_video_url?.trim() ?? ''
  const homepageHeroMediaStyle = homepageHeroVideoSrc
    ? ({
        background:
          'linear-gradient(to top, rgba(6, 14, 24, 0.36) 0%, rgba(6, 14, 24, 0.14) 55%, rgba(6, 14, 24, 0.04) 100%)',
      } as CSSProperties)
    : undefined
  const aboutHeroMediaStyle = siteContent.branding.about_hero_background_url
    ? ({
        backgroundImage:
          `linear-gradient(to top, rgba(6, 14, 24, 0.36) 0%, rgba(6, 14, 24, 0.14) 55%, rgba(6, 14, 24, 0.04) 100%), ` +
          `url("${siteContent.branding.about_hero_background_url}")`,
        backgroundSize: 'auto, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      } as CSSProperties)
    : undefined
  const contactHeroMediaStyle = siteContent.branding.contact_hero_background_url
    ? ({
        backgroundImage:
          `linear-gradient(to top, rgba(6, 14, 24, 0.36) 0%, rgba(6, 14, 24, 0.14) 55%, rgba(6, 14, 24, 0.04) 100%), ` +
          `url("${siteContent.branding.contact_hero_background_url}")`,
        backgroundSize: 'auto, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      } as CSSProperties)
    : undefined
  const teamSectionStyle = siteContent.branding.homepage_team_background_url
    ? ({
        backgroundImage:
          `linear-gradient(to top, rgba(8, 39, 74, 0.42) 0%, rgba(8, 39, 74, 0.16) 58%), ` +
          `url("${siteContent.branding.homepage_team_background_url}")`,
        backgroundSize: 'auto, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      } as CSSProperties)
    : undefined
  const socialMediaItems = useMemo(
    () =>
      siteContent.media
        .filter((item) => item.kind === 'social')
        .map((item) => {
          const candidate = item.link_url || item.value
          const href = normalizeExternalLink(candidate)
          return {
            id: item.id,
            label: item.label || item.value || 'Social',
            href,
          }
        })
        .filter((item) => item.href.length > 0),
    [siteContent.media],
  )
  const mobileConnectSection = (
    <div className="mobile-menu-social-bubble">
      <p>Connect with us</p>
      <div className="mobile-menu-social-icons">
        {socialMediaItems.map((item) => (
          <a key={`mobile-social-${item.id}`} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
            <SocialIcon name={item.label} />
          </a>
        ))}
      </div>
    </div>
  )
  useEffect(() => {
    if (!isCareersRoute) {
      setShowCareersReturnHeader(false)
      return
    }
    const onCareersScroll = () => {
      const currentScrollY = window.scrollY || 0
      const scrollingUp = currentScrollY < careersLastScrollRef.current - 4
      const scrollingDown = currentScrollY > careersLastScrollRef.current + 4
      setShowCareersReturnHeader((previous) => {
        if (currentScrollY <= 24) return false
        if (scrollingUp) return true
        if (scrollingDown) return false
        return previous
      })
      careersLastScrollRef.current = currentScrollY
    }
    onCareersScroll()
    window.addEventListener('scroll', onCareersScroll, { passive: true })
    window.addEventListener('resize', onCareersScroll)
    return () => {
      window.removeEventListener('scroll', onCareersScroll)
      window.removeEventListener('resize', onCareersScroll)
    }
  }, [isCareersRoute])
  const navigateToContact = () => {
    navigateWithTransition('/contact-us')
    setIsMobileMenuOpen(false)
  }
  const uploadJobApplicantCv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setJobApplicantCvFile(file)
    setJobApplicantCvUrl('')
    setJobCvUploadProgress(0)
    if (!file) return

    const maxCvFileSizeBytes = 10 * 1024 * 1024
    const allowedCvFormats = ['pdf', 'doc', 'docx']
    const selectedCvExt = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!allowedCvFormats.includes(selectedCvExt)) {
      setJobApplicantCvFile(null)
      setJobApplicationStatus('Please upload a CV in PDF, DOC, or DOCX format.')
      return
    }
    if (file.size > maxCvFileSizeBytes) {
      setJobApplicantCvFile(null)
      setJobApplicationStatus('CV file size must be 10MB or less.')
      return
    }

    setJobApplicationStatus('')
    setIsUploadingJobApplicantCv(true)
    try {
      const uploadedCv = await contentApi.uploadMedia(file, 'career-cv', (percent) => {
        setJobCvUploadProgress(percent)
      })
      setJobApplicantCvUrl(uploadedCv.publicUrl)
      setJobCvUploadProgress(100)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CV upload failed.'
      setJobApplicationStatus(message)
      setJobApplicantCvUrl('')
      setJobCvUploadProgress(0)
    } finally {
      setIsUploadingJobApplicantCv(false)
    }
  }

  const submitJobApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedCareerJob) return
    const coverNoteHtml = sanitizeRichHtml(jobApplicantNote).trim()
    const coverNoteText = stripHtml(coverNoteHtml)
    if (!coverNoteText) {
      setJobApplicationStatus('Please add a short note about why you are a great fit.')
      return
    }
    if (!jobApplicantCvFile) {
      setJobApplicationStatus('Please upload your CV before submitting.')
      return
    }
    if (isUploadingJobApplicantCv) {
      setJobApplicationStatus('CV upload is in progress. Please wait for it to finish.')
      return
    }
    if (!jobApplicantCvUrl) {
      setJobApplicationStatus('CV upload failed or is missing. Please re-upload your CV.')
      return
    }
    setIsSubmittingJobApplication(true)
    setJobApplicationStatus('')
    try {
      await contentApi.submitJobApplication({
        job_id: selectedCareerJob.id,
        job_title: selectedCareerJob.title,
        job_department: selectedCareerJob.department,
        notification_email: selectedCareerJob.notification_email ?? undefined,
        full_name: jobApplicantName.trim(),
        email: jobApplicantEmail.trim(),
        phone: jobApplicantPhone.trim(),
        cover_note: coverNoteHtml,
        cv_url: jobApplicantCvUrl,
      })
      setJobApplicationStatus('Application sent successfully. Our team will contact you shortly.')
      setJobApplicantName('')
      setJobApplicantEmail('')
      setJobApplicantPhone('')
      setJobApplicantNote('')
      setJobApplicantCvFile(null)
      setJobApplicantCvUrl('')
      setJobCvUploadProgress(0)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit application.'
      setJobApplicationStatus(message)
    } finally {
      setIsSubmittingJobApplication(false)
    }
  }
  const submitContactInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fullName = contactName.trim()
    const email = contactEmail.trim()
    const phone = contactPhone.trim()
    const message = contactMessage.trim()
    if (!fullName || !email || !phone || !message) {
      setContactSubmissionStatus('Please complete all contact fields before submitting.')
      return
    }
    setIsSubmittingContact(true)
    setContactSubmissionStatus('')
    try {
      await contentApi.submitContactInquiry({
        full_name: fullName,
        email,
        phone,
        message,
      })
      setContactSubmissionStatus('Message sent successfully. We will contact you shortly.')
      setContactName('')
      setContactEmail('')
      setContactPhone('')
      setContactMessage('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send contact message.'
      setContactSubmissionStatus(message)
    } finally {
      setIsSubmittingContact(false)
    }
  }
  const activeServiceCard =
    serviceCards.find((service) => service.href.toLowerCase() === activePathname) ?? null

  useEffect(() => {
    if (!isServicesRoute || serviceCards.length === 0) return
    const activeIndex = serviceCards.findIndex((service) => service.href.toLowerCase() === activePathname)
    if (activeIndex >= 0) setServicesHubIndex(activeIndex)
  }, [activePathname, isServicesRoute, serviceCards])

  useEffect(() => {
    if (serviceCards.length === 0) return
    setServicesHubIndex((current) => Math.max(0, Math.min(current, serviceCards.length - 1)))
  }, [serviceCards.length])

  useEffect(() => {
    if (!isServicesRoute) return
    const track = servicesHubTrackRef.current
    const card = servicesHubCardRefs.current[servicesHubIndex]
    if (!track || !card) return
    const targetLeft = Math.max(0, card.offsetLeft - 12)
    track.scrollTo({ left: targetLeft, behavior: 'smooth' })
  }, [isServicesRoute, servicesHubIndex])

  useEffect(() => {
    if (activePathname === '/services' || activePathname === '/services/' || activePathname === '/services/general') {
      navigateWithTransition('/services/project-management', { replace: true })
    }
  }, [activePathname, navigateWithTransition])

  if (isServicesRoute && !activeServiceCard && !hasLoadedContent) {
    return <main className="services-page-shell" />
  }
  const sharedFooterSection = (
    <section ref={footerSceneRef} className="footer-scene" style={footerVars}>
      <div className="footer-sticky">
        <div className="footer-bg-expand" aria-hidden="true" />
        <footer className="site-footer-panel">
          <div className="footer-top">
            <div className="footer-left">
              <p className="footer-brand">
                <picture>
                  <source media="(max-width: 920px)" srcSet={siteContent.branding.favicon_url || '/SYNERGY logo.png'} />
                  <img src="/syngergy-logo.png" alt={siteContent.branding.company_name} className="footer-brand-logo" />
                </picture>
              </p>
              <p className="footer-address">Onyx Tower 1, The Greens{'\n'}Dubai, United Arab Emirates</p>
              <h2 className="footer-newsletter-heading">
                <span className="footer-newsletter-primary">Subscribe</span>
                <span className="footer-newsletter-secondary">to our newsletter.</span>
              </h2>
              <form className="footer-subscribe">
                <input type="email" placeholder="Email" />
                <button type="button">
                  <span className="footer-subscribe-label-desktop">Subscribe</span>
                  <span className="footer-subscribe-label-mobile">Subscribe Now</span>
                  <span className="call-btn-icon" aria-hidden="true">
                    <UpRightArrowIcon />
                  </span>
                </button>
              </form>
            </div>
            <div className="footer-right">
              <h3>
                Delivering precision-built projects, driven by expertise, innovation, and uncompromising commitment to quality excellence.
              </h3>
              <button
                type="button"
                className={`footer-email-row ${emailCopied ? 'copied' : ''}`}
                onClick={copyFooterEmail}
                aria-label="Copy email address"
                title={emailCopied ? 'Copied' : 'Copy email'}
              >
                <span className="copy-email-icon" aria-hidden="true">
                  <span className="copy-icon" />
                </span>
                <p className="footer-email">{emailLabel}</p>
              </button>
              <div className="footer-meta-links">
                <div>
                  <p>Socials</p>
                  <div className="footer-socials">
                    {socialMediaItems.map((item) => (
                      <a key={`footer-social-${item.id}`} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
                        <SocialIcon name={item.label} />
                      </a>
                    ))}
                  </div>
                </div>
                <div>
                  <p>Legal</p>
                  <div className="footer-legal">
                    <a href="#privacy">Privacy Policy</a>
                    <a href="#terms">Terms of Service</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="footer-wordmark"><TextPressureWord text={siteContent.branding.footer_wordmark} /></p>
        </footer>
      </div>
    </section>
  )

  if (isProjectsRoute) {
    return (
      <>
        <main className="projects-page-shell">
          <section className="projects-page-hero">
            <header className={`top-nav service-page-header projects-page-header ${showProjectsHeader ? '' : 'scroll-hidden'}`}>
              <div className="nav-bubble">
                <a className="brand" href="/">
                  <img src="/SYNERGY logo.png" alt={siteContent.branding.company_name} className="brand-wordmark-image" />
                </a>
                <nav className="menu">
                  <a href="/" className={navClass('#home')}>Home</a>
                  <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                  <a href="/projects" className={projectNavClass()}>Projects</a>
                  <a href="/about-us" className={aboutNavClass()}>About us</a>
                  <a href="/careers" className={careersNavClass()}>Careers</a>
                  <a href="/contact-us" className={contactNavClass()}>Contact us</a>
                </nav>
                <button
                  className="menu-toggle"
                  onClick={() => setIsMobileMenuOpen((open) => !open)}
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-nav-drawer"
                >
                  {isMobileMenuOpen ? 'Close' : 'Menu'}
                </button>
              </div>
              <a
                className="call-btn service-back-btn"
                href="/contact-us"
                onClick={(event) => {
                  event.preventDefault()
                  navigateToContact()
                }}
              >
                Get in touch
                <span className="call-btn-icon" aria-hidden="true">
                  <UpRightArrowIcon />
                </span>
              </a>
            </header>
            <div
              className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden={!isMobileMenuOpen}
            />
            <aside
              id="mobile-nav-drawer"
              className={`mobile-menu-drawer services-mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
              aria-hidden={!isMobileMenuOpen}
            >
              <div className="mobile-menu-header">
                <p className="mobile-menu-title">Menu</p>
                <button
                  type="button"
                  className="mobile-menu-close"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>
              <nav className="mobile-menu-links">
                <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </a>
                <a
                  href="/services/project-management"
                  className={serviceNavClass()}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Services
                </a>
                <a href="/projects" className={projectNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  Projects
                </a>
                <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  About us
                </a>
                <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  Careers
                </a>
                <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  Contact us
                </a>
              </nav>
              {mobileConnectSection}
              <button
                className="mobile-menu-call"
                onClick={() => {
                  navigateToContact()
                }}
              >
                Get in touch
              </button>
            </aside>
          </section>
          <div className="projects-page-content">
            <section className="insights-scene projects-page-section">
              <div className="insights-sticky">
                <div className="insights-inner">
                <aside className="insights-lead">
                  <div className="insights-title-row">
                    <h2>{siteContent.branding.insights_title}</h2>
                    <div className="section-nav-arrows" aria-label="Projects navigation">
                      <button
                        type="button"
                        className="section-nav-arrow"
                        onClick={() => setInsightsIndex((index) => Math.max(0, index - 1))}
                        disabled={insightsIndex <= 0}
                        aria-label="Previous project card"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M15 6l-6 6 6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="section-nav-arrow"
                        onClick={() => setInsightsIndex((index) => Math.min(visibleInsights.length - 1, index + 1))}
                        disabled={insightsIndex >= visibleInsights.length - 1}
                        aria-label="Next project card"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p>{siteContent.branding.insights_description}</p>
                  <button
                    className="insights-view-all"
                    onClick={() => {
                      navigateToContact()
                    }}
                  >
                    Lets Partner on a Project
                    <span className="cta-arrow-icon" aria-hidden="true">
                      <UpRightArrowIcon />
                    </span>
                  </button>
                </aside>

                <div className="insights-cards-viewport">
                  <div
                    className="insights-cards-track"
                    style={isMobileViewport ? { transform: `translateX(-${insightsIndex * 100}%)` } : undefined}
                  >
                  {visibleInsights.map((insight) => (
                  <article
                    className={`insight-card ${insight.alt_style ? 'insight-card-alt' : ''} ${
                      insight.image_url ? 'has-image' : ''
                    }`}
                    style={
                      insight.image_url
                        ? ({ '--insight-image-url': `url("${insight.image_url}")` } as CSSProperties)
                        : undefined
                    }
                    key={`project-page-${insight.id}`}
                  >
                    <p className={`insight-chip ${getStatusBadgeClass(insight.chip)}`}>
                      {insight.chip.replace(/^Status:\s*/i, '')}
                    </p>
                    <p className="insight-date insight-location-badge">
                      {insight.date_label.replace(/^Location:\s*/i, '')}
                    </p>
                    <h3>{formatProjectTitle(insight.title)}</h3>
                  </article>
                  ))}
                  </div>
                </div>
              </div>
              </div>
            </section>
          </div>
        </main>
        {sharedFooterSection}
      </>
    )
  }

  if (isAboutRoute) {
    return (
      <main className="about-page-shell">
        <section className="about-page-hero">
          <div className="about-page-hero-visual-frame" aria-hidden="true">
            <div className="about-page-hero-media" style={aboutHeroMediaStyle} />
          </div>
          <header className="top-nav about-page-header">
            <div className="nav-bubble">
              <a className="brand" href="/">
                <img
                  src="/syngergy-logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image about-brand-desktop"
                />
                <img
                  src="/SYNERGY logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image about-brand-mobile"
                />
              </a>
              <nav className="menu">
                <a href="/" className={navClass('#home')}>Home</a>
                <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                <a href="/projects" className={projectNavClass()}>Projects</a>
                <a href="/about-us" className={aboutNavClass()}>About us</a>
                <a href="/careers" className={careersNavClass()}>Careers</a>
                <a href="/contact-us" className={contactNavClass()}>Contact us</a>
              </nav>
              <button
                className="menu-toggle"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-drawer"
              >
                {isMobileMenuOpen ? 'Close' : 'Menu'}
              </button>
            </div>
            <button className="call-btn" onClick={navigateToContact}>
              Get in touch
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </header>
          <div
            className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden={!isMobileMenuOpen}
          />
          <aside
            id="mobile-nav-drawer"
            className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
            aria-hidden={!isMobileMenuOpen}
          >
            <div className="mobile-menu-header">
              <p className="mobile-menu-title">Menu</p>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <nav className="mobile-menu-links">
              <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </a>
              <a
                href="/services/project-management"
                className={serviceNavClass()}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </a>
              <a href="/projects" className={projectNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Projects
              </a>
              <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                About us
              </a>
              <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Careers
              </a>
              <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Contact us
              </a>
            </nav>
            {mobileConnectSection}
            <button
              className="mobile-menu-call"
              onClick={() => {
                navigateToContact()
              }}
            >
              Get in touch
            </button>
          </aside>
          <div className="about-page-hero-content">
            <p className="eyebrow">{siteContent.branding.hero_eyebrow}</p>
            <h1>Experience That Builds Outcomes.</h1>
            <p className="subtitle">
              {siteContent.branding.hero_subtitle}
            </p>
          </div>
        </section>
        <section className="about-services-section" aria-label="About page services">
          <header className="about-services-header">
            <h2>{siteContent.branding.services_title}</h2>
            <div className="about-services-nav-arrows" aria-label="About services navigation">
              <button
                type="button"
                className="about-services-nav-arrow"
                onClick={() => setAboutServicesIndex((index) => Math.max(0, index - 1))}
                disabled={aboutServicesIndex <= 0}
                aria-label="Previous services slide"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                className="about-services-nav-arrow"
                onClick={() => setAboutServicesIndex((index) => Math.min(aboutMaxSlideIndex, index + 1))}
                disabled={aboutServicesIndex >= aboutMaxSlideIndex}
                aria-label="Next services slide"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </header>
          <div className="about-services-cards-viewport">
            <div
              className="about-services-cards-track"
              style={
                {
                  '--about-slide-offset': aboutServicesIndex,
                  '--about-visible-cards': aboutVisibleCards,
                } as CSSProperties
              }
            >
              {aboutServiceCards.map((card) => (
                <article className="about-service-card" key={card.id}>
                  <div
                    className="about-service-card-media"
                    style={
                      card.image_url
                        ? ({
                            backgroundImage: `linear-gradient(180deg, rgba(7, 16, 27, 0.08), rgba(7, 16, 27, 0.8)), url("${card.image_url}")`,
                            backgroundSize: 'auto, cover',
                            backgroundPosition: 'center, center',
                            backgroundRepeat: 'no-repeat, no-repeat',
                          } as CSSProperties)
                        : undefined
                    }
                    aria-hidden="true"
                  />
                  <div className="about-service-card-content">
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="services-showcase-dots" role="tablist" aria-label="About services navigation">
            {Array.from({ length: aboutMaxSlideIndex + 1 }).map((_, index) => (
              <button
                key={`about-service-dot-${index}`}
                type="button"
                className={`services-showcase-dot ${aboutServicesIndex === index ? 'active' : ''}`}
                onClick={() => setAboutServicesIndex(index)}
                aria-label={`Show services slide ${index + 1}`}
                aria-selected={aboutServicesIndex === index}
              />
            ))}
          </div>
        </section>
        <section className="about-team-section" aria-label="Our team">
          <header className="about-team-header">
            <div className="about-team-heading-row">
              <div className="about-team-heading-left">
                <h2>Our team</h2>
              </div>
              <div className="about-team-nav-arrows" aria-label="Team navigation">
                <button
                  type="button"
                  className="about-team-nav-arrow"
                  onClick={() => setAboutTeamIndex((index) => Math.max(0, index - 1))}
                  disabled={aboutTeamIndex <= 0}
                  aria-label="Previous team slide"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="about-team-nav-arrow"
                  onClick={() => setAboutTeamIndex((index) => Math.min(aboutTeamMaxSlideIndex, index + 1))}
                  disabled={aboutTeamIndex >= aboutTeamMaxSlideIndex}
                  aria-label="Next team slide"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
            <p>
              We combine leadership, coordination, and specialist expertise to keep every program aligned, proactive,
              and consistently delivered to the highest standard.
            </p>
          </header>
          <div className="about-team-cards-viewport">
            <div
              className="about-team-cards-track"
              style={
                {
                  '--about-team-slide-offset': aboutTeamIndex,
                  '--about-team-visible-cards': aboutTeamVisibleCards,
                } as CSSProperties
              }
            >
              {aboutTeamMembers.map((member) => (
                <article
                  className="about-team-card"
                  key={member.id}
                >
                  <div className="about-team-card-media">
                    <AboutTeamCardImage member={member} />
                  </div>
                  <div className="about-team-card-meta">
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="about-team-dots" role="tablist" aria-label="Our team navigation">
            {aboutTeamDotTargets.map((targetIndex, index) => (
              <button
                key={`about-team-dot-${index}`}
                type="button"
                className={`about-team-dot ${aboutTeamActiveVisualDot === index ? 'active' : ''}`}
                onClick={() => setAboutTeamIndex(targetIndex)}
                aria-label={`Show team slide ${index + 1}`}
                aria-selected={aboutTeamActiveVisualDot === index}
              />
            ))}
          </div>
        </section>
      </main>
    )
  }

  if (isContactRoute) {
    return (
      <main className="contact-page-shell">
        <section className="contact-page-hero">
          <div className="contact-page-hero-visual-frame" aria-hidden="true">
            <div className="contact-page-hero-media" style={contactHeroMediaStyle} />
          </div>
          <header className="top-nav contact-page-header">
            <div className="nav-bubble">
              <a className="brand" href="/">
                <img
                  src="/syngergy-logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image contact-brand-desktop"
                />
                <img
                  src="/SYNERGY logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image contact-brand-mobile"
                />
              </a>
              <nav className="menu">
                <a href="/" className={navClass('#home')}>Home</a>
                <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                <a href="/projects" className={projectNavClass()}>Projects</a>
                <a href="/about-us" className={aboutNavClass()}>About us</a>
                <a href="/careers" className={careersNavClass()}>Careers</a>
                <a href="/contact-us" className={contactNavClass()}>Contact us</a>
              </nav>
              <button
                className="menu-toggle"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-drawer"
              >
                {isMobileMenuOpen ? 'Close' : 'Menu'}
              </button>
            </div>
            <button className="call-btn" onClick={navigateToContact}>
              Get in touch
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </header>
          <div
            className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden={!isMobileMenuOpen}
          />
          <aside
            id="mobile-nav-drawer"
            className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
            aria-hidden={!isMobileMenuOpen}
          >
            <div className="mobile-menu-header">
              <p className="mobile-menu-title">Menu</p>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <nav className="mobile-menu-links">
              <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </a>
              <a
                href="/services/project-management"
                className={serviceNavClass()}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </a>
              <a href="/projects" className={projectNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Projects
              </a>
              <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                About us
              </a>
              <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Careers
              </a>
              <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                Contact us
              </a>
            </nav>
            {mobileConnectSection}
            <button className="mobile-menu-call" onClick={navigateToContact}>
              Get in touch
            </button>
          </aside>
          <div className="contact-page-hero-content">
            <div className="contact-page-hero-main">
              <p className="eyebrow">{siteContent.branding.hero_eyebrow}</p>
              <h1>{siteContent.branding.hero_title}</h1>
              <p className="subtitle">
                {siteContent.branding.hero_subtitle}
              </p>
              <div className="cta-row">
                <a className="primary contact-hero-primary" href="/about-us">
                  Learn More
                  <span className="call-btn-icon" aria-hidden="true">
                    <UpRightArrowIcon />
                  </span>
                </a>
              </div>
            </div>
            <aside className="contact-page-phone-panel" aria-label="Contact phone">
              <form
                className="contact-page-form"
                onSubmit={submitContactInquiry}
              >
                <input
                  type="text"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Your Name"
                  required
                />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="Your email Address"
                  required
                />
                <PhoneInputComponent
                  country="ae"
                  value={contactPhone}
                  onChange={(value) => setContactPhone(value)}
                  inputProps={{
                    required: true,
                    name: 'phone',
                  }}
                  placeholder="Your Phone Number"
                  enableSearch
                  disableSearchIcon
                  countryCodeEditable={false}
                  containerClass="contact-phone-input-container"
                  buttonClass="contact-phone-input-button"
                  inputClass="contact-phone-input-field"
                  dropdownClass="contact-phone-input-dropdown"
                />
                <textarea
                  value={contactMessage}
                  onChange={(event) => setContactMessage(event.target.value)}
                  placeholder="Your Message"
                  rows={6}
                  required
                />
                <button type="submit" className="contact-page-form-submit" disabled={isSubmittingContact}>
                  <span>{isSubmittingContact ? 'Sending...' : 'Send message'}</span>
                  <span className="call-btn-icon" aria-hidden="true">
                    <UpRightArrowIcon />
                  </span>
                </button>
                {contactSubmissionStatus ? <p className="career-apply-status">{contactSubmissionStatus}</p> : null}
              </form>
            </aside>
          </div>
        </section>
      </main>
    )
  }

  if (isCareersRoute) {
    const careersHeroJobs = visibleJobs.length > 0 ? visibleJobs : siteContent.jobs
    return (
      <main className="careers-page-shell">
        <header className={`top-nav top-nav-global return-visible returning-header careers-return-header ${showCareersReturnHeader ? '' : 'scroll-hidden'}`}>
          <div className="nav-bubble">
            <a className="brand" href="/">
              <img src="/SYNERGY logo.png" alt="Synergy Project Management" className="brand-wordmark-image" />
            </a>
            <nav className="menu">
              <a href="/" className={navClass('#home')}>Home</a>
              <a href="/services/project-management" className={serviceNavClass()}>Services</a>
              <a href="/projects" className={projectNavClass()}>Projects</a>
              <a href="/about-us" className={aboutNavClass()}>About us</a>
              <a href="/careers" className={careersNavClass()}>Careers</a>
              <a href="/contact-us" className={contactNavClass()}>Contact us</a>
            </nav>
            <button
              className="menu-toggle"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {isMobileMenuOpen ? 'Close' : 'Menu'}
            </button>
            <button className="call-btn" onClick={navigateToContact}>
              Get in touch
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </div>
        </header>
        <section className="careers-page-panel">
          <header className="top-nav careers-page-header">
            <div className="nav-bubble">
              <a className="brand" href="/">
                <img
                  src="/SYNERGY logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image careers-brand-desktop"
                />
                <img
                  src="/SYNERGY logo.png"
                  alt={siteContent.branding.company_name}
                  className="brand-wordmark-image careers-brand-mobile"
                />
              </a>
              <nav className="menu">
                <a href="/" className={navClass('#home')}>Home</a>
                <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                <a href="/projects" className={projectNavClass()}>Projects</a>
                <a href="/about-us" className={aboutNavClass()}>About us</a>
                <a href="/careers" className={careersNavClass()}>Careers</a>
                <a href="/contact-us" className={contactNavClass()}>Contact us</a>
              </nav>
              <button
                className="menu-toggle"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-drawer"
              >
                {isMobileMenuOpen ? 'Close' : 'Menu'}
              </button>
            </div>
            <button className="call-btn" onClick={navigateToContact}>
              Get in touch
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </header>
          <div
            className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden={!isMobileMenuOpen}
          />
          <aside
            id="mobile-nav-drawer"
            className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
            aria-hidden={!isMobileMenuOpen}
          >
            <div className="mobile-menu-header">
              <p className="mobile-menu-title">Menu</p>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <nav className="mobile-menu-links">
              <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>Home</a>
              <a href="/services/project-management" className={serviceNavClass()} onClick={() => setIsMobileMenuOpen(false)}>Services</a>
              <a href="/projects" className={projectNavClass()} onClick={() => setIsMobileMenuOpen(false)}>Projects</a>
              <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>About us</a>
              <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>Careers</a>
              <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>Contact us</a>
            </nav>
            {mobileConnectSection}
            <button className="mobile-menu-call" onClick={navigateToContact}>Get in touch</button>
          </aside>

          <div className="careers-page-content">
            {isCareerDetailRoute && selectedCareerJob ? (
              <section className="career-detail-shell">
                <div className="career-detail-layout">
                  <div className="career-detail-content">
                    <div className="career-detail-top-row">
                      <a className="career-back-link entrance-seq entrance-1" href="/careers">
                        <span className="career-back-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M16 16L8 8M14 8H8v6" />
                          </svg>
                        </span>
                        Back to careers
                      </a>
                      <p className="careers-hiring-pill entrance-seq entrance-2">{selectedCareerJob.department}</p>
                    </div>
                    <h1 className="entrance-seq entrance-2">{selectedCareerJob.title}</h1>
                    {selectedCareerJob.job_description_html ? (
                      <div
                        className="career-job-description-html entrance-seq entrance-3"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(selectedCareerJob.job_description_html) }}
                      />
                    ) : (
                      <p className="entrance-seq entrance-3">{selectedCareerJob.summary}</p>
                    )}
                    <div className="career-job-meta entrance-seq entrance-3">
                      <span className="career-meta-pill career-meta-pill-location">
                        {selectedCareerJob.location_label || selectedCareerJob.workplace_type || 'Remote'}
                      </span>
                      <span
                        className={`career-meta-pill career-meta-pill-employment ${
                          (selectedCareerJob.employment_type || '').toLowerCase().includes('full-time') ? 'is-fulltime' : ''
                        }`}
                      >
                        {selectedCareerJob.employment_type || 'Full-time'}
                      </span>
                    </div>
                  </div>
                  <div className="career-detail-form-column">
                    <form className="career-apply-form entrance-seq entrance-4" onSubmit={submitJobApplication}>
                      <h2>Apply for this role</h2>
                      <div className="career-apply-grid">
                        <input
                          type="text"
                          placeholder="Full name"
                          value={jobApplicantName}
                          onChange={(event) => setJobApplicantName(event.target.value)}
                          required
                        />
                        <input
                          type="email"
                          placeholder="Email address"
                          value={jobApplicantEmail}
                          onChange={(event) => setJobApplicantEmail(event.target.value)}
                          required
                        />
                        <input
                          className="career-apply-input-full"
                          type="tel"
                          placeholder="Phone number"
                          value={jobApplicantPhone}
                          onChange={(event) => setJobApplicantPhone(event.target.value)}
                        />
                        <label className={`career-file-upload ${jobApplicantCvUrl ? 'is-uploaded' : ''}`}>
                          <div className="career-file-upload-main">
                            <div className="career-file-upload-meta">
                              <span className="career-file-upload-name">
                                {isUploadingJobApplicantCv && jobApplicantCvFile
                                  ? `Uploading ${jobApplicantCvFile.name} (${Math.max(0, Math.min(100, jobCvUploadProgress))}%)`
                                  : jobApplicantCvFile && jobApplicantCvUrl
                                    ? `${jobApplicantCvFile.name}`
                                    : jobApplicantCvFile
                                      ? `${jobApplicantCvFile.name}`
                                      : 'Upload CV (PDF or DOCX)'}
                              </span>
                              <small>PDF, DOC, DOCX up to 10MB</small>
                            </div>
                            <button
                              type="button"
                              className="career-file-upload-btn"
                              onClick={() => careerCvInputRef.current?.click()}
                              disabled={isSubmittingJobApplication || isUploadingJobApplicantCv}
                            >
                              {jobApplicantCvUrl ? 'Replace file' : 'Choose file'}
                            </button>
                          </div>
                          {isUploadingJobApplicantCv ? (
                            <div className="career-upload-progress-inline" aria-live="polite">
                              Uploading... {Math.max(0, Math.min(100, jobCvUploadProgress))}%
                            </div>
                          ) : null}
                          <input
                            ref={careerCvInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={uploadJobApplicantCv}
                            onClick={(event) => {
                              event.currentTarget.value = ''
                            }}
                            disabled={isSubmittingJobApplication || isUploadingJobApplicantCv}
                          />
                          {isUploadingJobApplicantCv ? (
                            <div className="career-upload-progress-field" aria-live="polite">
                              <span
                                className="career-upload-progress-fill"
                                style={{ width: `${Math.max(0, Math.min(100, jobCvUploadProgress))}%` }}
                              />
                            </div>
                          ) : null}
                          {jobApplicantCvUrl ? (
                            <div className="career-upload-success-row" aria-live="polite">
                              <span className="career-upload-badge">Uploaded</span>
                            </div>
                          ) : null}
                        </label>
                        <div className="career-note-editor" aria-label="Tell us why you're a great fit">
                          <div className="career-note-editor-toolbar">
                            <button
                              type="button"
                              className={jobNoteEditor?.isActive('bold') ? 'is-active' : ''}
                              onClick={() => jobNoteEditor?.chain().focus().toggleBold().run()}
                              aria-label="Bold"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              className={jobNoteEditor?.isActive('italic') ? 'is-active' : ''}
                              onClick={() => jobNoteEditor?.chain().focus().toggleItalic().run()}
                              aria-label="Italic"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              className={jobNoteEditor?.isActive('bulletList') ? 'is-active' : ''}
                              onClick={() => jobNoteEditor?.chain().focus().toggleBulletList().run()}
                              aria-label="Bullet list"
                            >
                              List
                            </button>
                          </div>
                          <EditorContent editor={jobNoteEditor} />
                        </div>
                      </div>
                      {jobApplicationStatus ? <p className="career-apply-status">{jobApplicationStatus}</p> : null}
                      <button
                        className="career-apply-submit"
                        type="submit"
                        disabled={isSubmittingJobApplication || isUploadingJobApplicantCv}
                      >
                        {isSubmittingJobApplication ? 'Submitting...' : 'Submit application'}
                        <span className="call-btn-icon" aria-hidden="true">
                          <UpRightArrowIcon />
                        </span>
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            ) : (
              <>
                <p className="careers-hiring-pill entrance-seq entrance-1">We&apos;re hiring!</p>
                <h1 className="entrance-seq entrance-2">Be part of our mission</h1>
                <p className="entrance-seq entrance-3">
                  We&apos;re looking for passionate people to join us on our mission. We value flat hierarchies, clear
                  communication, and full ownership and responsibility.
                </p>
                <div className="careers-filter-row entrance-seq entrance-3" role="tablist" aria-label="Careers departments">
                  {careerDepartments.map((department) => (
                    <button
                      key={department}
                      type="button"
                      className={`careers-filter-chip ${careersDepartment === department ? 'active' : ''}`}
                      onClick={() => setCareersDepartment(department)}
                      aria-selected={careersDepartment === department}
                    >
                      {department}
                    </button>
                  ))}
                </div>
                <section className="careers-list" aria-label="Open roles">
                  {careersHeroJobs.map((job: JobPost, index: number) => {
                    const jobHref = `/careers/${job.id}`
                    const openJobDetails = () => {
                      window.location.href = jobHref
                    }
                    return (
                      <article
                        key={job.id}
                        className="career-job-card entrance-seq"
                        style={{ '--seq': index + 4 } as CSSProperties}
                        role="link"
                        tabIndex={0}
                        aria-label={`Open ${job.title} role details`}
                        onClick={openJobDetails}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openJobDetails()
                          }
                        }}
                      >
                        <div className="career-job-main">
                          <h2>{job.title}</h2>
                          <p>{job.summary}</p>
                          <div className="career-job-meta">
                            <span className="career-meta-pill career-meta-pill-location">
                              {job.location_label || job.workplace_type || 'Remote'}
                            </span>
                            <span
                              className={`career-meta-pill career-meta-pill-employment ${
                                (job.employment_type || '').toLowerCase().includes('full-time') ? 'is-fulltime' : ''
                              }`}
                            >
                              {job.employment_type || 'Full-time'}
                            </span>
                          </div>
                        </div>
                        <a className="career-apply-link" href={jobHref}>
                          Apply <UpRightArrowIcon />
                        </a>
                      </article>
                    )
                  })}
                </section>
              </>
            )}
          </div>
        </section>
      </main>
    )
  }

  if (activeServiceCard) {
    const activeHubService = serviceCards[servicesHubIndex] ?? activeServiceCard
    const activeHubServiceDetails = activeHubService.detail_sections?.[0]?.points?.slice(0, 3) ?? [activeHubService.description]
    const servicesHubPreviewPanel = (
      <article
        key={activeHubService.id}
        className="services-hub-preview"
        style={
          activeHubService.image_url
            ? ({
                backgroundImage: `linear-gradient(180deg, rgba(7, 12, 20, 0.06), rgba(7, 12, 20, 0.92)), url("${activeHubService.image_url}")`,
                backgroundSize: 'auto, cover',
                backgroundPosition: 'center, center',
                backgroundRepeat: 'no-repeat, no-repeat',
              } as CSSProperties)
            : undefined
        }
      >
        <button
          type="button"
          className="services-hub-preview-arrow"
          aria-label={`Open ${activeHubService.title}`}
          onClick={() => navigateWithTransition(activeHubService.href)}
        >
          <UpRightArrowIcon />
        </button>
        <div className="services-hub-preview-content">
          <h2>{activeHubService.title}</h2>
          <p>{activeHubService.description}</p>
          <ul>
            {activeHubServiceDetails.map((point) => (
              <li key={`${activeHubService.id}-${point}`}>{point}</li>
            ))}
          </ul>
        </div>
      </article>
    )
    return (
      <>
        <main className="services-page-shell">
          <section className="services-hub-section">
            <div className="services-hub-left">
              <header className="services-hub-header">
                <div className="services-hub-menu-bubble">
                  <a className="brand" href="/">
                    <img src="/SYNERGY logo.png" alt={siteContent.branding.company_name} className="brand-wordmark-image" />
                  </a>
                  <nav className="services-hub-inline-nav">
                    <a href="/" className={navClass('#home')}>Home</a>
                    <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                    <a href="/projects" className={projectNavClass()}>Projects</a>
                <a href="/about-us" className={aboutNavClass()}>About us</a>
                <a href="/careers" className={careersNavClass()}>Careers</a>
                <a href="/contact-us" className={contactNavClass()}>Contact us</a>
                  </nav>
                  <button
                    className="menu-toggle"
                    onClick={() => setIsMobileMenuOpen((open) => !open)}
                    aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-nav-drawer"
                  >
                    {isMobileMenuOpen ? 'Close' : 'Menu'}
                  </button>
                </div>
              </header>
              <div className="services-hub-content">
                <h1>Unleash Strategic Control Across Every Department</h1>
                <p>
                  Explore Synergy&apos;s integrated service ecosystem, built to align finance, compliance, HR, and
                  project execution into one reliable growth engine.
                </p>
                <div className="services-hub-nav-arrows" aria-label="Services navigation">
                  <button
                    type="button"
                    className="services-hub-nav-arrow"
                    onClick={() => setServicesHubIndex((index) => Math.max(0, index - 1))}
                    disabled={servicesHubIndex <= 0}
                    aria-label="Previous service"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M15 6l-6 6 6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="services-hub-nav-arrow"
                    onClick={() => setServicesHubIndex((index) => Math.min(serviceCards.length - 1, index + 1))}
                    disabled={servicesHubIndex >= serviceCards.length - 1}
                    aria-label="Next service"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
              <aside className="services-hub-right services-hub-right-mobile" aria-label="Active service preview">
                {servicesHubPreviewPanel}
              </aside>
              <div className="services-hub-cards-viewport" ref={servicesHubTrackRef}>
                {serviceCards.map((service, index) => (
                  <article
                    key={`services-hub-card-${service.id}`}
                    className={`services-hub-card ${servicesHubIndex === index ? 'active' : ''}`}
                    ref={(element) => {
                      servicesHubCardRefs.current[index] = element
                    }}
                    onClick={() => setServicesHubIndex(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setServicesHubIndex(index)
                      }
                    }}
                  >
                    <div
                      className="services-hub-card-media"
                      style={service.image_url ? ({ backgroundImage: `url("${service.image_url}")` } as CSSProperties) : undefined}
                      aria-hidden="true"
                    />
                    <div className="services-hub-card-overlay">
                      <h3>{service.title}</h3>
                      <p>{service.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <aside className="services-hub-right services-hub-right-desktop" aria-label="Active service preview">
              {servicesHubPreviewPanel}
            </aside>
            <div
              className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden={!isMobileMenuOpen}
            />
            <aside
              id="mobile-nav-drawer"
              className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
              aria-hidden={!isMobileMenuOpen}
            >
              <div className="mobile-menu-header">
                <p className="mobile-menu-title">Menu</p>
                <button
                  type="button"
                  className="mobile-menu-close"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>
              <nav className="mobile-menu-links">
                <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </a>
                <a
                  href="/services/project-management"
                  className={serviceNavClass()}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Services
                </a>
                <a href="/projects" className={projectNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  Projects
                </a>
                <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  About us
                </a>
                <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
                  Contact us
                </a>
              </nav>
              {mobileConnectSection}
              <button
                className="mobile-menu-call"
                onClick={() => {
                  navigateToContact()
                }}
              >
                Get in touch
              </button>
            </aside>
          </section>
        </main>
      </>
    )
  }

  const isUnknownServiceRoute = isServicesRoute && !activeServiceCard && hasLoadedContent
  const isKnownStaticRoute = isHomeRoute || isProjectsRoute || isAboutRoute || isCareersRoute || isContactRoute
  if (isUnknownServiceRoute || !isKnownStaticRoute) {
    return <NotFoundPage onGoHome={() => navigateWithTransition('/', { replace: true })} />
  }

  return (
    <>
      {showReturnHeader ? (
        <header className="top-nav top-nav-global return-visible returning-header">
          <div className="nav-bubble">
            <a className="brand" href="/">
              <img src="/SYNERGY logo.png" alt="Synergy Project Management" className="brand-wordmark-image" />
            </a>
            <nav className="menu">
              <a href="/" className={navClass('#home')}>Home</a>
              <a href="/services/project-management" className={serviceNavClass()}>Services</a>
              <a href="/projects" className={projectNavClass()}>Projects</a>
              <a href="/about-us" className={aboutNavClass()}>About us</a>
              <a href="/careers" className={careersNavClass()}>Careers</a>
              <a href="/contact-us" className={contactNavClass()}>Contact us</a>
            </nav>
            <button
              className="menu-toggle"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {isMobileMenuOpen ? 'Close' : 'Menu'}
            </button>
            <button className="call-btn" onClick={navigateToContact}>
              Get in touch
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </div>
        </header>
      ) : null}

      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden={!isMobileMenuOpen}
      />
      <aside
        id="mobile-nav-drawer"
        className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mobile-menu-header">
          <p className="mobile-menu-title">Menu</p>
          <button
            type="button"
            className="mobile-menu-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <nav className="mobile-menu-links">
          <a href="/" className={navClass('#home')} onClick={() => setIsMobileMenuOpen(false)}>
            Home
          </a>
          <a
            href="/services/project-management"
            className={serviceNavClass()}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Services
          </a>
          <a href="/projects" className={projectNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
            Projects
          </a>
          <a href="/about-us" className={aboutNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
            About us
          </a>
          <a href="/careers" className={careersNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
            Careers
          </a>
          <a href="/contact-us" className={contactNavClass()} onClick={() => setIsMobileMenuOpen(false)}>
            Contact us
          </a>
        </nav>
        {mobileConnectSection}
        <button
          className="mobile-menu-call"
          onClick={() => {
            navigateToContact()
          }}
        >
          Get in touch
        </button>
      </aside>

      <main id="home" className="page">
        <section ref={heroSceneRef} className="scroll-scene hero-scene">
          <div className="hero-container hero-stage" style={heroVars}>
            <div className="hero-visual-frame" aria-hidden="true">
              <div className="hero-media" style={homepageHeroMediaStyle} />
              {homepageHeroVideoSrc ? (
                <video
                  className="sticky-blue-wash-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                >
                  <source src={homepageHeroVideoSrc} type="video/mp4" />
                </video>
              ) : null}
            </div>
            <header className="top-nav top-nav-hero" style={headerBlendVars}>
              <div className="nav-bubble">
                <a className="brand" href="/">
                  <img src="/syngergy-logo.png" alt={siteContent.branding.company_name} className="brand-wordmark-image" />
                </a>
                <nav className="menu">
                  <a href="/" className={navClass('#home')}>Home</a>
                  <a href="/services/project-management" className={serviceNavClass()}>Services</a>
                  <a href="/projects" className={projectNavClass()}>Projects</a>
                  <a href="/about-us" className={aboutNavClass()}>About us</a>
                  <a href="/careers" className={careersNavClass()}>Careers</a>
                  <a href="/contact-us" className={contactNavClass()}>Contact us</a>
                </nav>
                <button
                  className="menu-toggle"
                  onClick={() => setIsMobileMenuOpen((open) => !open)}
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-nav-drawer"
                >
                  {isMobileMenuOpen ? 'Close' : 'Menu'}
                </button>
              </div>
              <button className="call-btn" onClick={navigateToContact}>
                Get in touch
                <span className="call-btn-icon" aria-hidden="true">
                  <UpRightArrowIcon />
                </span>
              </button>
            </header>
            <div className="hero-scroll-content">
              <div className="hero-scroll-body">
                <div className="hero-content">
                  <p className="eyebrow">{siteContent.branding.hero_eyebrow}</p>
                  <h1>{siteContent.branding.hero_title}</h1>
                  <p className="subtitle">
                    {siteContent.branding.hero_subtitle}
                  </p>
                  <div className="cta-row">
                    <a className="primary home-hero-primary" href="/services/project-management">
                      Our Services
                      <span className="call-btn-icon" aria-hidden="true">
                        <UpRightArrowIcon />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="trust-row">
              <span>Trusted by 50+ companies</span>
            </div>

            <div className="hero-reveal-content">
              <p className="eyebrow sticky-eyebrow">Synergy Project Management</p>
              <h2 className="sticky-title">14+ years of experience</h2>
              <p className="sticky-text">
                We are a dynamic and fast-growing business, with experience in managing large
                construction projects such as Hotel Apartments, Luxury Villas in the UAE and
                Major Hospital Projects.
              </p>
            </div>
          </div>
        </section>

        <div
          className={`dialog-overlay ${dialogMode === 'book' ? 'open' : ''}`}
          onClick={() => setDialogMode('none')}
          aria-hidden={dialogMode === 'none'}
        />
        <section
          className={`dialog-shell ${dialogMode === 'book' ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Book a call"
        >
          <button
            className="dialog-close top-close"
            onClick={() => setDialogMode('none')}
            aria-label="Close dialog"
          >
            x
          </button>
          <h2>Book a strategy call</h2>
          <p>Tell us what your team is trying to achieve in the next quarter.</p>
          <form className="dialog-form">
            <label>
              Full name
              <input required type="text" placeholder="Jane Smith" />
            </label>
            <label>
              Work email
              <input required type="email" placeholder="jane@company.com" />
            </label>
            <label>
              Team size
              <input required type="number" min={1} placeholder="25" />
            </label>
            <button type="submit" className="primary">
              Submit Request
              <span className="call-btn-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </form>
          <button
            className="dialog-close bottom-close"
            onClick={() => setDialogMode('none')}
            aria-label="Close dialog"
          >
            Close
          </button>
        </section>
      </main>

      <section ref={thirdSceneRef} className="third-scene" style={thirdVars}>
        <div className="third-sticky">
          <p className="third-line third-line-one">What changes when</p>
          <p className="third-line third-line-two">you work with us.</p>
        </div>

        <div className="fourth-sticky">
          <section className="fourth-section">
            <article className="value-card value-card-before">
              <p className="card-label">Before</p>
              <h3>Guessing what grows revenue.</h3>
              <ul>
                <li>Hiring more reps to fix conversion problems.</li>
                <li>Pipeline that looks full but never closes.</li>
                <li>Pricing based on what competitors charge.</li>
                <li>Every quarter starts from zero.</li>
              </ul>
            </article>

            <article className="value-card value-card-after">
              <p className="card-label">After</p>
              <h3>Knowing exactly what moves the number.</h3>
              <ul>
                <li>Every dollar of spend tied to revenue.</li>
                <li>Pipeline that converts predictably.</li>
                <li>Pricing built on what customers value.</li>
                <li>Compounding growth, quarter over quarter.</li>
              </ul>
            </article>
          </section>
        </div>
      </section>

      <section className="services-showcase-section" aria-label="Services showcase">
        <div className="services-showcase-header">
          <h2>What we excel at</h2>
          <div className="section-nav-arrows" aria-label="Services navigation">
            <button
              type="button"
              className="section-nav-arrow"
              onClick={() => setShowcaseIndex((index) => Math.max(0, index - 1))}
              disabled={!canSlideServices || showcaseIndex <= 0}
              aria-label="Previous service card"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              className="section-nav-arrow"
              onClick={() => setShowcaseIndex((index) => Math.min(serviceCards.length - 1, index + 1))}
              disabled={!canSlideServices || showcaseIndex >= serviceCards.length - 1}
              aria-label="Next service card"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
        <div className="services-showcase-track" ref={showcaseTrackRef}>
          {serviceCards.map((service, index) => (
            <article
              key={`showcase-${service.id}`}
              className={`services-showcase-card ${getShowcaseRatioClass(index, serviceCards.length)}`}
              ref={(element) => {
                showcaseCardRefs.current[index] = element
              }}
              role="link"
              tabIndex={0}
              aria-label={`Open ${service.title}`}
              onClick={() => {
                navigateWithTransition(service.href)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigateWithTransition(service.href)
                }
              }}
              style={
                service.image_url
                  ? ({
                      backgroundImage: `linear-gradient(180deg, rgba(5, 15, 26, 0.06), rgba(5, 15, 26, 0.78)), radial-gradient(circle at 62% 24%, rgba(191, 213, 233, 0.2), transparent 52%), url("${service.image_url}")`,
                      backgroundSize: 'auto, auto, cover',
                      backgroundPosition: 'center, center, center',
                      backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
                    } as CSSProperties)
                  : undefined
              }
            >
              <div className="services-showcase-overlay">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="services-showcase-dots" role="tablist" aria-label="Services showcase navigation">
          {serviceCards.map((service, index) => (
            <button
              key={`showcase-dot-${service.id}`}
              type="button"
              className={`services-showcase-dot ${showcaseIndex === index ? 'active' : ''}`}
              onClick={() => setShowcaseIndex(index)}
              aria-label={`Show ${service.title}`}
              aria-selected={showcaseIndex === index}
            />
          ))}
        </div>
      </section>

      <section ref={sixthSceneRef} className="sixth-section" style={sixthVars}>
        <div className="sixth-inner" style={teamSectionStyle}>
          <header className="sixth-header">
            <p className="sixth-kicker">Synergy Project Management</p>
            <h2>{siteContent.branding.team_title}</h2>
          </header>

          <div className="sixth-grid">
            {teamCols.map((col, colIdx) => (
              <div className="sixth-col" key={`col-${colIdx}`}>
                {col.map((member, memberIdx) => (
                  <article
                    key={member.id}
                    className={`member-row ${selectedMember?.id === member.id ? 'member-row-highlight' : ''} ${
                      'member-row-scroll-reveal'
                    }`}
                    style={
                      {
                        '--member-start': 0.12 + (colIdx * 3 + memberIdx) * 0.11,
                      } as CSSProperties
                    }
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="member-meta">
                      <span className="member-avatar">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} className="member-avatar-image" />
                        ) : (
                          member.initials
                        )}
                      </span>
                      <div>
                        <h3>{member.name}</h3>
                        <p>{member.role}</p>
                      </div>
                    </div>
                    <div className="member-tail">
                      <span>{member.number}</span>
                      <button aria-label={`Open ${member.name} profile`}>
                        <PlusGlyph />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={insightsSceneRef} className="insights-scene">
        <div className="insights-sticky">
          <div className="insights-inner">
          <aside className="insights-lead">
            <div className="insights-title-row">
              <h2>{siteContent.branding.insights_title}</h2>
              <div className="section-nav-arrows" aria-label="Projects navigation">
                <button
                  type="button"
                  className="section-nav-arrow"
                  onClick={() => setInsightsIndex((index) => Math.max(0, index - 1))}
                  disabled={insightsIndex <= 0}
                  aria-label="Previous project card"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="section-nav-arrow"
                  onClick={() => setInsightsIndex((index) => Math.min(visibleInsights.length - 1, index + 1))}
                  disabled={insightsIndex >= visibleInsights.length - 1}
                  aria-label="Next project card"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
            <p>{siteContent.branding.insights_description}</p>
            <button
              className="insights-view-all"
              onClick={() => {
                navigateWithTransition('/projects')
              }}
            >
              Lets Partner on a Project
              <span className="cta-arrow-icon" aria-hidden="true">
                <UpRightArrowIcon />
              </span>
            </button>
          </aside>

          <div className="insights-cards-viewport">
            <div
              className="insights-cards-track"
              style={isMobileViewport ? { transform: `translateX(-${insightsIndex * 100}%)` } : undefined}
            >
            {visibleInsights.map((insight) => (
            <article
              className={`insight-card ${insight.alt_style ? 'insight-card-alt' : ''} ${
                insight.image_url ? 'has-image' : ''
              }`}
              style={
                insight.image_url
                  ? ({ '--insight-image-url': `url("${insight.image_url}")` } as CSSProperties)
                  : undefined
              }
              key={insight.id}
            >
              <p className={`insight-chip ${getStatusBadgeClass(insight.chip)}`}>
                {insight.chip.replace(/^Status:\s*/i, '')}
              </p>
              <p className="insight-date insight-location-badge">
                {insight.date_label.replace(/^Location:\s*/i, '')}
              </p>
              <h3>{formatProjectTitle(insight.title)}</h3>
            </article>
            ))}
            </div>
          </div>
        </div>
        </div>
      </section>

      {sharedFooterSection}

      <div
        className={`member-overlay ${selectedMember ? 'open' : ''}`}
        onClick={() => setSelectedMember(null)}
        aria-hidden={!selectedMember}
      />
      <section
        className={`member-dialog ${selectedMember ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Team member profile"
      >
        {selectedMember && (
          <>
            <div className="member-dialog-media">
              {selectedMember.avatar_url ? (
                <img src={selectedMember.avatar_url} alt={selectedMember.name} className="member-dialog-image" />
              ) : (
                <span>{selectedMember.initials}</span>
              )}
            </div>
            <div className="member-dialog-body">
              <button
                className="member-dialog-close"
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setSelectedMember(null)
                }}
                aria-label="Close profile dialog"
              >
                ×
              </button>
              <p className="member-role">{selectedMember.role}</p>
              <h3>{selectedMember.name}</h3>
              <p className="member-bio">{selectedMember.bio}</p>
              <div className="member-links">
                <div className="member-socials">
                  <span>x</span>
                  <span>in</span>
                  <span>ig</span>
                  <span>f</span>
                </div>
                <button
                  type="button"
                  className={`member-email-row ${memberEmailCopied ? 'copied' : ''}`}
                  onClick={copyMemberEmail}
                  aria-label="Copy team member email"
                  title={memberEmailCopied ? 'Copied' : 'Copy email'}
                >
                  <div>
                    <strong>{memberEmailLabel}</strong>
                  </div>
                  <span className="copy-email-icon" aria-hidden="true">
                    <span className="copy-icon" />
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  )
}

export default App
