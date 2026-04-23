import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ComponentType } from 'react'
import PhoneInputLib from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { AdminDashboard, type AdminPage } from './components/AdminDashboard'
import Noise from './components/Noise'
import { TextPressureWord } from './components/TextPressureWord'
import { contentApi, type ServiceItem, type SiteContent, type TeamMember } from './lib/content'

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
  const [aboutServicesIndex, setAboutServicesIndex] = useState(0)
  const [aboutTeamIndex, setAboutTeamIndex] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  )
  const [activeRoute, setActiveRoute] = useState(resolveCurrentRoute)
  const [hasLoadedContent, setHasLoadedContent] = useState(false)
  const [siteContent, setSiteContent] = useState<SiteContent>(() => ({
    ...contentApi.fallback,
    team: [],
    services: [],
    insights: [],
    media: [],
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
  const lastScrollYRef = useRef(0)

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
  const featuredInsights = useMemo(() => {
    const insightsWithImages = siteContent.insights.filter(
      (insight) => typeof insight.image_url === 'string' && insight.image_url.trim().length > 0,
    )
    if (insightsWithImages.length >= 3) return insightsWithImages.slice(0, 3)
    return siteContent.insights.slice(0, 3)
  }, [siteContent.insights])
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
      if (featuredInsights.length === 0) return 0
      return Math.min(previous, featuredInsights.length - 1)
    })
  }, [featuredInsights.length])

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
    if (!selectedMember) {
      setMemberEmailCopied(false)
      setMemberEmailLabel('')
      return
    }
    setMemberEmailCopied(false)
    setMemberEmailLabel(selectedMember.email)
  }, [selectedMember])

  const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  const adminPage: AdminPage = (() => {
    if (typeof window === 'undefined') return 'dashboard'
    const part = window.location.pathname.replace(/^\/admin\/?/, '').split('/')[0]
    if (!part) return 'dashboard'
    if (part === 'branding' || part === 'team' || part === 'services' || part === 'insights' || part === 'media') return part
    return 'dashboard'
  })()
  const homepageTeam = siteContent.team.slice(0, 6)
  const teamCols = [
    homepageTeam.slice(0, 3),
    homepageTeam.slice(3, 6),
  ]

  if (isAdminPath) {
    return (
      <AdminDashboard
        page={adminPage}
        branding={siteContent.branding}
        team={siteContent.team}
        services={siteContent.services}
        insights={siteContent.insights}
        media={siteContent.media}
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
  const isServicesRoute = activePathname.startsWith('/services')
  const isProjectsRoute = activePathname === '/projects' || activePathname.startsWith('/projects/')
  const isAboutRoute = activePathname === '/about-us' || activePathname.startsWith('/about-us/')
  const isContactRoute = activePathname === '/contact-us' || activePathname.startsWith('/contact-us/')
  const serviceNavClass = () => (isServicesRoute ? 'active' : '')
  const projectNavClass = () => (isProjectsRoute ? 'active' : '')
  const aboutNavClass = () => (isAboutRoute ? 'active' : '')
  const contactNavClass = () => (isContactRoute ? 'active' : '')
  const navigateToContact = () => {
    navigateWithTransition('/contact-us')
    setIsMobileMenuOpen(false)
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
                <img src="/syngergy-logo.png" alt={siteContent.branding.company_name} className="footer-brand-logo" />
              </p>
              <p className="footer-address">Onyx Tower 1, The Greens{'\n'}Dubai, United Arab Emirates</p>
              <h2 className="footer-newsletter-heading">
                <span className="footer-newsletter-primary">Subscribe</span>
                <span className="footer-newsletter-secondary">to our newsletter.</span>
              </h2>
              <form className="footer-subscribe">
                <input type="email" placeholder="Email" />
                <button type="button">
                  Subscribe
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
                    {siteContent.media
                      .filter((item) => item.kind === 'social')
                      .map((item) => <span key={item.id}>{item.value}</span>)}
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
              className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}
              aria-hidden={!isMobileMenuOpen}
            >
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
                        onClick={() => setInsightsIndex((index) => Math.min(featuredInsights.length - 1, index + 1))}
                        disabled={insightsIndex >= featuredInsights.length - 1}
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
                  {featuredInsights.map((insight) => (
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
            <div className="noise-layer" />
            <div className="about-page-hero-media" />
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
                <img
                  src={siteContent.branding.favicon_url || '/SYNERGY logo.png'}
                  alt={`${siteContent.branding.company_name} favicon`}
                  className="about-team-favicon"
                />
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
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="about-team-card-image" />
                    ) : (
                      <span className="about-team-card-fallback">{member.initials}</span>
                    )}
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
            {Array.from({ length: aboutTeamMaxSlideIndex + 1 }).map((_, index) => (
              <button
                key={`about-team-dot-${index}`}
                type="button"
                className={`about-team-dot ${aboutTeamIndex === index ? 'active' : ''}`}
                onClick={() => setAboutTeamIndex(index)}
                aria-label={`Show team slide ${index + 1}`}
                aria-selected={aboutTeamIndex === index}
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
            <Noise
              patternSize={250}
              patternScaleX={2}
              patternScaleY={2}
              patternRefreshInterval={2}
              patternAlpha={48}
            />
            <div className="contact-page-hero-media" />
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
                onSubmit={(event) => {
                  event.preventDefault()
                }}
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
                <button type="submit" className="contact-page-form-submit">
                  <span>Send message</span>
                  <span className="call-btn-icon" aria-hidden="true">
                    <UpRightArrowIcon />
                  </span>
                </button>
              </form>
            </aside>
          </div>
        </section>
      </main>
    )
  }

  if (activeServiceCard) {
    const activeHubService = serviceCards[servicesHubIndex] ?? activeServiceCard
    const activeHubServiceDetails = activeHubService.detail_sections?.[0]?.points?.slice(0, 3) ?? [activeHubService.description]
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
            <aside className="services-hub-right" aria-label="Active service preview">
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
              <div className="noise-layer" />
              <div className="hero-media" />
              <video
                className="sticky-blue-wash-video"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              >
                <source src="https://www.pexels.com/download/video/10320249/" type="video/mp4" />
              </video>
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
        <div className="sixth-inner">
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
                  onClick={() => setInsightsIndex((index) => Math.min(featuredInsights.length - 1, index + 1))}
                  disabled={insightsIndex >= featuredInsights.length - 1}
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
            {featuredInsights.map((insight) => (
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
