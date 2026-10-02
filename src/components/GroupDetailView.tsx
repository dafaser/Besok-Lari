import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Copy,
  Users,
  Trophy,
  Footprints,
  Clock,
  Plus,
  Settings,
  UserX,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
  Calendar,
  Trash2,
  Crown,
} from 'lucide-react';
import { Group, LeaderboardEntry, GroupProgressStats, Activity, User } from '../types';
import { CountdownTimer } from './CountdownTimer';
import { ConfirmationModal } from './ConfirmationModal';
import { formatDeadline } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

interface GroupDetailViewProps {
  group: Group;
  stats: GroupProgressStats;
  leaderboard: LeaderboardEntry[];
  members: {
    userId: string;
    username: string;
    joinedAt: string;
    totalApprovedKm: number;
    progressPercent: number;
    isCompleted: boolean;
  }[];
  recentActivities: Activity[];
  currentUser: User;
  onBack: () => void;
  onOpenAddRun: () => void;
  onViewPhoto: (activity: Activity) => void;
  onRemoveParticipant: (userId: string, username: string) => void;
  onEditGroup: (data: { name?: string; description?: string; targetKm?: number; deadline?: string; status?: 'ACTIVE' | 'CLOSED' }) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenJoinGroup?: (initialCode?: string) => void;
  onDeleteGroup?: (groupId: string) => Promise<void>;
}

export const GroupDetailView: React.FC<GroupDetailViewProps> = ({
  group,
  stats,
  leaderboard,
  members,
  recentActivities,
  currentUser,
  onBack,
  onOpenAddRun,
  onViewPhoto,
  onRemoveParticipant,
  onEditGroup,
  onShowToast,
  onOpenJoinGroup,
  onDeleteGroup,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'participants' | 'management'>('overview');
  const [isCopied, setIsCopied] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removeParticipantTarget, setRemoveParticipantTarget] = useState<{ userId: string; username: string } | null>(null);
  const [isRemovingParticipant, setIsRemovingParticipant] = useState(false);

  const handleConfirmRemoveParticipant = async () => {
    if (!removeParticipantTarget) return;
    setIsRemovingParticipant(true);
    try {
      await onRemoveParticipant(removeParticipantTarget.userId, removeParticipantTarget.username);
    } finally {
      setIsRemovingParticipant(false);
      setRemoveParticipantTarget(null);
    }
  };

  // Edit group form state (if creator or admin/host)
  const isCreator =
    currentUser.id === group.creatorId ||
    currentUser.role === 'CREATOR' ||
    currentUser.role === 'ADMIN' ||
    currentUser.username.toLowerCase() === 'admin' ||
    currentUser.username.toLowerCase() === 'dafasr';
  const isMember = Boolean(
    group.isMember || members.some((m) => m.userId === currentUser.id) || currentUser.id === group.creatorId
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editDesc, setEditDesc] = useState(group.description);
  const [editTarget, setEditTarget] = useState(String(group.targetKm));
  const [editDeadline, setEditDeadline] = useState(group.deadline.split('T')[0]);

  const handleConfirmDelete = async () => {
    if (!onDeleteGroup) return;
    setIsDeleting(true);
    try {
      await onDeleteGroup(group.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleToggleStatus = () => {
    const nextStatus = group.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    onEditGroup({ status: nextStatus });
    onShowToast(`Challenge status changed to ${nextStatus.toLowerCase()}.`, 'info');
  };

  // Current user's progress in this group
  const userEntry = leaderboard.find((l) => l.userId === currentUser.id);
  const userKm = userEntry ? userEntry.totalApprovedKm : 0;
  const progressPercent = Math.min(100, Math.round((userKm / group.targetKm) * 100));
  const isCompleted = userKm >= group.targetKm;
  const remainingKm = Math.max(0, Number((group.targetKm - userKm).toFixed(1)));

  // Trigger celebration confetti if completed!
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#059669', '#10B981', '#34D399', '#FBBF24', '#3B82F6'],
    });
  };

  const copyInviteLink = () => {
    const inviteText = `🏃 Come join the Besok Lari challenge "${group.name}"! Goal: ${group.targetKm} KM. Use Group Code: ${group.inviteCode} in the Besok Lari app.`;
    navigator.clipboard.writeText(inviteText);
    setIsCopied(true);
    onShowToast(`Group code ${group.inviteCode} copied to clipboard!`, 'success');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(
      `🏃 Let's run together in Besok Lari challenge "${group.name}"! Goal: ${group.targetKm} KM. Enter Group Code: ${group.inviteCode} to get started!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onEditGroup({
      name: editName,
      description: editDesc,
      targetKm: Number(editTarget),
      deadline: `${editDeadline}T23:59:59`,
    });
    setIsEditing(false);
    onShowToast('Challenge info updated successfully.', 'success');
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24 md:pb-12">
      {/* Back button & top actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-950 p-2 rounded-xl hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          {isCreator && onDeleteGroup && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-black text-rose-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Permanently delete this challenge"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete</span>
            </button>
          )}

          <button
            onClick={copyInviteLink}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 flex items-center gap-1.5 shadow-2xs"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
            <span>{isCopied ? 'Copied!' : group.inviteCode}</span>
          </button>

          <button
            onClick={shareToWhatsApp}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Header Banner (Rule 9) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                🏃 {group.status}
              </span>
              <span className="text-xs font-bold text-stone-500">
                {formatDeadline(group.deadline)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
              {group.name}
            </h1>
            <p className="text-sm text-stone-600 max-w-2xl">{group.description}</p>
            <div className="text-xs text-stone-600 font-medium">
              Created by <span className="font-bold text-stone-700">{group.creatorUsername}</span>
            </div>
          </div>

          {isMember ? (
            <button
              onClick={onOpenAddRun}
              className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 shrink-0 self-start cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ LOG RUN</span>
            </button>
          ) : (
            onOpenJoinGroup && (
              <button
                onClick={() => onOpenJoinGroup(group.inviteCode)}
                className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 shrink-0 self-start cursor-pointer whitespace-nowrap"
              >
                <span>+ JOIN CHALLENGE</span>
              </button>
            )
          )}
        </div>

        {/* Large Countdown (Rule 9 & 20) */}
        <div className="mt-6">
          <CountdownTimer deadline={group.deadline} startDate={group.startDate} />
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Overview & Progress
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'bg-emerald-600 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Leaderboard ({leaderboard.length})
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'participants'
              ? 'bg-emerald-600 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Runners ({members.length})
        </button>
        {isCreator && (
          <button
            onClick={() => setActiveTab('management')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'management'
                ? 'bg-amber-600 text-white'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings & Delete</span>
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* YOUR PROGRESS (Rule 9 & 18) */}
          {!isMember ? (
            <div className="bg-amber-50 rounded-3xl border border-amber-200 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Status: Not Registered
                  </span>
                  <h3 className="text-lg font-black text-stone-900 mt-2">
                    Join to Start Logging Runs
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 max-w-lg leading-relaxed">
                    You are checking out <b>{group.name}</b>. Enter group invite code: <span className="font-mono font-bold text-stone-800 bg-amber-100 px-2 py-0.5 rounded">{group.inviteCode}</span> to officially join the crew.
                  </p>
                </div>
                {onOpenJoinGroup && (
                  <button
                    onClick={() => onOpenJoinGroup(group.inviteCode)}
                    className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-700/20 whitespace-nowrap cursor-pointer transition-all active:scale-95"
                  >
                    + JOIN WITH INVITE CODE
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                    YOUR PROGRESS
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono tracking-tight">
                      {userKm}
                    </span>
                    <span className="text-xl font-bold text-stone-400 font-mono">
                      / {group.targetKm} KM
                    </span>
                    <span className="ml-2 text-sm font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {progressPercent}%
                    </span>
                  </div>
                </div>

                {isCompleted ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                      🎉
                    </div>
                    <div>
                      <span className="text-xs font-black text-emerald-800 uppercase block">
                        GOAL CRUSHED!
                      </span>
                      <span className="text-xs text-emerald-700 font-medium">
                        You finished the challenge! Awesome run!
                      </span>
                    </div>
                    <button
                      onClick={triggerConfetti}
                      className="ml-auto text-xs font-extrabold px-3 py-1.5 rounded-xl bg-emerald-600 text-white shadow-xs cursor-pointer"
                    >
                      Celebrate 🎊
                    </button>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-stone-600">
                    <span>{remainingKm} KM remaining</span>
                  </div>
                )}
              </div>

              {/* Large Progress Bar */}
              <div className="w-full bg-stone-100 rounded-full h-4 overflow-hidden p-0.5 border border-stone-200">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* GROUP PROGRESS (Rule 10) */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-3">
              GROUP PROGRESS
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase block">
                  Total Approved KM
                </span>
                <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                  {stats.totalApprovedKm} KM
                </span>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase block">
                  Runners
                </span>
                <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">
                  {stats.participantsCount}
                </span>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase block">
                  Average
                </span>
                <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">
                  {stats.averageKmPerParticipant} KM
                </span>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase block">
                  Finishers
                </span>
                <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                  {stats.completedParticipantsCount}
                </span>
              </div>
            </div>

            {/* Collective Target Progress */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-stone-600 mb-1.5">
                <span>Collective Team Goal</span>
                <span>
                  {stats.totalApprovedKm} / {stats.targetCollectiveKm} KM ({stats.collectiveProgressPercent}%)
                </span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden p-0.5 border border-stone-200">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.collectiveProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY FEED (Rule 23) */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
            <h3 className="text-base font-black text-stone-900 mb-4 flex items-center gap-2">
              <Footprints className="w-4 h-4 text-emerald-600" />
              <span>RECENT ACTIVITIES</span>
            </h3>

            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500">
                No approved runs yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => onViewPhoto(act)}
                    className="p-3.5 rounded-2xl border border-stone-100 bg-stone-50/70 hover:bg-stone-100 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={act.photoUrl}
                        alt={act.username}
                        className="w-12 h-12 rounded-xl object-cover shadow-2xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-sm text-stone-900">
                          {act.username} completed <span className="text-emerald-700 font-black">{act.distanceKm} KM</span> 🏃
                        </div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                          <span>{act.date}</span>
                          <span>•</span>
                          <span>{act.startTime} - {act.endTime} ({act.durationMinutes} min)</span>
                          {act.note && <span className="italic truncate max-w-[150px]">"{act.note}"</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        🟢 Approved
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LEADERBOARD - 3 Podium + Juara 4 Seterusnya */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl mx-auto mb-3">
                🏆
              </div>
              <h3 className="text-base font-black text-stone-900">No Runners on the Leaderboard Yet</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Log your first run and get approved to take the crown on the podium!
              </p>
            </div>
          ) : (
            <>
              {/* 3 PODIUM SECTION: 1st — 3rd Place */}
              <div className="bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-4 sm:p-6 text-white shadow-xl border border-stone-800 relative overflow-hidden">
                <div className="text-center mb-4 sm:mb-6 relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-black text-amber-300 border border-white/15 mb-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>PODIUM: 1ST — 3RD PLACE</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    Top 3 Runners
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    {group.name} • Goal {group.targetKm} KM
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-2 pb-1 relative z-10">
                  {/* 2nd Place (Silver) */}
                  <div className="flex flex-col items-center">
                    {leaderboard[1] ? (
                      <>
                        <div className="flex flex-col items-center text-center mb-2 w-full px-1">
                          <div className="relative mb-1">
                            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-slate-300 via-slate-100 to-white text-slate-800 font-black text-sm sm:text-base flex items-center justify-center border-2 border-slate-300 shadow-md">
                              {leaderboard[1].username[0]?.toUpperCase()}
                            </div>
                            <span className="absolute -bottom-1 -right-1 text-sm sm:text-base">
                              🥈
                            </span>
                          </div>
                          <span className="font-extrabold text-xs sm:text-sm text-white truncate max-w-full">
                            {leaderboard[1].username}
                          </span>
                          {leaderboard[1].userId === currentUser.id && (
                            <span className="text-[8px] sm:text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full mt-0.5">
                              YOU
                            </span>
                          )}
                          <div className="text-sm sm:text-base font-black text-slate-200 font-mono mt-0.5">
                            {leaderboard[1].totalApprovedKm.toFixed(1)} <span className="text-[10px] font-bold text-slate-400">KM</span>
                          </div>
                        </div>
                        <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-gradient-to-b from-slate-300/40 via-slate-400/30 to-slate-500/20 border-t-2 border-x-2 border-slate-300/60 backdrop-blur-md flex flex-col items-center justify-between p-2 shadow-lg">
                          <span className="text-xs sm:text-sm font-black font-mono text-slate-200">#2</span>
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider">2ND PLACE</span>
                          <span className="text-[9px] font-mono text-slate-400">{leaderboard[1].progressPercent}%</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-stone-600 flex items-center justify-center text-xs text-stone-500 mb-2">🥈</div>
                        <span className="text-[10px] text-stone-500 font-medium mb-2">Open Spot</span>
                        <div className="w-full h-24 rounded-t-2xl border-t-2 border-x-2 border-dashed border-stone-700 bg-white/5 flex items-center justify-center p-2">
                          <span className="text-[10px] text-stone-500 font-mono">#2</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 1st Place (Gold - Tallest & Center) */}
                  <div className="flex flex-col items-center -mt-6">
                    {leaderboard[0] ? (
                      <>
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-[9px] sm:text-[10px] uppercase shadow-md shadow-amber-500/30 mb-1 animate-bounce">
                          <Crown className="w-3 h-3 fill-stone-950" />
                          <span>CHAMPION</span>
                        </div>
                        <div className="flex flex-col items-center text-center mb-2 w-full px-1">
                          <div className="relative mb-1">
                            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-yellow-100 text-stone-900 font-black text-base sm:text-xl flex items-center justify-center border-3 border-amber-300 shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/30">
                              {leaderboard[0].username[0]?.toUpperCase()}
                            </div>
                            <span className="absolute -bottom-1 -right-1 text-base sm:text-xl">
                              🥇
                            </span>
                          </div>
                          <span className="font-black text-sm sm:text-base text-white truncate max-w-full">
                            {leaderboard[0].username}
                          </span>
                          {leaderboard[0].userId === currentUser.id && (
                            <span className="text-[8px] sm:text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full mt-0.5">
                              YOU
                            </span>
                          )}
                          <div className="text-base sm:text-xl font-black text-amber-300 font-mono mt-0.5">
                            {leaderboard[0].totalApprovedKm.toFixed(1)} <span className="text-xs font-bold text-amber-200">KM</span>
                          </div>
                          {leaderboard[0].isCompleted && (
                            <span className="text-[9px] font-black text-emerald-400 flex items-center gap-0.5 mt-0.5">
                              ✓ FINISHED
                            </span>
                          )}
                        </div>
                        <div className="w-full h-36 sm:h-48 rounded-t-2xl bg-gradient-to-b from-amber-400/50 via-amber-500/30 to-amber-600/20 border-t-3 border-x-3 border-amber-400 backdrop-blur-md flex flex-col items-center justify-between p-2 shadow-2xl shadow-amber-500/20">
                          <span className="text-sm sm:text-base font-black font-mono text-amber-300">#1</span>
                          <span className="text-[10px] sm:text-xs font-black text-amber-200 uppercase tracking-widest">1ST PLACE</span>
                          <span className="text-[10px] font-mono font-bold text-amber-300/80">{leaderboard[0].progressPercent}%</span>
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* 3rd Place (Bronze) */}
                  <div className="flex flex-col items-center">
                    {leaderboard[2] ? (
                      <>
                        <div className="flex flex-col items-center text-center mb-2 w-full px-1">
                          <div className="relative mb-1">
                            <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-amber-700 via-amber-500 to-amber-200 text-white font-black text-xs sm:text-sm flex items-center justify-center border-2 border-amber-600 shadow-md">
                              {leaderboard[2].username[0]?.toUpperCase()}
                            </div>
                            <span className="absolute -bottom-1 -right-1 text-sm sm:text-base">
                              🥉
                            </span>
                          </div>
                          <span className="font-extrabold text-xs sm:text-sm text-white truncate max-w-full">
                            {leaderboard[2].username}
                          </span>
                          {leaderboard[2].userId === currentUser.id && (
                            <span className="text-[8px] sm:text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full mt-0.5">
                              YOU
                            </span>
                          )}
                          <div className="text-sm sm:text-base font-black text-amber-200 font-mono mt-0.5">
                            {leaderboard[2].totalApprovedKm.toFixed(1)} <span className="text-[10px] font-bold text-amber-400">KM</span>
                          </div>
                        </div>
                        <div className="w-full h-24 sm:h-32 rounded-t-2xl bg-gradient-to-b from-amber-700/40 via-amber-800/30 to-amber-900/20 border-t-2 border-x-2 border-amber-600/60 backdrop-blur-md flex flex-col items-center justify-between p-2 shadow-lg">
                          <span className="text-xs sm:text-sm font-black font-mono text-amber-200">#3</span>
                          <span className="text-[9px] sm:text-[10px] font-bold text-amber-300 uppercase tracking-wider">3RD PLACE</span>
                          <span className="text-[9px] font-mono text-amber-400">{leaderboard[2].progressPercent}%</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-stone-600 flex items-center justify-center text-xs text-stone-500 mb-2">🥉</div>
                        <span className="text-[10px] text-stone-500 font-medium mb-2">Open Spot</span>
                        <div className="w-full h-20 rounded-t-2xl border-t-2 border-x-2 border-dashed border-stone-700 bg-white/5 flex items-center justify-center p-2">
                          <span className="text-[10px] text-stone-500 font-mono">#3</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TABLE: 4TH PLACE & BEYOND */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-900">
                      LEADERBOARD TABLE: 4TH PLACE & BEYOND
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Rankings after the top 3 podium
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full">
                    {leaderboard.slice(3).length} Runners
                  </span>
                </div>

                {leaderboard.slice(3).length === 0 ? (
                  <div className="py-6 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center text-lg mx-auto mb-2">
                      🏃
                    </div>
                    <h4 className="text-xs font-bold text-stone-800">
                      No Runners at 4th Place Yet
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      All registered runners are currently on the podium (1st — 3rd place). New runners who log kilometers will show up in this table!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {leaderboard.slice(3).map((entry) => {
                      const isMe = entry.userId === currentUser.id;
                      return (
                        <div
                          key={entry.userId}
                          className={`py-3 px-3.5 rounded-2xl flex items-center justify-between transition-colors my-1 ${
                            isMe ? 'bg-emerald-50/80 border border-emerald-300 ring-1 ring-emerald-400/20' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-xl bg-stone-100 text-stone-700 font-mono font-black text-xs flex items-center justify-center shrink-0">
                              #{entry.rank}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {entry.username[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs sm:text-sm text-stone-900">
                                  {entry.username}
                                </span>
                                {isMe && (
                                  <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                                    YOU
                                  </span>
                                )}
                                {entry.isCompleted && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.2 rounded-full">
                                    ✓ FINISHED
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-stone-500 block">
                                {entry.approvedRunsCount} verified runs logged
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm sm:text-base font-black text-stone-900 font-mono">
                              {entry.totalApprovedKm.toFixed(1)}{' '}
                              <span className="text-xs font-bold text-emerald-600">KM</span>
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono">
                              {entry.progressPercent}% of {entry.targetKm} KM
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-stone-900">PARTICIPANTS</h3>
              <p className="text-xs text-stone-500">
                {members.length} {members.length === 1 ? 'runner' : 'runners'} joined this challenge
              </p>
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {members.map((m) => {
              const isCreatorSelf = m.userId === group.creatorId;
              const isMe = m.userId === currentUser.id;
              return (
                <div
                  key={m.userId}
                  className="py-3 px-3 flex items-center justify-between hover:bg-stone-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-sm">
                      {m.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">{m.username}</span>
                        {isCreatorSelf && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded-sm">
                            CREATOR
                          </span>
                        )}
                        {isMe && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded-sm">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500">
                        Joined {new Date(m.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-black text-stone-900 font-mono">
                        {m.totalApprovedKm.toFixed(1)} KM
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {m.progressPercent}% {m.isCompleted && '🎉'}
                      </div>
                    </div>

                    {/* Creator can remove participant */}
                    {isCreator && !isCreatorSelf && (
                      <button
                        type="button"
                        onClick={() => setRemoveParticipantTarget({ userId: m.userId, username: m.username })}
                        className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 border border-rose-200/60"
                        title="Hapus runner dari challenge"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: GROUP MANAGEMENT */}
      {isCreator && activeTab === 'management' && (
        <div className="bg-white rounded-3xl border border-amber-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-stone-900">CHALLENGE MANAGEMENT</h3>
              <p className="text-xs text-stone-500">
                Challenge settings & Creator admin controls
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Edit Challenge Info
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-sm rounded-xl border border-stone-300 p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full text-sm rounded-xl border border-stone-300 p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Target KM</label>
                  <input
                    type="number"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="w-full text-sm rounded-xl border border-stone-300 p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full text-sm rounded-xl border border-stone-300 p-2.5"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Status Management */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-stone-600 mb-0.5">Current Challenge Status:</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      group.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-200 text-stone-800 border border-stone-300'
                    }`}>
                      {group.status === 'ACTIVE' ? '🟢 ACTIVE' : '⚪ CLOSED'}
                    </span>
                    <span className="text-xs text-stone-500">
                      {group.status === 'ACTIVE' ? 'Challenge is live and running' : 'Challenge has ended / closed'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-xs font-bold text-stone-700 transition-colors shrink-0 cursor-pointer"
                >
                  {group.status === 'ACTIVE' ? 'Close / Complete Challenge' : 'Reopen as Active'}
                </button>
              </div>

              {/* Invite Code Info */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="text-xs font-bold text-amber-900 mb-1">Invite Code</div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-black text-amber-950">{group.inviteCode}</span>
                  <button
                    onClick={copyInviteLink}
                    className="px-3 py-1 bg-amber-200 hover:bg-amber-300 rounded-lg text-xs font-bold text-amber-900 cursor-pointer"
                  >
                    Copy Invite
                  </button>
                </div>
              </div>

              {/* MANAGE RUNNERS & PARTICIPANTS (Hapus Pelari Lain) */}
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Manage Runners & Anggota ({members.filter((m) => m.userId !== group.creatorId).length})</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Sebagai host challenge, Anda dapat mengeluarkan atau menghapus pelari lain yang telah bergabung ke challenge ini.
                    </p>
                  </div>
                </div>

                {members.filter((m) => m.userId !== group.creatorId).length === 0 ? (
                  <div className="p-4 rounded-xl bg-white border border-stone-200/80 text-center text-xs text-stone-500">
                    Belum ada pelari lain yang bergabung. Bagikan kode invite <span className="font-mono font-bold text-stone-700">{group.inviteCode}</span> untuk mengajak pelari lain!
                  </div>
                ) : (
                  <div className="divide-y divide-stone-200/60 bg-white rounded-xl border border-stone-200 overflow-hidden">
                    {members
                      .filter((m) => m.userId !== group.creatorId)
                      .map((m) => (
                        <div
                          key={m.userId}
                          className="p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {m.username[0]?.toUpperCase() || 'P'}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-stone-900 truncate flex items-center gap-1.5">
                                <span>{m.username}</span>
                                {m.isCompleted && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                                    SELESAI 🎉
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-500 font-mono">
                                {m.totalApprovedKm.toFixed(1)} KM • {m.progressPercent}% target
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setRemoveParticipantTarget({ userId: m.userId, username: m.username })}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-2xs"
                            title={`Keluarkan ${m.username} dari challenge`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Hapus Runner</span>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* DANGER ZONE: Delete Challenge */}
              <div className="p-5 bg-rose-50/70 rounded-2xl border border-rose-200 mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Danger Zone: Delete Challenge</span>
                    </div>
                    <p className="text-xs text-rose-700 max-w-xl leading-relaxed">
                      Permanently delete this challenge group (whether currently active or closed). All participant records, logged distances, and running history for this challenge will be wiped permanently.
                    </p>
                  </div>

                  {onDeleteGroup && (
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete This Challenge</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Removing Participant */}
      {removeParticipantTarget && (
        <ConfirmationModal
          isOpen={Boolean(removeParticipantTarget)}
          onClose={() => setRemoveParticipantTarget(null)}
          onConfirm={handleConfirmRemoveParticipant}
          title={`Hapus @${removeParticipantTarget.username} dari Challenge?`}
          message={`Apakah Anda yakin ingin mengeluarkan pelari @${removeParticipantTarget.username} dari challenge "${group.name}"? Data keanggotaan pelari ini dalam challenge akan dihapus.`}
          confirmText={isRemovingParticipant ? 'Menghapus...' : 'Ya, Hapus Runner'}
          cancelText="Batal"
          type="reject"
        />
      )}

      {/* Confirmation Modal for Group Deletion */}
      {isDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title={`Delete Challenge "${group.name}"?`}
          message={`Are you sure you want to permanently delete challenge "${group.name}" (${group.status === 'ACTIVE' ? 'Active' : 'Closed'})? All activity history, runners, and logged KM progress in this challenge will be permanently wiped.`}
          confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
          cancelText="Cancel"
          type="reject"
        />
      )}
    </div>
  );
};
