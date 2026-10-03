import React, { useState } from 'react';
import {
  Flame,
  Clock,
  Plus,
  Trophy,
  CheckCircle2,
  Calendar,
  Users,
  Footprints,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  Check,
  X,
  Share2,
  Trash2,
} from 'lucide-react';
import { Group, Activity, LeaderboardEntry, UserStats, GroupProgressStats, User } from '../types';
import { CountdownTimer } from './CountdownTimer';
import { ConfirmationModal } from './ConfirmationModal';
import { formatDeadline } from '../utils/dateUtils';
import { BesokLariLogo } from './BesokLariLogo';

interface DashboardViewProps {
  currentUser: User;
  activeGroup: Group | null;
  activeGroupStats: GroupProgressStats | null;
  activeLeaderboard: LeaderboardEntry[];
  userStats: UserStats | null;
  userActiveProgressKm: number;
  recentApprovedActivities: Activity[];
  otherGroups: Group[];
  pendingApprovals: Activity[];
  onOpenAddRun: () => void;
  onViewChallenge: (groupId: string) => void;
  onOpenPendingApprovals: () => void;
  onApproveActivity: (activity: Activity) => void;
  onRejectActivity: (activity: Activity) => void;
  onViewPhoto: (activity: Activity) => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: (initialCode?: string) => void;
  onDeleteGroup?: (groupId: string) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  activeGroup,
  activeGroupStats,
  activeLeaderboard,
  userStats,
  userActiveProgressKm,
  recentApprovedActivities,
  otherGroups,
  pendingApprovals,
  onOpenAddRun,
  onViewChallenge,
  onOpenPendingApprovals,
  onApproveActivity,
  onRejectActivity,
  onViewPhoto,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onDeleteGroup,
}) => {
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCreator = Boolean(activeGroup && activeGroup.creatorId === currentUser.id);
  const isMember = Boolean(activeGroup?.isMember || (activeGroup && activeGroup.creatorId === currentUser.id));
  const targetKm = activeGroup?.targetKm || 10;
  const progressPercent = Math.min(100, Math.round((userActiveProgressKm / targetKm) * 100));
  const isCompleted = userActiveProgressKm >= targetKm;
  const remainingKm = Math.max(0, Number((targetKm - userActiveProgressKm).toFixed(1)));

  // Current user ranking in leaderboard
  const userRankEntry = activeLeaderboard.find((e) => e.userId === currentUser.id);

  // Time of day greeting in casual Indonesian
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete || !onDeleteGroup) return;
    setIsDeleting(true);
    try {
      await onDeleteGroup(groupToDelete.id);
    } finally {
      setIsDeleting(false);
      setGroupToDelete(null);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24 md:pb-12">
      {/* Header Banner - Cute & Energetic Styling */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white p-5 sm:p-6 rounded-3xl shadow-lg shadow-emerald-700/15 relative overflow-hidden border border-emerald-400/40">
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-cute font-extrabold border border-white/25">
              <span>☕</span>
              <span>Besok Lari · Coffe menanti</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-cute font-black tracking-tight text-white flex items-center gap-2">
              <span>{getGreeting()}, {currentUser.username}!</span>
              <span className="animate-cute-wiggle inline-block">👋</span>
            </h1>
            <p className="text-emerald-50 text-xs font-cute font-semibold">
              Besok lari? Hari ini aja yuk, biar ga cuma wacana! 👟💨
            </p>
          </div>

          <div className="hidden sm:block shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center p-1 border border-white/30 shadow-inner">
              <BesokLariLogo size="md" variant="icon" animated />
            </div>
          </div>
        </div>
      </div>

      {/* Running Summary Cards (2x2 Grid for Smartphone Ergonomics) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
            TOTAL DISTANCE
          </span>
          <div className="text-2xl font-black text-stone-900 font-mono mt-0.5">
            {userStats ? userStats.totalKm : 0} <span className="text-xs font-bold text-emerald-600">KM</span>
          </div>
          <span className="text-[10px] text-stone-500 font-medium">Verified Distance</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
            TOTAL RUNS
          </span>
          <div className="text-2xl font-black text-stone-900 font-mono mt-0.5">
            {userStats ? userStats.totalRuns : 0} <span className="text-xs font-bold text-stone-500">runs</span>
          </div>
          <span className="text-[10px] text-stone-500 font-medium">Recorded Sessions</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
            GOALS HIT
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
            {userStats ? userStats.challengesCompleted : 0} <span className="text-xs font-bold text-emerald-600">groups</span>
          </div>
          <span className="text-[10px] text-stone-500 font-medium">Completed Challenges</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
            ACTIVE STREAK
          </span>
          <div className="text-2xl font-black text-amber-700 font-mono mt-0.5 flex items-center gap-1">
            <span>🔥</span>
            <span>{userStats ? userStats.currentStreak : 0}</span>
            <span className="text-xs font-bold text-stone-500">days</span>
          </div>
          <span className="text-[10px] text-stone-500 font-medium">Keep it going!</span>
        </div>
      </div>

      {/* ACTIVE CHALLENGE CARD */}
      {activeGroup ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-md p-5 sm:p-6 relative overflow-hidden">
          <div className="flex flex-col gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  ACTIVE CHALLENGE
                </span>
                <span className="text-[11px] font-bold text-stone-500">
                  {formatDeadline(activeGroup.deadline)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                🏃 {activeGroup.name.toUpperCase()}
              </h2>
              <p className="text-xs text-stone-600 mt-1 line-clamp-2">{activeGroup.description}</p>
            </div>

            {/* Action Buttons for Active Challenge */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => onViewChallenge(activeGroup.id)}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 active:bg-stone-100 font-bold text-xs text-stone-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* Delete Active Challenge Button strictly for its Creator */}
              {isCreator && onDeleteGroup && (
                <button
                  type="button"
                  onClick={() => setGroupToDelete(activeGroup)}
                  className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-xs font-black text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete this challenge"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="my-4">
            <CountdownTimer deadline={activeGroup.deadline} startDate={activeGroup.startDate} />
          </div>

          {/* Personal KM Progress & Add Run */}
          {!isMember ? (
            <div className="bg-amber-50/90 rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-2xs">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      Not Joined Yet
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                      Code: {activeGroup.inviteCode}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-stone-900 mt-1.5">
                    Join this Challenge to Log Runs
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Punch in invite code <span className="font-mono font-bold text-stone-900">{activeGroup.inviteCode}</span> to compete on the leaderboard and track your KM!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenJoinGroup(activeGroup.inviteCode)}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>JOIN WITH THIS CODE NOW</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                    MY PROGRESS
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-stone-900">
                      {userActiveProgressKm}
                    </span>
                    <span className="text-sm font-bold text-stone-500">
                      / {targetKm} KM
                    </span>
                    {userRankEntry && (
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Rank #{userRankEntry.rank}
                      </span>
                    )}
                  </div>
                </div>

                {/* Big prominent ADD RUN button */}
                <button
                  onClick={onOpenAddRun}
                  className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs shadow-md shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ LOG RUN (KM)</span>
                </button>
              </div>

              {/* Cute Progress Bar with Moving Sneaker */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-cute font-bold text-stone-600">
                  <span className="flex items-center gap-1">
                    <span>{progressPercent}% Goal Tercapai</span>
                    {isCompleted && <span>🎉</span>}
                  </span>
                  <span>{remainingKm > 0 ? `Kurang ${remainingKm} KM lagi!` : '🔥 Target Selesai, Keren!'}</span>
                </div>
                <div className="relative h-4 w-full bg-stone-100 rounded-full p-0.5 border border-stone-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                  {/* Floating Sneaker Icon at current progress */}
                  <div
                    className="absolute -top-1.5 text-base transition-all duration-700 pointer-events-none -ml-2"
                    style={{ left: `${Math.min(96, Math.max(3, progressPercent))}%` }}
                  >
                    👟
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State when no group is active - Cute Mascot */
        <div className="bg-white rounded-3xl border-2 border-emerald-100 p-6 sm:p-8 text-center shadow-md shadow-emerald-500/5">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center p-2 shadow-xs">
              <BesokLariLogo size="lg" variant="icon" animated />
            </div>
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-cute font-extrabold border border-amber-200 mb-2">
            ✨ Waktunya Pasang Sepatu!
          </div>
          <h3 className="text-lg font-cute font-black text-stone-900">Belum Ada Challenge Aktif</h3>
          <p className="text-xs font-cute font-semibold text-stone-500 max-w-md mx-auto mt-1 mb-5 leading-relaxed">
            Yuk mulai lari bareng teman-teman! Gabung challenge pakai kode undangan atau buat tantangan lari baru untuk grup kamu~
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              onClick={() => onOpenJoinGroup()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border-2 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50 active:scale-95 text-xs font-cute font-extrabold text-stone-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🔑 Masukkan Kode Undangan</span>
            </button>
            <button
              onClick={onOpenCreateGroup}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-cute font-black shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>+ Buat Challenge Baru 👟</span>
            </button>
          </div>
        </div>
      )}

      {/* LEADERBOARD SNAPSHOT */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
              LEADERBOARD SNAPSHOT
            </h3>
          </div>
          {activeGroup && (
            <button
              onClick={() => onViewChallenge(activeGroup.id)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
            >
              <span>View Full</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeLeaderboard.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-500">
            No approved runs yet. Be the first to hit the pavement!
          </div>
        ) : (
          <div className="space-y-2">
            {activeLeaderboard.slice(0, 3).map((entry, idx) => {
              const isCurrentUser = entry.userId === currentUser.id;
              return (
                <div
                  key={entry.userId}
                  className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                    isCurrentUser
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/20'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 text-center text-base">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-800 font-black text-xs flex items-center justify-center">
                      {entry.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                        <span>{entry.username}</span>
                        {isCurrentUser && (
                          <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        {entry.approvedRunsCount} runs logged
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-700 font-mono">
                      {entry.totalApprovedKm} KM
                    </div>
                    {entry.isCompleted && (
                      <span className="text-[9px] font-bold text-emerald-600 block">
                        ✓ Finished
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECENT RUNS FEED */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
              RECENT ACTIVITIES
            </h3>
          </div>
          <span className="text-[10px] font-bold text-stone-500">Verified</span>
        </div>

        {recentApprovedActivities.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-500">
            No approved runs yet in this challenge.
          </div>
        ) : (
          <div className="space-y-2">
            {recentApprovedActivities.slice(0, 4).map((act) => {
              const runnerUsername =
                (act.username && act.username.toLowerCase() !== 'runner' && act.username.toLowerCase() !== 'pelari' ? act.username : '') ||
                (activeLeaderboard.find((l) => l.userId === act.userId)?.username) ||
                (act.userId === activeGroup?.creatorId ? (activeGroup?.creatorUsername || 'Host') : '') ||
                (act.userId === currentUser.id ? currentUser.username : '') ||
                'Pelari';

              return (
                <div
                  key={act.id}
                  className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                      {runnerUsername[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <div className="text-xs font-black text-stone-900">
                        {runnerUsername}
                      </div>
                      <div className="text-[10px] text-stone-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{act.date}</span>
                        <span>•</span>
                        <span>{act.durationMinutes} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-emerald-700">
                      +{act.distanceKm} KM
                    </span>
                    {act.photoUrl && (
                      <button
                        onClick={() => onViewPhoto(act)}
                        className="p-1 text-stone-400 hover:text-stone-700 bg-white rounded-lg border border-stone-200"
                        title="View Photo Proof"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deleting Active or Other Challenge */}
      {groupToDelete && (
        <ConfirmationModal
          isOpen={Boolean(groupToDelete)}
          onClose={() => setGroupToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete Challenge "${groupToDelete.name}"?`}
          message={`Are you sure you want to permanently delete "${groupToDelete.name}" (${groupToDelete.status === 'ACTIVE' ? 'Active' : 'Closed'})? All recorded distances, runner memberships, and running logs will be permanently erased.`}
          confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
          cancelText="Cancel"
          type="reject"
        />
      )}
    </div>
  );
};
