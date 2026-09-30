import React, { useState } from 'react';
import { User, UserStats, Achievement } from '../types';
import { Trophy, Flame, Footprints, Award, Calendar, CheckCircle2, ShieldCheck, Settings, Camera } from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';

interface ProfileViewProps {
  currentUser: User;
  stats: UserStats | null;
  achievements: Achievement[];
  hasCreatedGroups?: boolean;
  onOpenAddRun: () => void;
  onLogout: () => void;
  onUpdateProfile: (data: {
    username?: string;
    password?: string;
    avatar?: string | null;
  }) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const ALL_ACHIEVEMENT_DEFINITIONS = [
  {
    type: 'FIRST_RUN',
    title: 'First Run',
    description: 'Finished and got your very first run approved!',
    icon: '🏃',
  },
  {
    type: 'TARGET_ACHIEVED',
    title: 'Target Achieved',
    description: 'Crushed your KM distance goal in a challenge.',
    icon: '🎯',
  },
  {
    type: '3_DAY_STREAK',
    title: '3 Day Streak',
    description: 'Logged runs 3 days in a row without missing a beat.',
    icon: '🔥',
  },
  {
    type: '7_DAY_STREAK',
    title: '7 Day Streak',
    description: '7 days in a row! True dedication.',
    icon: '⚡',
  },
  {
    type: 'EARLY_BIRD',
    title: 'Early Bird',
    description: 'Clocked a morning run before 7:00 AM.',
    icon: '🌅',
  },
  {
    type: 'NIGHT_RUNNER',
    title: 'Night Runner',
    description: 'Finished a night run after 8:00 PM.',
    icon: '🌙',
  },
  {
    type: 'CHALLENGE_FINISHER',
    title: 'Challenge Finisher',
    description: 'Crossed the finish line of a challenge group.',
    icon: '🏆',
  },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  stats,
  achievements,
  hasCreatedGroups,
  onOpenAddRun,
  onLogout,
  onUpdateProfile,
  onShowToast,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isHost = hasCreatedGroups || currentUser.role === 'CREATOR';

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24 md:pb-12">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Avatar with click to edit */}
          <div
            className="relative group shrink-0 cursor-pointer"
            onClick={() => setIsEditModalOpen(true)}
            title="Klik untuk ubah foto profil"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-md border-2 border-emerald-500 ring-2 ring-emerald-500/20"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
                {currentUser.username[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/45 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold">
              <Camera className="w-4 h-4 mb-0.5" />
              <span>Ubah</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">{currentUser.username}</h1>
              {isHost ? (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  👑 GROUP HOST
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  🏃 RUNNER
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Member since {new Date(currentUser.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons: Edit Profile & Logout */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-xs font-bold text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-stone-500" />
            <span>Edit Profil</span>
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-600 hover:text-rose-600 transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Edit Profile Settings Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        currentUser={currentUser}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateProfile={onUpdateProfile}
        onShowToast={onShowToast}
      />

      {/* Running Statistics Grid (Rule 21) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <h3 className="text-base font-black text-stone-900 mb-4 uppercase tracking-wider">
          RUNNING STATISTICS
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {/* Total KM */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-xs font-bold text-stone-500 uppercase block">Total Distance</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-1">
              {stats ? stats.totalKm : 0} <span className="text-xs font-bold">KM</span>
            </div>
            <span className="text-[11px] text-stone-400">Verified Distance</span>
          </div>

          {/* Total Runs */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-xs font-bold text-stone-500 uppercase block">Total Runs</span>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono mt-1">
              {stats ? stats.totalRuns : 0}
            </div>
            <span className="text-[11px] text-stone-400">Completed Sessions</span>
          </div>

          {/* Challenges Joined */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-xs font-bold text-stone-500 uppercase block">Challenges Joined</span>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono mt-1">
              {stats ? stats.challengesJoined : 0}
            </div>
            <span className="text-[11px] text-stone-400">Groups Joined</span>
          </div>

          {/* Challenges Completed */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-xs font-bold text-stone-500 uppercase block">Goals Crushed</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-1">
              {stats ? stats.challengesCompleted : 0}
            </div>
            <span className="text-[11px] text-stone-400">Target Achieved 🎯</span>
          </div>

          {/* Longest Run */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-xs font-bold text-stone-500 uppercase block">Longest Run</span>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono mt-1">
              {stats ? stats.longestRun : 0} <span className="text-xs font-bold">KM</span>
            </div>
            <span className="text-[11px] text-stone-400">Personal Best</span>
          </div>

          {/* Current Streak */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-xs font-bold text-stone-500 uppercase block">Current Streak</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1 flex items-center gap-1.5">
              <span>🔥</span>
              <span>{stats ? stats.currentStreak : 0}</span>
              <span className="text-xs font-bold text-stone-600">days</span>
            </div>
            <span className="text-[11px] text-stone-400">Consecutive Days</span>
          </div>
        </div>
      </div>

      {/* Achievements Showcase (Rule 22) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-stone-900 uppercase tracking-wider">
              TROPHY ROOM & BADGES
            </h3>
            <p className="text-xs text-stone-500">
              Badges unlocked from your runs, goals, and daily streaks
            </p>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
            {achievements.length} / {ALL_ACHIEVEMENT_DEFINITIONS.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {ALL_ACHIEVEMENT_DEFINITIONS.map((def) => {
            const earned = achievements.find((a) => a.achievementType === def.type);
            return (
              <div
                key={def.type}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  earned
                    ? 'bg-gradient-to-r from-emerald-50/60 to-white border-emerald-300 shadow-2xs'
                    : 'bg-stone-50/50 border-stone-200 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    earned ? 'bg-emerald-100' : 'bg-stone-200'
                  }`}
                >
                  {def.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">{def.title}</span>
                    {earned && (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-sm">
                        UNLOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">{def.description}</p>
                  {earned && (
                    <span className="text-[10px] text-stone-400 block mt-1">
                      Unlocked on: {new Date(earned.earnedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
