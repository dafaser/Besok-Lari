import React from 'react';

export type RunnerAnimMode = 'running' | 'typing-username' | 'peek' | 'cheer';

interface CuteRunnerAnimationProps {
  mode?: RunnerAnimMode;
  variant?: 'login' | 'register';
  speechText?: string;
  className?: string;
}

export const CuteRunnerAnimation: React.FC<CuteRunnerAnimationProps> = ({
  mode = 'running',
  variant = 'login',
  speechText,
  className = '',
}) => {
  const isRegister = variant === 'register';

  // Determine speech bubble text based on mode and variant if not explicitly provided
  const bubbleText =
    speechText ||
    (isRegister
      ? mode === 'peek'
        ? 'Mataku ditutup kok! Rahasia akun baru aman~ 🙈'
        : mode === 'typing-username'
        ? 'Wuih! Nama bib pelari ini bakal mejeng di leaderboard 🏅'
        : mode === 'cheer'
        ? 'Yeay! Pendaftaran siap, selamat bergabung! 🎉'
        : 'Yuk daftar! Taklukkan target KM pertama kamu bareng kita! 👟🔥'
      : mode === 'peek'
      ? 'Tenang, mataku ditutup kok! Rahasia aman~ 🙈'
      : mode === 'typing-username'
      ? 'Wah nama pelari kece nih! Siap gas? ✨'
      : mode === 'cheer'
      ? 'Horeee! Semangat pantang kendor! 🎉'
      : 'Besok lari? Hari ini dong, jangan wacana! 👟💨');

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Playful Floating Speech Bubble */}
      <div className="relative mb-2 max-w-[270px] text-center z-10 transition-all duration-300">
        <div
          className={`bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border-2 text-xs font-cute font-extrabold text-stone-800 animate-cute-float ${
            isRegister
              ? 'border-orange-300/90 shadow-md shadow-orange-500/10'
              : 'border-emerald-300/80 shadow-md shadow-emerald-500/10'
          }`}
        >
          <span>{bubbleText}</span>
        </div>
        {/* Cute Speech Bubble Tail */}
        <div
          className={`w-3 h-3 bg-white border-r-2 border-b-2 rotate-45 mx-auto -mt-1.5 shadow-xs ${
            isRegister ? 'border-orange-300/90' : 'border-emerald-300/80'
          }`}
        />
      </div>

      {/* Mascot Runner Stage Container */}
      <div className="relative w-52 h-36 flex items-center justify-center">
        {/* Floating particles: Celebration sparkles for register vs dust puffs for running */}
        {isRegister ? (
          <>
            <div className="absolute top-2 left-5 text-amber-500 text-sm animate-bounce" style={{ animationDuration: '1.2s' }}>
              ⭐
            </div>
            <div className="absolute top-3 right-6 text-orange-500 text-sm animate-pulse" style={{ animationDuration: '0.8s' }}>
              ✨
            </div>
            <div className="absolute bottom-5 right-5 text-rose-500 text-xs animate-bounce" style={{ animationDuration: '1.6s' }}>
              👟
            </div>
            <div className="absolute bottom-6 left-5 text-amber-400 text-xs animate-pulse" style={{ animationDuration: '1.1s' }}>
              🏅
            </div>
          </>
        ) : (
          mode !== 'peek' && (
            <div className="absolute left-6 bottom-4 pointer-events-none">
              <span
                className="inline-block w-3.5 h-3.5 rounded-full bg-stone-300/80"
                style={{ animation: 'dust-puff 0.7s infinite ease-out' }}
              />
              <span
                className="inline-block w-2.5 h-2.5 rounded-full bg-stone-200/90 ml-1"
                style={{ animation: 'dust-puff 0.7s infinite 0.25s ease-out' }}
              />
              <span
                className="inline-block w-2 h-2 rounded-full bg-stone-300/70"
                style={{ animation: 'dust-puff 0.7s infinite 0.45s ease-out' }}
              />
            </div>
          )
        )}

        {/* Floating sweat drop or excitement stars */}
        {!isRegister && mode === 'running' && (
          <div
            className="absolute top-4 right-10 pointer-events-none"
            style={{ animation: 'cute-sweat 1.2s infinite ease-out' }}
          >
            <span className="text-sky-400 text-sm font-bold">💧</span>
          </div>
        )}
        {mode === 'cheer' && (
          <div className="absolute top-2 left-8 text-amber-400 text-sm animate-bounce">
            ✨
          </div>
        )}

        {/* The SVG Mascot Runner Character */}
        <div
          className={`w-32 h-32 transition-transform duration-300 ${
            mode === 'cheer'
              ? 'animate-bounce'
              : mode === 'peek'
              ? 'scale-105'
              : isRegister
              ? 'animate-cute-warmup'
              : 'animate-cute-bounce'
          }`}
        >
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Soft Shadow on the ground */}
            <ellipse
              cx="60"
              cy="112"
              rx={isRegister ? "38" : "34"}
              ry="5"
              fill={isRegister ? "#FED7AA" : "#E2E8F0"}
              opacity="0.85"
            />

            {/* Back Leg (Right) with running or stretching stance */}
            <g
              style={{
                transformOrigin: '68px 78px',
                animation: mode !== 'peek' ? (isRegister ? 'cute-leg-right 1.2s infinite ease-in-out' : 'cute-leg-right 0.65s infinite ease-in-out') : 'none',
              }}
            >
              {/* Thigh & Calves */}
              <path d="M68 78 L76 96 L82 106" stroke="#FED7AA" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              {/* Back Sneaker */}
              <ellipse cx="88" cy="108" rx="8" ry="4.5" fill={isRegister ? "#F59E0B" : "#3B82F6"} />
              <path d="M82 108 L95 108" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="85" cy="106" r="1.5" fill="#FFFFFF" />
            </g>

            {/* Mascot Chubby Body */}
            <ellipse cx="58" cy="68" rx="24" ry="22" fill="#FFFBEB" />

            {/* Running Singlet / Athletic Jersey */}
            <path
              d="M40 60 C40 50, 76 50, 76 60 C76 76, 72 84, 58 84 C44 84, 40 76, 40 60 Z"
              fill={isRegister ? "#F97316" : "#10B981"}
            />
            {/* Singlet Trim */}
            <path d="M47 52 Q58 58 69 52" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Cute badge on jersey: Star for Register, BL for Login */}
            <text x="58" y="72" fontSize="9" fontWeight="900" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
              {isRegister ? '★' : 'BL'}
            </text>

            {/* Front Leg (Left) */}
            <g
              style={{
                transformOrigin: '50px 78px',
                animation: mode !== 'peek' ? (isRegister ? 'cute-leg-left 1.2s infinite ease-in-out' : 'cute-leg-left 0.65s infinite ease-in-out') : 'none',
              }}
            >
              {/* Thigh & Calves */}
              <path d="M50 78 L40 94 L32 105" stroke="#FED7AA" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              {/* Front Sneaker */}
              <ellipse cx="28" cy="107" rx="9" ry="5" fill={isRegister ? "#EC4899" : "#EF4444"} />
              <path d="M22 107 L36 107" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="28" cy="105" r="1.5" fill="#FFFFFF" />
            </g>

            {/* Back Arm (Right) pumping or stretching */}
            <g
              style={{
                transformOrigin: '70px 58px',
                animation:
                  mode === 'peek'
                    ? 'none'
                    : isRegister
                    ? 'cute-warmup-arm-right 1.2s infinite ease-in-out'
                    : 'cute-arm-right 0.65s infinite ease-in-out',
              }}
            >
              <path
                d={isRegister ? "M70 58 L85 45 L92 36" : "M70 58 L85 64 L90 56"}
                stroke="#FED7AA"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Back cute paw/fist */}
              <circle cx={isRegister ? "92" : "90"} cy={isRegister ? "35" : "55"} r="5" fill="#FDBA74" />
            </g>

            {/* Mascot Head & Face */}
            <g className={mode === 'typing-username' ? 'animate-cute-wiggle' : ''}>
              {/* Ears */}
              <ellipse cx="44" cy="22" rx="8" ry="11" fill="#FED7AA" transform="rotate(-15 44 22)" />
              <ellipse cx="44" cy="22" rx="4.5" ry="7" fill="#F472B6" transform="rotate(-15 44 22)" opacity="0.8" />
              <ellipse cx="74" cy="22" rx="8" ry="11" fill="#FED7AA" transform="rotate(15 74 22)" />
              <ellipse cx="74" cy="22" rx="4.5" ry="7" fill="#F472B6" transform="rotate(15 74 22)" opacity="0.8" />

              {/* Head Base */}
              <ellipse cx="58" cy="40" rx="25" ry="22" fill="#FFFBEB" />

              {/* Sporty Headband / Sweatband */}
              <path
                d="M36 33 C46 29, 70 29, 80 33 C82 34, 82 38, 80 39 C70 35, 46 35, 36 39 C34 38, 34 34, 36 33 Z"
                fill={isRegister ? "#F59E0B" : "#FF6B6B"}
              />
              <path
                d="M42 33 C52 30, 64 30, 74 33"
                stroke={isRegister ? "#FEF3C7" : "#FEE2E2"}
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* Fluttering headband ribbons */}
              <path
                d="M79 34 C86 32, 91 35, 95 38 C92 40, 87 39, 80 37 Z"
                fill={isRegister ? "#D97706" : "#EE5253"}
              />
              <path
                d="M78 36 C85 37, 88 42, 91 46 C88 46, 84 43, 79 39 Z"
                fill={isRegister ? "#F59E0B" : "#FF6B6B"}
              />

              {/* Rosy Cheeks */}
              <ellipse cx="42" cy="47" rx="5" ry="3" fill="#F472B6" opacity="0.75" />
              <ellipse cx="74" cy="47" rx="5" ry="3" fill="#F472B6" opacity="0.75" />

              {/* Tiny Nose */}
              <ellipse cx="58" cy="45" rx="2.5" ry="1.8" fill="#4B5563" />

              {/* Mouth */}
              {mode === 'peek' ? (
                // Playful O mouth when peeking
                <circle cx="58" cy="50" r="3.5" fill="#EF4444" />
              ) : (
                // Happy big smile
                <path
                  d="M52 48 Q58 55 64 48"
                  stroke="#4B5563"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="#F87171"
                />
              )}

              {/* EYES LOGIC */}
              {mode === 'peek' ? (
                <>
                  <path d="M46 41 Q50 37 54 41" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M62 41 Q66 37 70 41" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </>
              ) : (
                <>
                  {/* Left Eye */}
                  <ellipse cx="48" cy="41" rx="4.5" ry="5.5" fill="#1F2937" />
                  <circle cx="46.5" cy="39" r="1.8" fill="#FFFFFF" />
                  <circle cx="49.5" cy="42.5" r="1" fill="#FFFFFF" />

                  {/* Right Eye */}
                  <ellipse cx="68" cy="41" rx="4.5" ry="5.5" fill="#1F2937" />
                  <circle cx="66.5" cy="39" r="1.8" fill="#FFFFFF" />
                  <circle cx="69.5" cy="42.5" r="1" fill="#FFFFFF" />
                </>
              )}
            </g>

            {/* Front Arm (Left) or Paws covering eyes during peek */}
            {mode === 'peek' ? (
              <g className="animate-pulse">
                <circle cx="48" cy="43" r="6" fill="#FED7AA" stroke="#FDBA74" strokeWidth="1" />
                <circle cx="68" cy="43" r="6" fill="#FED7AA" stroke="#FDBA74" strokeWidth="1" />
                <path d="M46 41 L46 45 M50 41 L50 45" stroke="#F97316" strokeWidth="1" strokeLinecap="round" />
                <path d="M66 41 L66 45 M70 41 L70 45" stroke="#F97316" strokeWidth="1" strokeLinecap="round" />
              </g>
            ) : (
              <g
                style={{
                  transformOrigin: '48px 60px',
                  animation: isRegister
                    ? 'cute-warmup-arm-left 1.2s infinite ease-in-out'
                    : 'cute-arm-left 0.65s infinite ease-in-out',
                }}
              >
                <path
                  d={isRegister ? "M48 60 L32 45 L25 36" : "M48 60 L32 66 L26 58"}
                  stroke="#FED7AA"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={isRegister ? "25" : "26"} cy={isRegister ? "35" : "57"} r="5" fill="#FDBA74" />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Moving Track / Starting Line */}
      <div
        className={`w-60 h-3.5 rounded-full overflow-hidden relative shadow-inner border -mt-2 transition-all ${
          isRegister
            ? 'bg-orange-100 border-orange-300'
            : 'bg-emerald-100 border-emerald-200'
        }`}
      >
        <div className={`w-full h-full ${isRegister ? 'animate-track-register' : 'animate-track'}`} />
      </div>

      {/* Playful speed marks / status text */}
      <div className="flex items-center gap-1.5 mt-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isRegister ? 'bg-orange-500 animate-ping' : 'bg-emerald-500 animate-ping'
          }`}
        />
        <span
          className={`text-[11px] font-cute font-extrabold tracking-wide ${
            isRegister ? 'text-orange-700' : 'text-emerald-700'
          }`}
        >
          {isRegister
            ? mode === 'peek'
              ? 'Privasi Akun Baru Aman 🙈'
              : mode === 'typing-username'
              ? 'Siap Cetak Nomor Dada! 🎽'
              : 'Pemanasan Pelari Baru 🧘‍♂️✨'
            : mode === 'peek'
            ? 'Mode Rahasia 🙈'
            : mode === 'typing-username'
            ? 'Semangat Lari! ⚡'
            : 'Pace Santuy & Ceria 🏃‍♂️'}
        </span>
      </div>
    </div>
  );
};
