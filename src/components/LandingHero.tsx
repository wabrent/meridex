import type { MouseEvent } from 'react';
import BrandMark from './BrandMark';

/**
 * Landing hero for Meridex — full-bleed video, two glass pill navs,
 * bottom-left copy stack. Structure & micro-interactions follow the user's
 * reference spec exactly; visual language is the Raycast dark restyle
 * (#040506 canvas, hairline #363739 glass pills, Mist CTA, ash/white type).
 *
 * All copy is binary-options themed and every link scrolls into the terminal.
 */

export type HeroTarget = 'terminal' | 'live' | 'pons' | 'history' | 'dex';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4';

const HASH: Record<HeroTarget, string> = {
  terminal: '#/terminal',
  live: '#/terminal/live',
  pons: '#/terminal/pons',
  history: '#/terminal/history',
  dex: '#/dex',
};

const NAV: { label: string; target: HeroTarget }[] = [
  { label: 'Terminal', target: 'terminal' },
  { label: 'Rounds', target: 'live' },
  { label: 'Swap', target: 'dex' },
  { label: '$OPTION', target: 'pons' },
  { label: 'History', target: 'history' },
];

interface LandingHeroProps {
  onNavigate: (target: HeroTarget) => void;
}

export default function LandingHero({ onNavigate }: LandingHeroProps) {
  const go = (target: HeroTarget) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate(target);
  };

  return (
    <section className="relative z-10 min-h-screen overflow-hidden bg-[#040506]">
      {/* Fullscreen autoplaying background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Atmospheric scrim — keeps the near-black canvas dominant and the
          bottom-left copy legible over any video frame. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#040506] via-[#040506]/35 to-[#040506]/55"
      />

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar — two separate glass pills */}
        <nav className="flex items-center justify-center pt-4 sm:pt-6 px-4 sm:px-8 gap-2 sm:gap-3">
          {/* Left circular logo container */}
          <a
            href={HASH.terminal}
            onClick={go('terminal')}
            aria-label="Meridex home"
            className="flex items-center justify-center rounded-full w-10 h-10 sm:w-11 sm:h-11 shrink-0 backdrop-blur-[48px] border border-[#363739] transition-colors hover:border-[#4d4e50]"
            style={{ backgroundColor: 'rgba(7, 8, 10, 0.65)' }}
          >
            <BrandMark className="h-full w-full" />
          </a>

          {/* Right pill container */}
          <div
            className="flex items-center gap-4 sm:gap-10 rounded-xl px-4 sm:px-8 py-2.5 sm:py-3 backdrop-blur-[48px] border border-[#363739]"
            style={{ backgroundColor: 'rgba(7, 8, 10, 0.65)' }}
          >
            {NAV.map((link) => (
              <a
                key={link.label}
                href={HASH[link.target]}
                onClick={go(link.target)}
                className="text-[12px] sm:text-[14px] font-medium text-[#9c9c9d] hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Hero content — bottom-left aligned */}
        <div className="flex-1 flex items-end pb-10 sm:pb-16 lg:pb-20 px-6 sm:px-12 md:px-20 lg:px-28">
          <div className="max-w-xs">
            {/* 1. Badge link */}
            <a
              href={HASH.terminal}
              onClick={go('terminal')}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#9c9c9d] hover:text-white transition-colors mb-3 group"
            >
              Live on Robinhood Chain
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </a>

            {/* 2. Headline */}
            <h1 className="text-[1.5rem] sm:text-[1.75rem] leading-[1.15] font-medium text-white tracking-tight mb-3">
              Binary options for people who trade the next minute.
            </h1>

            {/* 3. Subtext */}
            <p className="text-[13px] text-[#9c9c9d] font-normal mb-3">
              Up or down. 60 seconds. 1.95x.
            </p>

            {/* 4. CTA — neutral Mist fill on hover (no chromatic CTAs) */}
            <a
              href={HASH.terminal}
              onClick={go('terminal')}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-[#e6e6e6] border border-[#363739] rounded-full px-5 py-2.5 hover:bg-[#e6e6e6] hover:text-[#454647] hover:border-[#e6e6e6] transition-all duration-200 group"
            >
              Open the terminal
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
