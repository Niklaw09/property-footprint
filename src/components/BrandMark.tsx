interface BrandMarkProps {
  className?: string;
}

export default function BrandMark({ className = 'h-9 w-9' }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="8" fill="#1f3d5e" />
      <path
        d="M10 20L20 11.5L30 20"
        stroke="#82a96f"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 19V29H27.5V19"
        stroke="#faf7f0"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="22.5" r="4" stroke="#82a96f" strokeWidth="2.5" />
      <path
        d="M27 25.5L30 28.5"
        stroke="#82a96f"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
