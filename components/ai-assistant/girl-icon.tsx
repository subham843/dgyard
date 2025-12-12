export function GirlIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Head */}
      <circle cx="12" cy="8" r="4" />
      {/* Body */}
      <path d="M12 12v6" />
      <path d="M8 16l4-2 4 2" />
      {/* Hair/Head accessory */}
      <path d="M8 6c0-1.5 1.5-2 4-2s4 .5 4 2" />
    </svg>
  );
}












