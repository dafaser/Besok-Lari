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

  // Time of day greeting in casual English
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
      {/* Header Banner - Mobile First */}
      <div className="bg-gradient-to-tr from-stone-900 via-stone-800 to-emerald-950 text-white p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            <span>Besok Lari Challenge</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {getGreeting()}, {currentUser.username}! 👋
          </h1>
          <p className="text-stone-300 text-xs font-medium">
            Ready to log your miles? Start today, not tomorrow!
          </p>
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

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-stone-600">
                  <span>{progressPercent}% Goal Completed</span>
                  <span>{remainingKm > 0 ? `${remainingKm} KM to go!` : '🎉 Target Crushed!'}</span>
                </div>
                <div className="h-3 w-full bg-stone-200 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State when no group is active */
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mx-auto mb-3">
            🏃
          </div>
          <h3 className="text-base font-black text-stone-900">No Active Challenge Yet</h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            Kickstart your running journey by joining a group challenge with an invite code or create a new one for your running crew!
          </p>
          <div className="flex items-center justify-center gap-2.5">
            <button
              onClick={() => onOpenJoinGroup()}
              className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 active:bg-stone-100 text-xs font-bold text-stone-700 transition-colors cursor-pointer"
            >
              + Enter Invite Code
            </button>
            <button
              onClick={onOpenCreateGroup}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              + Create New Challenge
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
            {recentApprovedActivities.slice(0, 4).map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                    {act.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-black text-stone-900">{act.username}</div>
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
            ))}
          </div>
        )}
      </div>

      {/* OTHER CHALLENGES (With Quick Delete for Creator) */}
      {otherGroups.length > 0 && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
              OTHER CHALLENGES
            </h3>
            <span className="text-[11px] font-bold text-stone-500">{otherGroups.length} challenges</span>
          </div>

          <div className="space-y-2.5">
            {otherGroups.map((grp) => {
              const isJoined = grp.isMember || grp.creatorId === currentUser.id;
              const isGrpCreator = grp.creatorId === currentUser.id;

              return (
                <div
                  key={grp.id}
                  onClick={() => onViewChallenge(grp.id)}
                  className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-400 bg-stone-50/50 hover:bg-emerald-50/20 active:scale-[0.99] cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                        {grp.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-emerald-700 font-mono">
                          {grp.targetKm} KM
                        </span>
                        {/* Delete button if creator */}
                        {isGrpCreator && onDeleteGroup && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGroupToDelete(grp);
                            }}
                            className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                            title="Delete this challenge"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-600 line-clamp-1">{grp.description}</p>
                    <div className="text-[10px] text-stone-500 font-mono mt-1">
                      Code: <span className="font-bold text-stone-700">{grp.inviteCode}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 text-[11px] text-stone-600 border-t border-stone-100 pt-2">
                    <span className={isJoined ? 'text-emerald-700 font-bold' : 'text-amber-800 font-medium'}>
                      {isJoined ? '✓ Joined' : 'Not joined yet'}
                    </span>
                    <div className="flex items-center gap-2">
                      {!isJoined && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenJoinGroup(grp.inviteCode);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs"
                        >
                          + Join
                        </button>
                      )}
                      <span className="text-stone-700 font-bold flex items-center gap-0.5 text-xs">
                        Details ➔
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
