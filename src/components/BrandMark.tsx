import logoUrl from '../assets/LOGO.png';

/**
 * Meridex brand mark cropped from LOGO.png (500×500): the compass emblem is
 * measured at x 180–319 / y 142–279 (28%×27%, center 50%/42%), so the image is
 * scaled to 300% and offset to frame just the emblem inside the circle.
 */
interface BrandMarkProps {
  /** Circle size classes, e.g. "h-9 w-9". */
  className?: string;
  alt?: string;
}

export default function BrandMark({ className = 'h-9 w-9', alt = 'Meridex' }: BrandMarkProps) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full ${className}`}>
      <img
        src={logoUrl}
        alt={alt}
        draggable={false}
        className="absolute max-w-none select-none"
        style={{ width: '300%', left: '50%', top: '-76%', transform: 'translateX(-50%)' }}
      />
    </span>
  );
}
