export function HoneyIcon({ className }: { className?: string }) {
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
      {/* Head with friendly face */}
      <circle cx="12" cy="10" r="5" />
      {/* Smile */}
      <path d="M8 10a4 4 0 0 0 8 0" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="10" cy="9" r="0.8" fill="currentColor" />
      <circle cx="14" cy="9" r="0.8" fill="currentColor" />
      {/* Hair/Head accessory - decorative */}
      <path d="M7 6c1-1 3-1 5 0s3 1 5 0" />
      {/* Body/Neck */}
      <path d="M12 15v3" />
      {/* Decorative element */}
      <circle cx="12" cy="18" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}












