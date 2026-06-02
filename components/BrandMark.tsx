// The HerdFlow brand mark — a cute cow face on a sage tile. Used as both the
// site logo (nav + landing) and the favicon (app/icon.svg mirrors this), so the
// brand is consistent everywhere.

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <rect width="32" height="32" rx="8" fill="#3a5a40" />
      <ellipse cx="9.5" cy="12.5" rx="3.2" ry="2.2" fill="#f0f0e8" transform="rotate(-25 9.5 12.5)" />
      <ellipse cx="22.5" cy="12.5" rx="3.2" ry="2.2" fill="#f0f0e8" transform="rotate(25 22.5 12.5)" />
      <ellipse cx="16" cy="17" rx="8" ry="7" fill="#f0f0e8" />
      <circle cx="13" cy="15.4" r="1.4" fill="#3a5a40" />
      <circle cx="19" cy="15.4" r="1.4" fill="#3a5a40" />
      <ellipse cx="16" cy="20.6" rx="5" ry="3.3" fill="#e6dccd" />
      <circle cx="14.2" cy="20.7" r="0.85" fill="#7a5230" />
      <circle cx="17.8" cy="20.7" r="0.85" fill="#7a5230" />
    </svg>
  );
}
