import LandingHero, { type HeroTarget } from '../components/LandingHero';
import Footer from '../components/Footer';

interface LandingPageProps {
  onNavigate: (target: HeroTarget) => void;
}

/** Landing page — fullscreen video hero; the terminal lives on its own route. */
export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div>
      <LandingHero onNavigate={onNavigate} />
      <div className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6">
        <Footer />
      </div>
    </div>
  );
}
