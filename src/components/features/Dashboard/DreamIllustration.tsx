import { useId } from 'react';

/** Ilustração vetorial do banner inferior: pôr do sol, palmeiras e avião. */
export function DreamIllustration({ className = '' }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg
      viewBox="0 0 320 240"
      preserveAspectRatio="xMaxYMax slice"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b21b6" stopOpacity="0" />
          <stop offset="0.45" stopColor="#a21caf" stopOpacity="0.55" />
          <stop offset="0.75" stopColor="#ec4899" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fb923c" />
        </linearGradient>
        <radialGradient id={`${uid}sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff7ed" />
          <stop offset="0.35" stopColor="#fdba74" />
          <stop offset="0.7" stopColor="#f97316" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c1d6f" />
          <stop offset="1" stopColor="#1e0b3a" />
        </linearGradient>
        <linearGradient id={`${uid}plane`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ddd6fe" />
        </linearGradient>
      </defs>

      <rect width="320" height="240" fill={`url(#${uid}sky)`} />

      {/* Sol */}
      <circle cx="210" cy="178" r="70" fill={`url(#${uid}sun)`} opacity="0.9" />
      <circle cx="210" cy="178" r="34" fill="#fed7aa" />
      <g stroke="#f97316" strokeWidth="3" opacity="0.55">
        <line x1="176" y1="170" x2="244" y2="170" />
        <line x1="178" y1="178" x2="242" y2="178" />
      </g>

      {/* Mar */}
      <rect x="0" y="182" width="320" height="58" fill={`url(#${uid}sea)`} />
      <g stroke="#fbcfe8" strokeLinecap="round" opacity="0.55">
        <line x1="178" y1="192" x2="242" y2="192" strokeWidth="2" />
        <line x1="188" y1="202" x2="232" y2="202" strokeWidth="2" />
        <line x1="198" y1="212" x2="222" y2="212" strokeWidth="1.5" />
        <line x1="60" y1="200" x2="110" y2="200" strokeWidth="1" opacity="0.5" />
      </g>

      {/* Palmeiras */}
      <g fill="#1a0b2e">
        <path d="M286 240 C284 205 280 170 268 132 L273 131 C286 170 292 205 294 240 Z" />
        <path d="M270 132 C252 116 228 116 214 128 C232 120 252 124 268 136 Z" />
        <path d="M270 132 C258 108 260 92 270 80 C266 98 268 114 274 130 Z" />
        <path d="M270 132 C286 110 306 104 320 110 C302 112 288 120 276 134 Z" />
        <path d="M270 132 C292 128 310 138 318 152 C304 142 288 138 274 138 Z" />
        <path d="M270 132 C250 132 236 146 232 160 C242 148 256 140 272 138 Z" />

        <path d="M314 240 C314 216 312 196 306 176 L310 175 C316 196 320 216 320 240 Z" />
        <path d="M308 176 C298 166 284 166 276 172 C288 168 298 172 306 180 Z" />
        <path d="M308 176 C316 162 320 158 320 158 L320 172 C316 172 312 176 310 180 Z" />
      </g>

      {/* Avião */}
      <g transform="translate(150 54) rotate(-14)">
        <path
          d="M0 18 C20 12 70 6 100 8 C110 9 112 15 104 18 C80 24 30 28 2 26 Z"
          fill={`url(#${uid}plane)`}
        />
        <path d="M40 16 L74 -14 L84 -12 L64 18 Z" fill="#ede9fe" />
        <path d="M44 22 L70 46 L80 44 L62 22 Z" fill="#ddd6fe" />
        <path d="M2 18 L-8 2 L4 2 L14 16 Z" fill="#ede9fe" />
        <g fill="#a78bfa">
          <circle cx="78" cy="14" r="2" />
          <circle cx="70" cy="15" r="2" />
          <circle cx="62" cy="16" r="2" />
          <circle cx="54" cy="16.5" r="2" />
        </g>
      </g>
      <path
        d="M40 96 C80 80 120 74 150 72"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeDasharray="2 6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
