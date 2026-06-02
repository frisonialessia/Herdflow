// The HerdFlow brand mark — an "H" monogram over a little green farm. Used as
// both the site logo (nav + landing) and the favicon (app/icon.svg mirrors
// this), so the brand is consistent everywhere.

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <clipPath id="hfmark">
          <rect width="32" height="32" rx="8" />
        </clipPath>
      </defs>
      <g clipPath="url(#hfmark)">
        <rect width="32" height="32" fill="#3a5a40" />
        <path d="M0 21 Q9 17 17 20 Q25 23 32 19 L32 32 L0 32 Z" fill="#588157" />
        <path d="M0 25 Q10 21 19 24 Q26 26 32 24 L32 32 L0 32 Z" fill="#6b7d4f" />
        <rect x="5.5" y="19.5" width="4.5" height="4.5" fill="#7a5230" />
        <path d="M5.2 19.7 L7.75 17.1 L10.3 19.7 Z" fill="#8a4f32" />
        <rect x="11.6" y="7" width="3" height="15" rx="1.4" fill="#f0f0e8" />
        <rect x="17.4" y="7" width="3" height="15" rx="1.4" fill="#f0f0e8" />
        <rect x="11.6" y="13.1" width="8.8" height="2.8" rx="1.4" fill="#f0f0e8" />
      </g>
    </svg>
  );
}
