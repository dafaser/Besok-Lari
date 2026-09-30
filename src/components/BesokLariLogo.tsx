import React from 'react';

interface BesokLariLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  animated?: boolean;
  className?: string;
  showSubtitle?: boolean;
}

export const BesokLariLogo: React.FC<BesokLariLogoProps> = ({
  size = 'md',
  variant = 'full',
  animated = false,
  className = '',
  showSubtitle = true,
}) => {
  // Dimensions based on size
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px] sm:text-[11px]',
    lg: 'text-xs sm:text-sm',
    xl: 'text-sm sm:text-base',
  };

  // SVG Mascot Runner Face / Icon
  const mascotIcon = (
    <div
      className={`relative select-none shrink-0 ${iconSizes[size]} ${
        animated ? 'hover:scale-110 active:scale-95 transition-transform duration-200' : ''
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full drop-shadow-md ${animated ? 'animate-cute-wiggle' : ''}`}
      >
        {/* Soft glowing background circle */}
        <circle cx="50" cy="50" r="46" fill="url(#bg-gradient)" />
        <circle cx="50" cy="50" r="44" stroke="#ffffff" strokeWidth="3" opacity="0.6" />

        {/* Cute Mascot Ears */}
        {/* Left Ear */}
        <ellipse cx="28" cy="24" rx="10" ry="14" fill="#FED7AA" transform="rotate(-15 28 24)" />
        <ellipse cx="28" cy="24" rx="6" ry="9" fill="#F472B6" transform="rotate(-15 28 24)" opacity="0.8" />

        {/* Right Ear */}
        <ellipse cx="72" cy="24" rx="10" ry="14" fill="#FED7AA" transform="rotate(15 72 24)" />
        <ellipse cx="72" cy="24" rx="6" ry="9" fill="#F472B6" transform="rotate(15 72 24)" opacity="0.8" />

        {/* Mascot Chubby Face */}
        <ellipse cx="50" cy="55" rx="36" ry="32" fill="#FFFBEB" />
        <path
          d="M16 54 C16 40, 84 40, 84 54 C84 75, 68 85, 50 85 C32 85, 16 75, 16 54 Z"
          fill="#FFFBEB"
        />

        {/* Headband / Sweatband */}
        <path
          d="M18 43 C32 37, 68 37, 82 43 C84 44, 84 49, 81 50 C67 45, 33 45, 19 50 C16 49, 16 44, 18 43 Z"
          fill="#FF6B6B"
        />
        <path
          d="M26 42.5 C40 38.5, 60 38.5, 74 42.5"
          stroke="#FEE2E2"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Headband knot ribbon flapping on right */}
        <path
          d="M80 44 C88 42, 93 45, 96 49 C93 51, 88 50, 81 48 Z"
          fill="#EE5253"
        />
        <path
          d="M79 46 C87 47, 91 52, 93 56 C90 57, 85 55, 80 50 Z"
          fill="#FF6B6B"
        />

        {/* Big sparkling cute anime eyes */}
        {/* Left eye */}
        <ellipse cx="37" cy="56" rx="5" ry="6.5" fill="#1F2937" />
        <circle cx="35" cy="54" r="2.2" fill="#FFFFFF" />
        <circle cx="39" cy="58" r="1.1" fill="#FFFFFF" />

        {/* Right eye - cheerful wink or matching cute eye */}
        <ellipse cx="63" cy="56" rx="5" ry="6.5" fill="#1F2937" />
        <circle cx="61" cy="54" r="2.2" fill="#FFFFFF" />
        <circle cx="65" cy="58" r="1.1" fill="#FFFFFF" />

        {/* Cute blush rosy cheeks */}
        <ellipse cx="26" cy="63" rx="6" ry="3.5" fill="#F472B6" opacity="0.65" />
        <ellipse cx="74" cy="63" rx="6" ry="3.5" fill="#F472B6" opacity="0.65" />

        {/* Cute tiny button nose */}
        <ellipse cx="50" cy="61" rx="2.5" ry="1.8" fill="#4B5563" />

        {/* Cheerful smiling mouth */}
        <path
          d="M44 65 Q50 72 56 65"
          stroke="#4B5563"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M46 66 Q50 72 54 66"
          fill="#F87171"
          opacity="0.9"
        />

        {/* Little sweat drop / energetic running sparkle */}
        <path
          d="M78 30 C78 30, 83 23, 85 27 C87 31, 82 34, 79 33 C78 32, 78 31, 78 30 Z"
          fill="#38BDF8"
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="bg-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="0.5" stopColor="#059669" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return mascotIcon;
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-xs ${className}`}>
        {mascotIcon}
        <div>
          <span className="font-cute font-extrabold text-sm text-emerald-900 tracking-tight flex items-center gap-1">
            BESOK <span className="text-emerald-600">LARI</span> 👟
          </span>
          {showSubtitle && (
            <span className="text-[10px] font-semibold text-emerald-700 block -mt-0.5">
              Bukan Cuma Wacana!
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {mascotIcon}
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`font-cute font-black tracking-tight text-stone-900 ${textSizes[size]}`}>
            BESOK <span className="text-emerald-600">LARI</span>
          </span>
          <span className="text-base sm:text-lg animate-cute-bounce inline-block" role="img" aria-label="running shoes">
            👟
          </span>
        </div>
        {showSubtitle && (
          <p className={`font-cute font-bold text-stone-500 tracking-wide uppercase ${subtitleSizes[size]} -mt-0.5`}>
            Start today, jangan wacana melulu!
          </p>
        )}
      </div>
    </div>
  );
};
