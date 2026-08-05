import { useLocation } from '@gatsbyjs/reach-router';
import classNames from 'classnames';
import { Link, navigate } from 'gatsby';
import * as React from 'react';
import ActiveCardsHome from '../components/activeCardsHome';
import AetherFlowHero from '../components/Index/AetherFlowHero';
import { Feature } from '../components/Index/Feature';
import { ProblemsetsFeature } from '../components/Index/features/ProblemsetsFeature';
import { ProgressTrackingFeature } from '../components/Index/features/ProgressTrackingFeature';
import { ResourcesFeature } from '../components/Index/features/ResourcesFeature';
import LightRays from '../components/Index/LightRays';
import Layout from '../components/layout';
import SEO from '../components/seo';
import TopNavigationBar from '../components/TopNavigationBar/TopNavigationBar';
import {
  useCurrentUser,
  useIsUserDataLoaded,
} from '../context/UserDataContext/UserDataContext';
import { useScrollReveal } from '../hooks/useScrollReveal';

/**
 * Index-only DARK palette:
 * - Background: midnight navy-ish
 * - Accents/content: vanilla + purple
 *
 * Requested update (image2):
 * - Use the sampled deep purple (~#70428A) for:
 *   - “AMC to Olympiad” text
 *   - “Browse Topics” button background
 * - Remove glow around “Browse Topics” (no GlowingRing wrapper, no shadow)
 */
/* Every page shares one base background; see --bg-page in src/styles/theme.css. */
const PAGE_BG = 'var(--bg-page)';

const VANILLA = '#F4EDEA';
const MAUVE = '#F0C2FF';

const TEXT_PRIMARY = VANILLA;
const TEXT_SECONDARY = 'rgba(244, 237, 234, 0.78)';
const TEXT_MUTED = 'rgba(244, 237, 234, 0.62)';

const containerClasses = 'max-w-(--breakpoint-xl) mx-auto px-4 sm:px-6 lg:px-8';

function RevealSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>(0.1);
  return (
    <div
      ref={ref}
      className={classNames(
        'transition-all duration-700 ease-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function IndexPage({ path }): JSX.Element {
  const currentUser = useCurrentUser();
  const loading = useIsUserDataLoaded();
  const location = useLocation();

  React.useEffect(() => {
    try {
      if (currentUser && location.state.redirect) navigate('/dashboard');
    } catch (e) {
      if (currentUser) navigate('/dashboard');
    }
  }, [currentUser, loading, location]);

  React.useEffect(() => {
    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const prevHtmlOverscrollY = htmlStyle.overscrollBehaviorY;
    const prevBodyOverscrollY = bodyStyle.overscrollBehaviorY;

    htmlStyle.overscrollBehaviorY = 'none';
    bodyStyle.overscrollBehaviorY = 'none';

    return () => {
      htmlStyle.overscrollBehaviorY = prevHtmlOverscrollY;
      bodyStyle.overscrollBehaviorY = prevBodyOverscrollY;
    };
  }, []);

  const linkStyle: React.CSSProperties = {
    color: MAUVE,
    textDecoration: 'none',
    fontWeight: 700,
  };

  const sectionHeadingClasses =
    'mx-auto flex max-w-4xl flex-col items-center text-center text-4xl font-bold tracking-tight md:text-5xl 2xl:text-6xl';
  const sectionSubtitleClasses =
    'mx-auto max-w-3xl text-center text-lg font-medium leading-relaxed md:text-xl 2xl:text-2xl';
  const infoCardStyle: React.CSSProperties = {
    background: 'rgba(43, 30, 57, 0.92)',
    color: TEXT_PRIMARY,
  };

  return (
    <Layout>
      <SEO title={null} image={null} pathname={path} />

      <div className="fixed top-0 z-50 w-full">
        <div className="backdrop-blur-lg">
          <TopNavigationBar hidePromoBar />
        </div>
      </div>

      {/* Begin Hero */}
      <AetherFlowHero />
      {/* End Hero */}

      {/* Wave transition: dark base */}
      <div
        className="pointer-events-none overflow-hidden leading-[0]"
        style={{ backgroundColor: PAGE_BG }}
      >
        <svg
          viewBox="0 0 1200 80"
          preserveAspectRatio="none"
          className="block h-16 w-full md:h-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,80 C300,80 400,0 600,0 C800,0 900,80 1200,80 L1200,0 L0,0 Z"
            style={{ fill: PAGE_BG }}
          />
        </svg>
      </div>

      {/* Below hero: keep dark background but page-owned text stays vanilla/purple */}
      <div
        className="relative transition-colors duration-500"
        style={{
          background: PAGE_BG,
          color: TEXT_PRIMARY,
        }}
      >
        <div className="h-6 sm:h-10 md:h-16 2xl:h-24"></div>

        <RevealSection className="px-6 sm:px-8 lg:px-10">
          <div className="mx-auto grid w-full max-w-6xl items-center justify-center gap-8 pb-3 md:grid-cols-[auto_auto] md:gap-x-10 md:pl-8 lg:gap-x-14 lg:pl-10">
            <div className="flex min-w-0 flex-col items-center">
              <h2
                className="text-center text-5xl font-bold md:text-6xl md:whitespace-nowrap xl:text-7xl"
                style={{ color: TEXT_PRIMARY }}
              >
                Learn Contest Math
              </h2>
              <p
                className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed font-medium md:text-xl 2xl:text-2xl"
                style={{ color: TEXT_SECONDARY }}
              >
                Carefully designed for math contest students - available to
                everyone, for free.
              </p>
            </div>
            <div className="flex justify-center">
              <img
                src="/images/Lovemascot.png"
                alt="Lovemascot"
                className="h-32 w-auto shrink-0 object-contain md:h-40 lg:h-48 xl:h-56"
              />
            </div>
          </div>
        </RevealSection>

        <div className={containerClasses}>
          <div className="h-12 md:h-20 2xl:h-36"></div>

          {/* Imported components may still have their own colors internally */}
          <RevealSection delay={100}>
            <div className="grid gap-6 lg:grid-cols-2">
              <Feature
                iconSrc="/images/feature-resources.png"
                iconFallbackSrc="https://i.ibb.co/TD2gjPwB/feature-resources.png"
                iconAlt="Resources icon"
                iconClasses="bg-black"
                title="Curated Resources"
                blobClasses="[background-color:rgb(99,84,139)] hidden xl:block"
                feature={<ResourcesFeature />}
                fade="none"
              >
                Learn new topics from a vetted list of high-quality resources.
                If one resource doesn't click, look at another!
                <span className="mt-3 block">
                  <Link to="/foundations" style={linkStyle}>
                    Explore Foundations Resources
                  </Link>
                </span>
              </Feature>

              <Feature
                iconSrc="/images/feature-problemsets.png"
                iconFallbackSrc="https://i.ibb.co/S7mV5P3x/feature-problemsets.png"
                iconAlt="Problemsets icon"
                iconClasses="bg-black"
                title="Extensive Problemsets"
                blobClasses="bg-black"
                feature={<ProblemsetsFeature />}
                fade="none"
              >
                Practice each topic with extensive problemsets and solutions
                covering a wide range of difficulties.
                <span className="mt-3 block">
                  <Link to="/problems" style={linkStyle}>
                    Go to Problems Page
                  </Link>
                </span>
              </Feature>
            </div>
          </RevealSection>

          <div className="h-6 md:h-10 2xl:h-24"></div>

          <RevealSection delay={150}>
            <div className="grid gap-6 lg:grid-cols-2">
              <Feature
                iconSrc="/images/feature-progress.png"
                iconFallbackSrc="https://i.ibb.co/hJbCbhn9/feature-progress.png"
                iconAlt="Progress tracking icon"
                iconClasses="bg-black"
                title="Progress Tracking"
                blobClasses="[background-color:rgb(99,84,139)]"
                feature={<ProgressTrackingFeature />}
                fade="none"
              >
                Use our progress-tracking tools to track your progress in the
                Guide and stay motivated.
                <span className="mt-3 block">
                  <Link to="/dashboard" style={linkStyle}>
                    Open Dashboard
                  </Link>
                </span>
              </Feature>

              <Feature
                iconSrc="/images/feature-community.png"
                iconFallbackSrc="https://i.ibb.co/gLmZWq6n/feature-community.png"
                iconAlt="Community help icon"
                iconClasses="bg-black"
                title="Help when you need it"
                blobClasses="bg-green-200 dark:bg-green-800"
                feature={<div className=""></div>}
                fade="none"
              >
                <span className="mb-4 block md:mb-8">
                  Ask questions, share solutions, and learn from other contest
                  students in our Discord community.
                </span>

                <a
                  href="https://discord.gg/X2zx6u53XH"
                  target="_blank"
                  rel="noreferrer"
                  style={linkStyle}
                >
                  Visit Discord Community →
                </a>
              </Feature>
            </div>
          </RevealSection>

          <div className="h-16 md:h-20 2xl:h-36"></div>
        </div>
      </div>
      <ActiveCardsHome />
      {/* Section divider */}
      <div
        className="pointer-events-none mx-auto w-2/3"
        style={{
          height: '1px',
          background: 'rgba(197, 139, 255, 0.45)',
        }}
      />
      <div
        className="relative transition-colors duration-500"
        style={{
          background: PAGE_BG,
          color: TEXT_PRIMARY,
        }}
      >
        {/* Light rays effect from divider line */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <LightRays
            raysOrigin="top-center"
            raysColor="#bd9ee5"
            raysSpeed={0.8}
            lightSpread={0.5}
            rayLength={2.5}
            pulsating={true}
            fadeDistance={1}
            saturation={0.9}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0.05}
            distortion={0.1}
            className="custom-rays"
          />
        </div>
        <div className="relative z-10">
          <div className="h-16 md:h-24"></div>
          <div className={containerClasses}>
            <RevealSection>
              <div className="grid items-center gap-10 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <h2
                    className="max-w-3xl text-left text-3xl font-bold tracking-tight md:text-4xl 2xl:text-5xl"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    Contribute to the Community.
                  </h2>
                  <div className="h-5"></div>
                  <p
                    className="max-w-2xl text-left text-lg leading-relaxed md:text-xl"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    USAMO Guide is a student-run community dedicated to olympiad
                    mathematics. Join us to write lessons, curate problem sets,
                    and grow as a mentor alongside fellow contest enthusiasts.
                  </p>
                  <div className="h-7 md:h-9"></div>
                  <a
                    href="https://docs.google.com/document/d/1AUNOq6OlVcSZN_gUPfvyhimlh9hA4GNvNaLdzyflX_8/edit?usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                    className="purple-motion-effect inline-flex items-center justify-center rounded-full px-7 py-3 font-mono text-base leading-tight font-bold"
                    style={
                      {
                        border: '1px solid rgba(240, 194, 255, 0.34)',
                        background: '#6D3B9F',
                        '--pme-color': '#F4EDEA',
                        '--pme-hover-color': '#201C36',
                        '--pme-wipe-bg': '#F0C2FF',
                      } as React.CSSProperties
                    }
                  >
                    Get Involved
                  </a>
                </div>
                <div className="lg:col-span-5">
                  <div className="ui-card-dark overflow-hidden rounded-2xl">
                    <img
                      src="/images/builders.png"
                      alt="USAMO Guide team collaboration"
                      className="w-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="h-16 md:h-24"></div>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>

      {/* Begin FAQ */}
      <div
        className="relative transition-colors duration-500"
        style={{
          background: PAGE_BG,
          color: TEXT_PRIMARY,
        }}
      >
        <div className="relative z-10 mx-auto max-w-(--breakpoint-xl) px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8 lg:pt-20 lg:pb-28">
          <RevealSection>
            <h2
              className={sectionHeadingClasses}
              style={{ color: TEXT_PRIMARY }}
            >
              Frequently asked questions
            </h2>
            <p
              className={classNames(sectionSubtitleClasses, 'mt-4')}
              style={{ color: TEXT_SECONDARY }}
            >
              The essentials about the competition path, how the Guide works,
              and how to get involved.
            </p>
          </RevealSection>
          <div className="pt-10 md:pt-16">
            <RevealSection delay={100}>
              <dl className="mx-auto grid max-w-6xl gap-8 text-center md:grid-cols-2 md:gap-8">
                <div>
                  <div
                    className="rounded-2xl p-6 text-left"
                    style={infoCardStyle}
                  >
                    <dt
                      className="text-lg leading-6 font-medium"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      What are AMC, AIME, and USAMO?
                    </dt>
                    <dd className="mt-2">
                      <p
                        className="text-base leading-6"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        These are the three big rungs of the US math competition ladder. 
                      AMC 8 is for middle schoolers, AMC 10/12 for high schoolers. 
                      While both are 25-question multiple choice contests, score well enough on them and you would qualify for AIME, a much harder 15-question numerical exam.
                      Do well on the AIME aswell and you're at the USAMO (or USAJMO) territory.
                      This would probably be the toughest math test most high schoolers will ever take. For official dates and registration, check the{' '}
                        <a
                          href="https://www.maa.org/math-competitions"
                          target="_blank"
                          rel="noreferrer"
                          style={linkStyle}
                        >
                          MAA competitions page
                        </a>
                        .
                      </p>
                    </dd>
                  </div>
                  <div
                    className="mt-6 rounded-2xl p-6 text-left"
                    style={infoCardStyle}
                  >
                    <dt
                      className="text-lg leading-6 font-medium"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      Is this an official syllabus?
                    </dt>
                    <dd className="mt-2">
                      <p
                        className="text-base leading-6"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        Nope. USAMO Guide is built by the community, for the community. It's our best attempt at organizing what actually works for AMC/AIME/USAMO prep, not something blessed by the MAA :/
                        Think of it as notes that are passed down and refined by people who've been through the process, constantly getting better as more people chip in.
                      </p>
                    </dd>
                  </div>
                  <div
                    className="mt-6 rounded-2xl p-6 text-left"
                    style={infoCardStyle}
                  >
                    <dt
                      className="text-lg leading-6 font-medium"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      I found a bug / typo / confusing explanation, what do I do?
                    </dt>
                    <dd className="mt-2">
                      <p
                        className="text-base leading-6"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        Tell us! Hit "Contact Us" at the top of the page, or email{' '}
                        <a
                          href="mailto:contact@usamoguide.com"
                          style={linkStyle}
                        >
                          contact@usamoguide.com
                        </a>
                        . If you're comfortable with GitHub, you can also open an issue directly on our{' '}
                        <a
                          href="https://github.com/usamoguide/usamo-guide"
                          target="_blank"
                          rel="noreferrer"
                          style={linkStyle}
                        >
                          GitHub repository
                        </a>
                        {' '}, It's often the fastest way to get something fixed.
                      </p>
                    </dd>
                  </div>
                  <div
                    className="mt-6 rounded-2xl p-6 text-left"
                    style={infoCardStyle}
                  >
                    <dt
                      className="text-lg leading-6 font-medium"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      I want live classes or one-on-one tutoring...
                    </dt>
                    <dd className="mt-2">
                      <p
                        className="text-base leading-6"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        That's not really what we do.. We're a self-paced resource. For live instruction, AoPS runs solid online classes. If you still want structure and other people around, join one of our study groups or hop into a weekly mock contest for practice under real conditions.
                      </p>
                    </dd>
                  </div>
                </div>
                <div className="mt-6 md:mt-0">
                  <div
                    className="rounded-2xl p-6 text-left"
                    style={infoCardStyle}
                  >
                    <dt
                      className="text-lg leading-6 font-medium"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      Do I need to already be good at math / qualified for USAMO to use this?
                    </dt>
                    <dd className="mt-2">
                      <p
                        className="text-base leading-6"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        Not even close. Start on day one of AMC 8 prep or show up already grinding toward USAMO, either way, there's a place for you here. The material ramps from the basics up to olympiad-level, so you can jump in wherever you actually are.
                      </p>
                    </dd>
                  </div>
                  <div
                    className="mt-6 rounded-2xl p-6 text-left"
                    style={infoCardStyle}
                  >
                    <dt
                      className="text-lg leading-6 font-medium"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      Where can I get help when I'm stuck?
                    </dt>
                    <dd className="mt-2">
                      <p
                        className="text-base leading-6"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        Our{' '}
                        <a
                          href="https://discord.gg/X2zx6u53XH"
                          target="_blank"
                          rel="noreferrer"
                          style={linkStyle}
                        >
                          Discord
                        </a>{' '}
                        is the best place. People are usually around to help with a specific problem or concept. Beyond that, you can join a study group, get paired with a mentor, or just email us if it's a question about the guide itself.
                      </p>
                    </dd>
                  </div>
                  <div
                    className="mt-6 rounded-2xl p-6 text-left"
                    style={infoCardStyle}
                  >
                    <dt
                      className="text-lg leading-6 font-medium"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      How can I contribute?
                    </dt>
                    <dd className="mt-2">
                      <p
                        className="text-base leading-6"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        Please do. Fix a typo, rewrite a confusing explanation, add a problem, improve a diagram, clean up some code - it all helps. Head to our{' '}
                        <a
                          href="https://github.com/usamoguide/usamo-guide"
                          target="_blank"
                          rel="noreferrer"
                          style={linkStyle}
                        >
                          GitHub
                        </a>{' '}
                        for contribution guidelines and open issues.
                      </p>
                    </dd>
                  </div>
                  <div
                    className="mt-6 rounded-2xl p-6 text-left"
                    style={infoCardStyle}
                  >
                    <dt
                      className="text-lg leading-6 font-medium"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      Is this open source?
                    </dt>
                    <dd className="mt-2">
                      <p
                        className="text-base leading-6"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        Yes, all of it! Fork it, build on it, poke around and see how it works. Nothing's hidden. 
                        (Attribution required + Commerical use not allowed.)
                      </p>
                    </dd>
                  </div>
                </div>
              </dl>
            </RevealSection>
          </div>
        </div>
      </div>
      {/*End FAQ*/}

      {/* Footer: dark bg + vanilla text */}
      <div style={{ background: PAGE_BG }}>
        <div className="mx-auto max-w-(--breakpoint-xl) px-4 py-12">
          <p
            className="text-center text-base leading-6"
            style={{ color: TEXT_MUTED }}
          >
            &copy; {new Date().getFullYear()} USAMO Guide.
            <br />
            No part of this website may be reproduced or commercialized in any
            manner without prior written permission.{' '}
            <Link to="https://usamoguide.com/license.txt" style={linkStyle}>
              License
            </Link>
            {' | '}
            <Link to="/privacy-policy" style={linkStyle}>
              Privacy Policy
            </Link>
            {' | '}
            <Link to="/terms-of-service" style={linkStyle}>
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
