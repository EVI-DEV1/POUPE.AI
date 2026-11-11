import { useId } from 'react';

interface AIAssistantMascotProps {
  className?: string;
  /** Desativa a flutuação (ex.: em listas pequenas). */
  still?: boolean;
}

/**
 * Mascote do Assistente Poupe.ai — robô amigável em SVG (sem dependência de
 * imagens externas). A flutuação respeita `prefers-reduced-motion`.
 */
export function AIAssistantMascot({ className = '', still = false }: AIAssistantMascotProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <div className={`relative ${className}`} aria-hidden>
      <div className="absolute inset-[12%] rounded-full bg-[#a855f7]/45 blur-3xl" />
      <svg
        viewBox="0 0 240 260"
        className={`relative h-full w-full drop-shadow-[0_20px_30px_rgba(76,29,149,0.55)] ${still ? '' : 'animate-float'}`}
      >
        <defs>
          <linearGradient id={`${uid}shell`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#ece6ff" />
            <stop offset="1" stopColor="#bfaaf5" />
          </linearGradient>
          <linearGradient id={`${uid}shell-side`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#b79cf6" stopOpacity="0.7" />
            <stop offset="0.35" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.8" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#9b7cf0" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={`${uid}visor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#241a52" />
            <stop offset="1" stopColor="#07061a" />
          </linearGradient>
          <linearGradient id={`${uid}purple`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c084fc" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
          <radialGradient id={`${uid}glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#f5d0fe" />
            <stop offset="0.45" stopColor="#c084fc" />
            <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}eye-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Antena */}
        <line
          x1="120"
          y1="18"
          x2="120"
          y2="40"
          stroke="#d8cdfb"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="120" cy="14" r="14" fill={`url(#${uid}glow)`} />
        <circle cx="120" cy="14" r="6" fill="#f5f3ff" />

        {/* Braço esquerdo */}
        <path
          d="M70 168 C52 176 44 196 50 214 C53 222 64 222 66 213 C69 199 74 189 84 182 Z"
          fill={`url(#${uid}shell)`}
        />
        <ellipse cx="57" cy="217" rx="11" ry="10" fill="#e6defd" />

        {/* Corpo */}
        <path
          d="M74 160 C74 150 90 144 120 144 C150 144 166 150 166 160 L162 214 C160 236 142 248 120 248 C98 248 80 236 78 214 Z"
          fill={`url(#${uid}shell)`}
        />
        <path
          d="M74 160 C74 150 90 144 120 144 C150 144 166 150 166 160 L162 214 C160 236 142 248 120 248 C98 248 80 236 78 214 Z"
          fill={`url(#${uid}shell-side)`}
        />
        <ellipse cx="120" cy="152" rx="38" ry="6" fill="#8b6fe0" opacity="0.35" />

        {/* Emblema porquinho */}
        <circle cx="120" cy="200" r="24" fill={`url(#${uid}purple)`} />
        <circle
          cx="120"
          cy="200"
          r="24"
          fill="none"
          stroke="#e9d5ff"
          strokeOpacity="0.6"
          strokeWidth="2"
        />
        <g fill="#f3e8ff">
          <ellipse cx="121" cy="203" rx="13" ry="10" />
          <path d="M110 196 l-2 -8 l7 4 Z" />
          <path d="M126 193 l5 -6 l1 8 Z" />
          <rect x="112" y="210" width="4" height="6" rx="2" />
          <rect x="125" y="210" width="4" height="6" rx="2" />
        </g>
        <ellipse cx="131" cy="204" rx="4.5" ry="3.5" fill="#c084fc" />
        <circle cx="116" cy="200" r="1.6" fill="#5b21b6" />

        {/* Braço direito com joinha */}
        <path
          d="M164 166 C178 160 188 150 192 136 C194 128 204 128 205 137 C206 154 194 172 172 182 Z"
          fill={`url(#${uid}shell)`}
        />
        <g>
          <rect x="188" y="110" width="26" height="26" rx="10" fill="#efe9ff" />
          <rect x="196" y="92" width="11" height="24" rx="5.5" fill="#ffffff" />
          <path
            d="M190 118 h22 M190 125 h22"
            stroke="#c4b5fd"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Fones laterais */}
        <rect x="26" y="70" width="26" height="56" rx="13" fill={`url(#${uid}purple)`} />
        <rect x="188" y="70" width="26" height="56" rx="13" fill={`url(#${uid}purple)`} />
        <rect x="31" y="80" width="6" height="36" rx="3" fill="#e9d5ff" opacity="0.6" />
        <rect x="203" y="80" width="6" height="36" rx="3" fill="#e9d5ff" opacity="0.6" />

        {/* Cabeça */}
        <rect x="40" y="36" width="160" height="120" rx="58" fill={`url(#${uid}shell)`} />
        <rect x="40" y="36" width="160" height="120" rx="58" fill={`url(#${uid}shell-side)`} />
        <path
          d="M78 46 C96 39 140 38 162 46"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* Visor */}
        <rect x="58" y="58" width="124" height="80" rx="38" fill={`url(#${uid}visor)`} />
        <rect
          x="58"
          y="58"
          width="124"
          height="80"
          rx="38"
          fill="none"
          stroke="#a78bfa"
          strokeOpacity="0.45"
          strokeWidth="2"
        />
        <path
          d="M76 70 C92 63 120 62 140 64"
          stroke="#ffffff"
          strokeOpacity="0.18"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Rosto */}
        <g
          filter={`url(#${uid}eye-glow)`}
          stroke="#e0f7ff"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M86 100 Q96 86 106 100" />
          <path d="M134 100 Q144 86 154 100" />
          <path d="M108 114 Q120 126 132 114" strokeWidth="6" />
        </g>
        <circle cx="80" cy="116" r="6" fill="#f472b6" opacity="0.35" />
        <circle cx="160" cy="116" r="6" fill="#f472b6" opacity="0.35" />
      </svg>

      {/* Brilhos */}
      <svg viewBox="0 0 24 24" className="absolute left-[4%] top-[18%] h-5 w-5 text-[#e9d5ff]">
        <path
          d="M12 2 L13.6 10.4 L22 12 L13.6 13.6 L12 22 L10.4 13.6 L2 12 L10.4 10.4 Z"
          fill="currentColor"
        />
      </svg>
      <svg viewBox="0 0 24 24" className="absolute right-[2%] top-[42%] h-3 w-3 text-[#c4b5fd]">
        <path
          d="M12 2 L13.6 10.4 L22 12 L13.6 13.6 L12 22 L10.4 13.6 L2 12 L10.4 10.4 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
