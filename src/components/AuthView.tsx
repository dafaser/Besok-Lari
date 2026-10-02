import React, { useState } from 'react';
import { User as UserIcon, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { BesokLariLogo } from './BesokLariLogo';
import { CuteRunnerAnimation, RunnerAnimMode } from './CuteRunnerAnimation';

interface AuthViewProps {
  onLogin: (username: string, password?: string) => Promise<User>;
  onRegister: (username: string, password?: string, role?: 'USER' | 'CREATOR') => Promise<User>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  onRegister,
  onShowToast,
}) => {
  // Default to Login mode as requested
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Focus state for interactive cute runner animation
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);

  // Compute active animation mode for the cute mascot
  const currentMascotMode: RunnerAnimMode =
    focusedField === 'password'
      ? 'peek'
      : focusedField === 'username' || username.length > 0
      ? 'typing-username'
      : 'running';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMsg('Masukkan username kamu dulu yuk!');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('Password minimal 4 karakter yaa biar aman.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        // Everyone registers as a standard runner by default.
        // Users become a host when they create a challenge!
        await onRegister(cleanUsername, password, 'USER');
        onShowToast(`Yeay! Selamat datang di Besok Lari, ${cleanUsername}! 🏃🎉`, 'success');
      } else {
        await onLogin(cleanUsername, password);
        onShowToast(`Halo ${cleanUsername}, selamat datang kembali! Siap lari? 👟✨`, 'success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isRegister ? 'Gagal mendaftar akun.' : 'Username atau password salah. Cek kembali ya!'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-amber-50/30 to-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Decorative background cute floating circles & stars */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-emerald-200/30 blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-44 h-44 rounded-full bg-amber-200/30 blur-2xl pointer-events-none" />
      <div className="absolute top-1/4 right-8 text-2xl text-emerald-300 select-none animate-cute-float opacity-70 pointer-events-none">
        ☁️
      </div>
      <div
        className="absolute bottom-1/4 left-8 text-2xl text-amber-300 select-none animate-cute-float opacity-70 pointer-events-none"
        style={{ animationDelay: '1.5s' }}
      >
        ✨
      </div>

      {/* Brand Header with Mascot Logo */}
      <div className="text-center mb-4 z-10">
        <BesokLariLogo size="xl" animated showSubtitle={false} className="justify-center mb-1" />
        <p className="font-cute font-extrabold text-sm sm:text-base text-stone-600 flex items-center justify-center gap-1.5 mt-0.5">
          <span>Mulai Hari Ini, Jangan Wacana Melulu~</span>
          <span className="text-emerald-600">👟💨</span>
        </p>
      </div>

      {/* Main Interactive Cute Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl shadow-stone-200/60 border-2 border-emerald-100 relative z-10 transition-all">
        {/* Animated Moving Mascot Stage */}
        <div className="py-1">
          <CuteRunnerAnimation
            mode={currentMascotMode}
            speechText={
              focusedField === 'password'
                ? 'Psst, mataku ditutup kok! Rahasia aman~ 🙈'
                : isRegister
                ? 'Yuk daftar! Jadi pelari kece mulai hari ini 🏃‍♀️'
                : 'Hai kamu! Udah siap bakar kalori hari ini? 🔥'
            }
          />
        </div>

        {/* Clean Title Heading */}
        <div className="text-center mt-2 mb-4">
          <h2 className="text-base sm:text-lg font-cute font-black text-stone-900">
            {isRegister ? 'Daftar Akun Baru 👟' : 'Masuk ke Besok Lari 🏃'}
          </h2>
          <p className="text-xs font-cute text-stone-500 mt-0.5">
            {isRegister
              ? 'Daftar mudah dengan username & password'
              : 'Masukkan username & password akun kamu'}
          </p>
        </div>

        {/* Error Alert with cute icon */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-cute font-bold flex items-center gap-2 animate-cute-pop">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Form: Username & Password Only */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-cute font-extrabold uppercase tracking-wider text-stone-700 mb-1.5">
              Username Pelari
            </label>
            <div className="relative group">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                placeholder="Contoh: dafasr, bobbyrunner"
                required
                className="w-full text-sm font-semibold rounded-2xl border-2 border-stone-200 p-3 pl-10 pr-4 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all placeholder:text-stone-400 placeholder:font-normal"
              />
              <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <p className="text-[11px] font-cute text-stone-500 mt-1 pl-1">
              {isRegister ? 'Pilih username unik untuk akun kamu' : 'Ketik username yang sudah kamu daftarkan'}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-cute font-extrabold uppercase tracking-wider text-stone-700">
                Password
              </label>
              {focusedField === 'password' && (
                <span className="text-[10px] font-cute font-bold text-emerald-600 animate-pulse">
                  🙈 Masked for privacy
                </span>
              )}
            </div>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Minimal 4 karakter"
                required
                className="w-full text-sm font-semibold rounded-2xl border-2 border-stone-200 p-3 pl-10 pr-10 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all placeholder:text-stone-400 placeholder:font-normal"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 group-focus-within:text-emerald-500 transition-colors" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                title={showPassword ? 'Sembunyikan' : 'Lihat'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-98 disabled:opacity-50 text-white font-cute font-black text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-5 hover:-translate-y-0.5"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isRegister ? 'Mendaftarkan Akun...' : 'Memproses Masuk...'}</span>
              </span>
            ) : (
              <>
                <span>{isRegister ? 'DAFTAR SEKARANG 👟' : 'MASUK KE BESOK LARI 🏃'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Small Bottom Link as requested: "Belum punya akun? Daftar di sini" */}
        <div className="mt-5 pt-3.5 border-t border-stone-100 text-center">
          <p className="text-xs font-cute text-stone-500">
            {isRegister ? (
              <span>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setErrorMsg(null);
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Masuk di sini
                </button>
              </span>
            ) : (
              <span>
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setErrorMsg(null);
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Daftar di sini
                </button>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Cute Footer Tagline */}
      <div className="text-center mt-6 text-stone-400 text-xs font-cute font-semibold flex items-center gap-2">
        <span>🏃 lari tipis-tipis</span>
        <span>·</span>
        <span>🔥 bakar kalori</span>
        <span>·</span>
        <span>✨ tanpa wacana</span>
      </div>
    </div>
  );
};
