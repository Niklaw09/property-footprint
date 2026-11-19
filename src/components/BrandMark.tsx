interface BrandMarkProps {
  className?: string;
}

/** House with a magnifier: the HomePrint mark. */
export default function BrandMark({ className = 'h-9 w-9' }: BrandMarkProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="hp-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a2a3d" />
          <stop offset="1" stopColor="#0f1b2b" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#hp-bg)" />
      <path d="M10 20L20 11.5L30 20" stroke="#43b190" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 19V29H27.5V19" stroke="#f4f7f8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="22.5" r="4" stroke="#43b190" strokeWidth="2.5" />
      <path d="M27 25.5L30 28.5" stroke="#43b190" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
