'use client'

import { useState, type ComponentType, type ReactNode } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Menu, X } from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
}

interface AnnouncementBanner {
  text: string
  linkText: string
  linkHref: string
}

interface CallToAction {
  text: string
  href: string
  variant: 'primary' | 'secondary'
}

interface HeroLandingProps {
  logo?: {
    src?: string
    alt?: string
    companyName: string
    icon?: ComponentType<{ className?: string }>
  }
  navigation?: NavigationItem[]
  loginText?: string
  loginHref?: string
  title: ReactNode
  description: string
  announcementBanner?: AnnouncementBanner
  callToActions?: CallToAction[]
  titleSize?: 'small' | 'medium' | 'large'
  gradientColors?: {
    from: string
    to: string
  }
  className?: string
}

const defaultProps: Partial<HeroLandingProps> = {
  logo: {
    src: 'https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600',
    alt: 'Company Logo',
    companyName: 'Your Company',
  },
  navigation: [
    { name: 'Product', href: '#' },
    { name: 'Features', href: '#' },
    { name: 'Marketplace', href: '#' },
    { name: 'Company', href: '#' },
  ],
  loginText: 'Log in',
  loginHref: '#',
  titleSize: 'large',
  gradientColors: {
    from: 'oklch(0.646 0.222 41.116)',
    to: 'oklch(0.488 0.243 264.376)',
  },
  callToActions: [
    { text: 'Get started', href: '#', variant: 'primary' },
    { text: 'Learn more', href: '#', variant: 'secondary' },
  ],
}

export function HeroLanding(props: HeroLandingProps) {
  const {
    logo,
    navigation,
    loginText,
    loginHref,
    title,
    description,
    announcementBanner,
    callToActions,
    titleSize,
    gradientColors,
    className,
  } = { ...defaultProps, ...props }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getTitleSizeClasses = () => {
    switch (titleSize) {
      case 'small':
        return 'text-2xl sm:text-3xl md:text-5xl'
      case 'medium':
        return 'text-2xl sm:text-4xl md:text-6xl'
      case 'large':
      default:
        return 'text-3xl sm:text-5xl md:text-7xl'
    }
  }

  const renderCallToAction = (cta: CallToAction, index: number) => {
    if (cta.variant === 'primary') {
      return (
        <a
          key={index}
          href={cta.href}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:px-3.5 sm:py-2.5 sm:text-sm"
        >
          {cta.text}
        </a>
      )
    }

    return (
      <a
        key={index}
        href={cta.href}
        className="text-xs font-semibold text-foreground transition-colors hover:text-muted-foreground sm:text-sm/6"
      >
        {cta.text} <span aria-hidden="true">→</span>
      </a>
    )
  }

  const LogoIcon = logo?.icon

  return (
    <section className={`relative min-h-[100svh] w-full overflow-x-hidden ${className || ''}`}>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            background: `linear-gradient(to top right, ${gradientColors?.from}, ${gradientColors?.to})`,
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            background: `linear-gradient(to top right, ${gradientColors?.from}, ${gradientColors?.to})`,
          }}
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        />
      </div>

      <header className="absolute inset-x-0 top-0 z-10">
        <nav aria-label="Global" className="flex items-center justify-between p-4 sm:p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 flex items-center gap-3 p-1.5 text-foreground">
              <span className="sr-only">{logo?.companyName}</span>
              {LogoIcon ? (
                <LogoIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              ) : (
                <img alt={logo?.alt} src={logo?.src} className="h-6 w-auto sm:h-8" />
              )}
              <span className="hidden font-display text-sm tracking-[0.3em] sm:inline-block">
                {logo?.companyName}
              </span>
            </a>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="sr-only">Open main menu</span>
              <Menu aria-hidden="true" className="size-6" />
            </button>
          </div>
          {navigation && navigation.length > 0 && (
            <div className="hidden lg:flex lg:gap-x-8 xl:gap-x-12">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm/6 font-semibold text-foreground transition-colors hover:text-muted-foreground"
                >
                  {item.name}
                </a>
              ))}
            </div>
          )}
          {loginText && loginHref && (
            <div className="hidden lg:flex lg:flex-1 lg:justify-end">
              <a
                href={loginHref}
                className="text-sm/6 font-semibold text-foreground transition-colors hover:text-muted-foreground"
              >
                {loginText} <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          )}
        </nav>
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogContent className="fixed inset-y-0 right-0 left-auto top-0 grid h-full max-w-sm translate-x-0 translate-y-0 overflow-y-auto border-border bg-card px-4 py-4 sm:px-6 sm:py-6 lg:hidden">
            <div className="flex items-center justify-between">
              <a href="#" className="-m-1.5 flex items-center gap-3 p-1.5">
                <span className="sr-only">{logo?.companyName}</span>
                {LogoIcon ? (
                  <LogoIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                ) : (
                  <img alt={logo?.alt} src={logo?.src} className="h-6 w-auto sm:h-8" />
                )}
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="sr-only">Close menu</span>
                <X aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="mt-2 flow-root">
              <div className="-my-6 divide-y divide-border">
                {navigation && navigation.length > 0 && (
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                )}
                {loginText && loginHref && (
                  <div className="py-6">
                    <a
                      href={loginHref}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {loginText}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pt-4">
        <div className="mx-auto max-w-4xl pt-20 sm:pt-24">
          {announcementBanner && (
            <div className="hidden sm:mb-2 sm:flex sm:justify-center">
              <div className="relative rounded-full px-2 py-1 text-xs text-muted-foreground ring-1 ring-border transition-all hover:ring-ring sm:px-3 sm:text-sm/6">
                {announcementBanner.text}{' '}
                <a
                  href={announcementBanner.linkHref}
                  className="font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  <span aria-hidden="true" className="absolute inset-0" />
                  {announcementBanner.linkText} <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          )}

          <div className="text-center">
            <h1
              className={`${getTitleSizeClasses()} font-display font-semibold tracking-tight text-balance text-foreground`}
            >
              {title}
            </h1>
            <p className="mt-6 text-base font-medium text-pretty text-muted-foreground sm:mt-8 sm:text-lg sm:leading-8">
              {description}
            </p>

            {callToActions && callToActions.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-x-4 sm:mt-10 sm:gap-x-6">
                {callToActions.map((cta, index) => renderCallToAction(cta, index))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export type { HeroLandingProps, NavigationItem, AnnouncementBanner, CallToAction }
