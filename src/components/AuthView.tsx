import React, { useState } from 'react';
import { User as UserIcon, Lock, ArrowRight, AlertCircle, Eye, EyeOff, UserPlus, Flame } from 'lucide-react';
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
  // Default to Login mode
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
    <div
      className={`min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans transition-colors duration-500 ${
        isRegister
          ? 'bg-gradient-to-b from-orange-100/70 via-amber-50/50 to-stone-100'
          : 'bg-gradient-to-b from-emerald-50/60 via-amber-50/30 to-stone-100'
      }`}
    >
      {/* Decorative background cute floating circles & stars */}
      <div
        className={`absolute top-10 left-10 w-36 h-36 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
          isRegister ? 'bg-orange-300/35' : 'bg-emerald-200/30'
        }`}
      />
      <div
        className={`absolute bottom-10 right-10 w-48 h-48 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
          isRegister ? 'bg-amber-300/35' : 'bg-amber-200/30'
        }`}
      />
      <div className="absolute top-1/4 right-8 text-2xl text-emerald-300 select-none animate-cute-float opacity-70 pointer-events-none">
        {isRegister ? '☀️' : '☁️'}
      </div>
      <div
        className="absolute bottom-1/4 left-8 text-2xl text-amber-300 select-none animate-cute-float opacity-70 pointer-events-none"
        style={{ animationDelay: '1.5s' }}
      >
        {isRegister ? '🔥' : '✨'}
      </div>

      {/* Brand Header with Mascot Logo */}
      <div className="text-center mb-3 z-10">
        <BesokLariLogo size="xl" animated showSubtitle={false} className="justify-center mb-1" />
        <p className="font-cute font-extrabold text-sm sm:text-base text-stone-600 flex items-center justify-center gap-1.5 mt-0.5">
          <span>Mulai Hari Ini, Jangan Wacana Melulu~</span>
          <span className={isRegister ? 'text-orange-600' : 'text-emerald-600'}>👟💨</span>
        </p>
      </div>

      {/* Main Interactive Cute Card with Differentiated Login vs Register Design */}
      <div
        className={`backdrop-blur-md rounded-3xl p-5 sm:p-7 max-w-md w-full relative z-10 transition-all duration-300 ${
          isRegister
            ? 'bg-gradient-to-b from-orange-50/50 via-white to-amber-50/30 border-2 border-orange-300 shadow-2xl shadow-orange-500/15 ring-4 ring-orange-100/70'
            : 'bg-white/95 border-2 border-emerald-200/90 shadow-xl shadow-emerald-600/10'
        }`}
      >

        {/* Animated Moving Mascot Stage (Customized dynamically for Register vs Login) */}
        <div className="py-0.5">
          <CuteRunnerAnimation
            mode={currentMascotMode}
            variant={isRegister ? 'register' : 'login'}
          />
        </div>

        {/* Dynamic Title Heading with Badge */}
        <div className="text-center mt-2 mb-4">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-cute font-extrabold border mb-1.5 ${
              isRegister
                ? 'bg-orange-100 text-orange-800 border-orange-200 animate-pulse'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
          >
            {isRegister ? (
              <>
                <UserPlus className="w-3.5 h-3.5 text-orange-600" />
                <span>PENDAFTARAN PELARI BARU</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-emerald-600" />
                <span>AREA MASUK PELARI</span>
              </>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-cute font-black text-stone-900">
            {isRegister ? 'Daftar Akun Pelari 👟✨' : 'Masuk ke Besok Lari 🏃'}
          </h2>
          <p className="text-xs font-cute font-semibold text-stone-500 mt-0.5">
            {isRegister
              ? 'Daftar mudah sekali, langsung siap ikut challenge lari!'
              : 'Masukkan username & password akun kamu'}
          </p>
        </div>

        {/* Error Alert with cute icon */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-cute font-bold flex items-start gap-2.5 animate-cute-pop">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <div>{errorMsg}</div>
              {errorMsg.includes('Password') && username.trim().toLowerCase() === 'dafasr' && (
                <div className="mt-1.5 pt-1.5 border-t border-rose-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setPassword('dafa1234');
                      setErrorMsg(null);
                    }}
                    className="text-emerald-700 hover:text-emerald-800 underline font-black cursor-pointer text-xs"
                  >
                    👉 Klik di sini untuk gunakan password "dafa1234"
                  </button>
                </div>
              )}
              {errorMsg.includes('belum terdaftar') && !isRegister && (
                <div className="mt-1.5 pt-1.5 border-t border-rose-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setErrorMsg(null);
                    }}
                    className="text-emerald-700 hover:text-emerald-800 underline font-black cursor-pointer text-xs"
                  >
                    👉 Belum punya akun? Klik di sini untuk Daftar
                  </button>
                </div>
              )}
              {errorMsg.includes('sudah terdaftar') && isRegister && (
                <div className="mt-1.5 pt-1.5 border-t border-rose-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setErrorMsg(null);
                    }}
                    className="text-emerald-700 hover:text-emerald-800 underline font-black cursor-pointer text-xs"
                  >
                    👉 Sudah pernah daftar? Klik di sini untuk Masuk
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auth Form: Username & Password Only */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-cute font-extrabold uppercase tracking-wider text-stone-700 mb-1.5">
              {isRegister ? 'Pilih Username Pelari Kamu' : 'Username Pelari'}
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
                className={`w-full text-sm font-semibold rounded-2xl border-2 p-3 pl-10 pr-4 transition-all placeholder:text-stone-400 placeholder:font-normal focus:bg-white focus:outline-none ${
                  isRegister
                    ? 'border-orange-200 bg-orange-50/20 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15'
                    : 'border-stone-200 bg-stone-50/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15'
                }`}
              />
              <UserIcon
                className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${
                  isRegister ? 'text-orange-400 group-focus-within:text-orange-500' : 'text-stone-400 group-focus-within:text-emerald-500'
                }`}
              />
            </div>
            <p className="text-[11px] font-cute text-stone-500 mt-1 pl-1">
              {isRegister ? 'Username ini akan menjadi nama BIB kamu di leaderboard' : 'Ketik username yang sudah kamu daftarkan'}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-cute font-extrabold uppercase tracking-wider text-stone-700">
                {isRegister ? 'Buat Password Akun' : 'Password'}
              </label>
              {focusedField === 'password' && (
                <span
                  className={`text-[10px] font-cute font-bold animate-pulse ${
                    isRegister ? 'text-orange-600' : 'text-emerald-600'
                  }`}
                >
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
                className={`w-full text-sm font-semibold rounded-2xl border-2 p-3 pl-10 pr-10 transition-all placeholder:text-stone-400 placeholder:font-normal focus:bg-white focus:outline-none ${
                  isRegister
                    ? 'border-orange-200 bg-orange-50/20 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15'
                    : 'border-stone-200 bg-stone-50/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15'
                }`}
              />
              <Lock
                className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${
                  isRegister ? 'text-orange-400 group-focus-within:text-orange-500' : 'text-stone-400 group-focus-within:text-emerald-500'
                }`}
              />
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

          {/* Submit Action Button with Distinct Colors & Copy */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 px-6 rounded-2xl active:scale-98 disabled:opacity-50 text-white font-cute font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 hover:-translate-y-0.5 ${
              isRegister
                ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 hover:from-orange-600 hover:via-amber-600 hover:to-rose-600 shadow-lg shadow-orange-500/30 ring-2 ring-orange-300/40'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 shadow-lg shadow-emerald-600/25'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isRegister ? 'Mendaftarkan Akun Baru...' : 'Memproses Masuk...'}</span>
              </span>
            ) : (
              <>
                <span>{isRegister ? 'DAFTAR SEBAGAI PELARI BARU 👟✨' : 'MASUK KE BESOK LARI 🏃'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>


        {/* Bottom Toggle Link */}
        <div className="mt-4 pt-3 border-t border-stone-100 text-center">
          <p className="text-xs font-cute text-stone-500">
            {isRegister ? (
              <span>
                Sudah punya akun pelari?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setErrorMsg(null);
                  }}
                  className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                >
                  Masuk di sini ➔
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
                  Daftar di sini ➔
                </button>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Cute Footer Tagline */}
      <div className="text-center mt-5 text-stone-400 text-xs font-cute font-semibold flex items-center gap-2">
        <span>🏃 lari tipis-tipis</span>
        <span>·</span>
        <span>🔥 bakar kalori</span>
        <span>·</span>
        <span>✨ tanpa wacana</span>
      </div>
    </div>
  );
};
