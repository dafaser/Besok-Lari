import React, { useState } from 'react';
import { User as UserIcon, Lock, Sparkles, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { User } from '../types';

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
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('DAFASR');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'USER' | 'CREATOR'>('USER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Please enter a username.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        await onRegister(username.trim(), password, role);
        onShowToast(`Welcome to Besok Lari, ${username}!`, 'success');
      } else {
        await onLogin(username.trim(), password);
        onShowToast(`Hey ${username}, welcome back!`, 'success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoAccount = (name: string, isCreatorRole = false) => {
    setUsername(name);
    setPassword('password123');
    setIsRegister(false);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4">
      {/* Brand logo & title */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30 mb-3">
          BL
        </div>
        <h1 className="text-3xl font-black tracking-tight text-stone-900 font-sans">
          BESOK <span className="text-emerald-600">LARI</span>
        </h1>
        <p className="text-xs text-stone-600 font-bold uppercase tracking-wider mt-1">
          Start Today, Don't Wait For Tomorrow!
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-stone-200">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
            }}
            className={`font-black text-base pb-2 transition-colors border-b-2 -mb-4.5 cursor-pointer ${
              !isRegister
                ? 'border-emerald-600 text-stone-900'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
            }}
            className={`font-black text-base pb-2 transition-colors border-b-2 -mb-4.5 cursor-pointer ${
              isRegister
                ? 'border-emerald-600 text-stone-900'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. DAFASR"
                required
                className="w-full text-sm font-semibold rounded-xl border border-stone-300 p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
              <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 4 characters"
                required
                className="w-full text-sm font-semibold rounded-xl border border-stone-300 p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer ${
                    role === 'USER'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>🏃 Runner (User)</span>
                  <span className="text-[10px] text-stone-600 font-normal">Join & log runs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('CREATOR')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer ${
                    role === 'CREATOR'
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>👑 Group Host</span>
                  <span className="text-[10px] text-stone-600 font-normal">Create & approve</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isRegister ? 'SIGN UP NOW' : 'LOG IN TO BESOK LARI'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-6 pt-5 border-t border-stone-100">
          <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-2 text-center">
            ⚡ Quick Test Accounts (Password: <code className="text-emerald-700 font-mono">password123</code>):
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => selectDemoAccount('DAFASR', true)}
              className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 text-xs font-bold text-stone-800 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="block text-emerald-800 font-black text-sm">DAFASR</span>
                <span className="text-[9px] bg-emerald-200 text-emerald-900 font-extrabold px-1.5 py-0.5 rounded-sm">
                  Creator 👑
                </span>
              </div>
              <span className="text-[10px] text-stone-600 font-normal">Challenge Host & Reviewer</span>
            </button>

            <button
              type="button"
              onClick={() => selectDemoAccount('Budi')}
              className="p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-800 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="block text-sky-800 font-black text-sm">Budi</span>
                <span className="text-[9px] bg-stone-200 text-stone-700 font-extrabold px-1.5 py-0.5 rounded-sm">
                  Runner 🏃
                </span>
              </div>
              <span className="text-[10px] text-stone-600 font-normal">Active Challenger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
