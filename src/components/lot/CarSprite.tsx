interface CarSpriteProps {
  color: string
  className?: string
}

/** Top-down car, front pointing up. */
export function CarSprite({ color, className }: CarSpriteProps) {
  return (
    <svg viewBox="0 0 40 72" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="car-shine" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.25" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {/* shadow */}
      <rect x="3" y="4" width="36" height="66" rx="10" fill="#000" opacity="0.35" />
      {/* wheels */}
      <rect x="0" y="12" width="5" height="12" rx="2" fill="#111" />
      <rect x="35" y="12" width="5" height="12" rx="2" fill="#111" />
      <rect x="0" y="50" width="5" height="12" rx="2" fill="#111" />
      <rect x="35" y="50" width="5" height="12" rx="2" fill="#111" />
      {/* body */}
      <rect x="2" y="2" width="36" height="67" rx="10" fill={color} />
      <rect x="2" y="2" width="36" height="67" rx="10" fill="url(#car-shine)" />
      {/* windshield, roof, rear window */}
      <path d="M8 22 Q20 15 32 22 L30 30 H10 Z" fill="#0f172a" opacity="0.85" />
      <rect x="10" y="31" width="20" height="18" rx="3" fill="#000" opacity="0.12" />
      <path d="M10 50 H30 L32 57 Q20 62 8 57 Z" fill="#0f172a" opacity="0.75" />
      {/* headlights and tail lights */}
      <rect x="6" y="4" width="8" height="3" rx="1.5" fill="#fef9c3" />
      <rect x="26" y="4" width="8" height="3" rx="1.5" fill="#fef9c3" />
      <rect x="6" y="65" width="8" height="2.5" rx="1.2" fill="#dc2626" />
      <rect x="26" y="65" width="8" height="2.5" rx="1.2" fill="#dc2626" />
    </svg>
  )
}
