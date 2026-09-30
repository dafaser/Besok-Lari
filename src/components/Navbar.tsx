import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Footprints,
  Users,
  Trophy,
  User as UserIcon,
  CheckSquare,
  Plus,
  LogOut,
  RotateCcw,
  ChevronDown,
  Flame,
  Bell,
  X,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';
import { BesokLariLogo } from './BesokLariLogo';

export type TabType =
  | 'dashboard'
  | 'my-runs'
  | 'groups'
  | 'leaderboard'
  | 'profile'
  | 'manage-groups'
  | 'pending-approvals';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAddRun: () => void;
  onResetDemo: () => void;
  pendingApprovalsCount: number;
  availableUsers?: User[];
  onSwitchUser?: (username: string) => void;
  hasCreatedGroups?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  onOpenAddRun,
  onResetDemo,
  pendingApprovalsCount,
  availableUsers = [],
  onSwitchUser,
  hasCreatedGroups = false,
}) => {
  const isCreator = currentUser?.role === 'CREATOR' || hasCreatedGroups;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <>
      {/* Top Header - Mobile-first compact & touch-friendly */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Brand Logo & Name "Besok Lari" with Cute Mascot */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="cursor-pointer group select-none hover:opacity-95 active:scale-98 transition-transform"
          >
            <BesokLariLogo size="sm" animated />
          </div>

          {/* Desktop/Tablet Navigation Links (hidden on mobile phones) */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-700 font-extrabold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onSelectTab('groups')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                currentTab === 'groups' || currentTab === 'manage-groups'
                  ? 'bg-emerald-50 text-emerald-700 font-extrabold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Challenges</span>
            </button>

            <button
              onClick={() => onSelectTab('leaderboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                currentTab === 'leaderboard'
                  ? 'bg-emerald-50 text-emerald-700 font-extrabold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => onSelectTab('my-runs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                currentTab === 'my-runs'
                  ? 'bg-emerald-50 text-emerald-700 font-extrabold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Footprints className="w-4 h-4" />
              <span>My Runs</span>
            </button>

            {isCreator && (
              <button
                onClick={() => onSelectTab('pending-approvals')}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  currentTab === 'pending-approvals'
                    ? 'bg-amber-50 text-amber-700 font-extrabold'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <CheckSquare className="w-4 h-4 text-amber-600" />
                <span>Approvals</span>
                {pendingApprovalsCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Right Header Actions (Both Mobile & Desktop) */}
          <div className="flex items-center gap-2">
            {/* Mobile pending approvals quick button for Creator */}
            {isCreator && (
              <button
                onClick={() => onSelectTab('pending-approvals')}
                className={`relative p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentTab === 'pending-approvals'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
                title="Pending Approvals"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Approvals</span>
                {pendingApprovalsCount > 0 && (
                  <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center -mr-1 animate-pulse">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}

            {/* Desktop Add Run button */}
            <button
              onClick={onOpenAddRun}
              className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ LOG RUN</span>
            </button>

            {/* User Profile & Account Switcher Dropdown (Tap-friendly for Phone) */}
            {currentUser && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-1 sm:p-1.5 sm:pl-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-xs font-bold text-stone-700 transition-colors cursor-pointer select-none"
                  aria-label="User menu"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      className="w-7 h-7 rounded-full object-cover border border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      {currentUser.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[70px] sm:max-w-[90px] truncate text-xs font-black">
                    {currentUser.username}
                  </span>
                  {isCreator && (
                    <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded-md hidden xs:inline">
                      HOST
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mobile Dropdown / Sheet */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-2.5 border-b border-stone-100 flex items-center gap-2.5">
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.username}
                          className="w-9 h-9 rounded-xl object-cover border border-emerald-500/30 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                          {currentUser.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden flex-1">
                        <div className="text-xs font-black text-stone-900 truncate">{currentUser.name || currentUser.username}</div>
                        <div className="text-[10px] text-stone-500 font-mono">@{currentUser.username}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTab('profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-stone-700 hover:bg-stone-50 active:bg-stone-100 flex items-center gap-2 font-bold transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-stone-500" />
                      <span>Profil Saya & Pengaturan</span>
                    </button>

                    <div className="h-px bg-stone-100 my-1.5" />

                    <button
                      onClick={() => {
                        onResetDemo();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 flex items-center gap-2 font-medium"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Demo Data</span>
                    </button>

                    <button
                      onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Handphone Bottom Navigation Bar - Optimized for Mobile Thumb Reach */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/90 px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-around select-none">
        {/* 1. Home / Beranda */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-90 ${
            currentTab === 'dashboard'
              ? 'text-emerald-600 font-black'
              : 'text-stone-600 hover:text-stone-700'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${currentTab === 'dashboard' ? 'bg-emerald-50' : ''}`}>
            <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="mt-0.5 tracking-tight">Home</span>
        </button>

        {/* 2. Challenges */}
        <button
          onClick={() => onSelectTab('groups')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-90 ${
            currentTab === 'groups' || currentTab === 'manage-groups'
              ? 'text-emerald-600 font-black'
              : 'text-stone-600 hover:text-stone-700'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${currentTab === 'groups' || currentTab === 'manage-groups' ? 'bg-emerald-50' : ''}`}>
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="mt-0.5 tracking-tight">Challenges</span>
        </button>

        {/* 3. Center Prominent Floating Action Button "+ RUN" */}
        <div className="relative -top-5 flex flex-col items-center px-1">
          <button
            onClick={onOpenAddRun}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 active:scale-90 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 border-4 border-white transition-all cursor-pointer"
            aria-label="Log Run"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
          <span className="text-[10px] font-black text-emerald-700 tracking-tight mt-0.5">
            + RUN
          </span>
        </div>

        {/* 4. Leaderboard */}
        <button
          onClick={() => onSelectTab('leaderboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-90 ${
            currentTab === 'leaderboard'
              ? 'text-emerald-600 font-black'
              : 'text-stone-600 hover:text-stone-700'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${currentTab === 'leaderboard' ? 'bg-emerald-50' : ''}`}>
            <Trophy className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="mt-0.5 tracking-tight">Leaderboard</span>
        </button>

        {/* 5. My Runs */}
        <button
          onClick={() => onSelectTab('my-runs')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-90 ${
            currentTab === 'my-runs'
              ? 'text-emerald-600 font-black'
              : 'text-stone-600 hover:text-stone-700'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${currentTab === 'my-runs' ? 'bg-emerald-50' : ''}`}>
            <Footprints className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="mt-0.5 tracking-tight">My Runs</span>
        </button>
      </nav>
    </>
  );
};
