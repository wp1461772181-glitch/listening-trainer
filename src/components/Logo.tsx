export default function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      aria-label="Listening Trainer logo"
    >
      <rect x="0" y="54" width="10" height="18" rx="4" fill="currentColor" opacity="0.6" />
      <rect x="15.5" y="38" width="10" height="34" rx="4" fill="currentColor" opacity="0.8" />
      <rect x="31" y="18" width="10" height="54" rx="4" fill="currentColor" />
      <rect x="31" y="54" width="10" height="18" rx="4" fill="currentColor" opacity="0.8" />
      <rect x="46.5" y="54" width="10" height="18" rx="4" fill="currentColor" opacity="0.6" />
      <rect x="62" y="54" width="10" height="18" rx="4" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
