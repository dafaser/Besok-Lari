import React from 'react';
import { Trophy, Flame, Footprints, Crown, CheckCircle2, Users } from 'lucide-react';
import { Group, LeaderboardEntry, User } from '../types';

interface LeaderboardViewProps {
  groups: Group[];
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  leaderboard: LeaderboardEntry[];
  currentUser: User;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  leaderboard,
  currentUser,
}) => {
  const currentGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  // Top 3 for podium
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  // Runners from rank 4 onwards
  const remainingRunners = leaderboard.slice(3);

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24 md:pb-12">
      {/* Header & Group Selector */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
            RUNNER RANKINGS
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            LEADERBOARD
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Rankings based on total verified approved kilometers
          </p>
        </div>

        {groups.length > 1 && (
          <div className="relative">
            <select
              value={selectedGroupId}
              onChange={(e) => onSelectGroup(e.target.value)}
              className="w-full sm:w-auto text-xs font-bold rounded-xl border border-stone-300 p-2.5 pr-8 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-stone-800 cursor-pointer"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.targetKm} KM)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3 PODIUM SECTION: 1st to 3rd Place */}
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
        <div className="bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-4 sm:p-6 text-white shadow-xl border border-stone-800 relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="text-center mb-4 sm:mb-6 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-black text-amber-300 border border-white/15 mb-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>PODIUM: 1ST — 3RD PLACE</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              Top 3 Runners
            </h2>
            <p className="text-[11px] text-stone-400">
              {currentGroup ? currentGroup.name : 'Challenge'} • Target {currentGroup?.targetKm || 10} KM
            </p>
          </div>

          {/* 3 Podium Columns: [2nd Place - Silver], [1st Place - Gold], [3rd Place - Bronze] */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-2 pb-1 relative z-10">
            {/* 2nd Place (Silver - Left) */}
            <div className="flex flex-col items-center">
              {top2 ? (
                <>
                  {/* Runner Info */}
                  <div className="flex flex-col items-center text-center mb-2 w-full px-1">
                    <div className="relative mb-1">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-slate-300 via-slate-100 to-white text-slate-800 font-black text-sm sm:text-base flex items-center justify-center border-2 border-slate-300 shadow-md">
                        {top2.username[0]?.toUpperCase()}
                      </div>
                      <span className="absolute -bottom-1 -right-1 text-sm sm:text-base">
                        🥈
                      </span>
                    </div>

                    <div className="flex items-center gap-1 max-w-full justify-center">
                      <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                        {top2.username}
                      </span>
                    </div>
                    {top2.userId === currentUser.id && (
                      <span className="text-[8px] sm:text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full mt-0.5">
                        YOU
                      </span>
                    )}

                    <div className="text-sm sm:text-base font-black text-slate-200 font-mono mt-0.5">
                      {top2.totalApprovedKm.toFixed(1)} <span className="text-[10px] font-bold text-slate-400">KM</span>
                    </div>
                  </div>

                  {/* Silver Pedestal */}
                  <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-gradient-to-b from-slate-300/40 via-slate-400/30 to-slate-500/20 border-t-2 border-x-2 border-slate-300/60 backdrop-blur-md flex flex-col items-center justify-between p-2 shadow-lg">
                    <span className="text-xs sm:text-sm font-black font-mono text-slate-200">
                      #2
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      2ND PLACE
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {top2.progressPercent}%
                    </span>
                  </div>
                </>
              ) : (
                /* Empty 2nd place slot */
                <div className="w-full flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-stone-600 flex items-center justify-center text-xs text-stone-500 mb-2">
                    🥈
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium mb-2">Open Spot</span>
                  <div className="w-full h-24 rounded-t-2xl border-t-2 border-x-2 border-dashed border-stone-700 bg-white/5 flex items-center justify-center p-2">
                    <span className="text-[10px] text-stone-500 font-mono">#2</span>
                  </div>
                </div>
              )}
            </div>

            {/* 1st Place (Gold / Champion - Center, Taller & Elevated) */}
            <div className="flex flex-col items-center -mt-6">
              {top1 ? (
                <>
                  {/* Champion Ribbon / Crown */}
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-[9px] sm:text-[10px] uppercase shadow-md shadow-amber-500/30 mb-1 animate-bounce">
                    <Crown className="w-3 h-3 fill-stone-950" />
                    <span>CHAMPION</span>
                  </div>

                  {/* Runner Info */}
                  <div className="flex flex-col items-center text-center mb-2 w-full px-1">
                    <div className="relative mb-1">
                      <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-yellow-100 text-stone-900 font-black text-base sm:text-xl flex items-center justify-center border-3 border-amber-300 shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/30">
                        {top1.username[0]?.toUpperCase()}
                      </div>
                      <span className="absolute -bottom-1 -right-1 text-base sm:text-xl">
                        🥇
                      </span>
                    </div>

                    <div className="flex items-center gap-1 max-w-full justify-center">
                      <span className="font-black text-sm sm:text-base text-white truncate">
                        {top1.username}
                      </span>
                    </div>
                    {top1.userId === currentUser.id && (
                      <span className="text-[8px] sm:text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full mt-0.5">
                        YOU
                      </span>
                    )}

                    <div className="text-base sm:text-xl font-black text-amber-300 font-mono mt-0.5">
                      {top1.totalApprovedKm.toFixed(1)} <span className="text-xs font-bold text-amber-200">KM</span>
                    </div>
                    {top1.isCompleted && (
                      <span className="text-[9px] font-black text-emerald-400 flex items-center gap-0.5 mt-0.5">
                        ✓ FINISHED
                      </span>
                    )}
                  </div>

                  {/* Gold Pedestal (Tallest) */}
                  <div className="w-full h-36 sm:h-48 rounded-t-2xl bg-gradient-to-b from-amber-400/50 via-amber-500/30 to-amber-600/20 border-t-3 border-x-3 border-amber-400 backdrop-blur-md flex flex-col items-center justify-between p-2 shadow-2xl shadow-amber-500/20">
                    <span className="text-sm sm:text-base font-black font-mono text-amber-300">
                      #1
                    </span>
                    <span className="text-[10px] sm:text-xs font-black text-amber-200 uppercase tracking-widest">
                      1ST PLACE
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-300/80">
                      {top1.progressPercent}%
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            {/* 3rd Place (Bronze - Right) */}
            <div className="flex flex-col items-center">
              {top3 ? (
                <>
                  {/* Runner Info */}
                  <div className="flex flex-col items-center text-center mb-2 w-full px-1">
                    <div className="relative mb-1">
                      <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-amber-700 via-amber-500 to-amber-200 text-white font-black text-xs sm:text-sm flex items-center justify-center border-2 border-amber-600 shadow-md">
                        {top3.username[0]?.toUpperCase()}
                      </div>
                      <span className="absolute -bottom-1 -right-1 text-sm sm:text-base">
                        🥉
                      </span>
                    </div>

                    <div className="flex items-center gap-1 max-w-full justify-center">
                      <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                        {top3.username}
                      </span>
                    </div>
                    {top3.userId === currentUser.id && (
                      <span className="text-[8px] sm:text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full mt-0.5">
                        YOU
                      </span>
                    )}

                    <div className="text-sm sm:text-base font-black text-amber-200 font-mono mt-0.5">
                      {top3.totalApprovedKm.toFixed(1)} <span className="text-[10px] font-bold text-amber-400">KM</span>
                    </div>
                  </div>

                  {/* Bronze Pedestal */}
                  <div className="w-full h-24 sm:h-32 rounded-t-2xl bg-gradient-to-b from-amber-700/40 via-amber-800/30 to-amber-900/20 border-t-2 border-x-2 border-amber-600/60 backdrop-blur-md flex flex-col items-center justify-between p-2 shadow-lg">
                    <span className="text-xs sm:text-sm font-black font-mono text-amber-200">
                      #3
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                      3RD PLACE
                    </span>
                    <span className="text-[9px] font-mono text-amber-400">
                      {top3.progressPercent}%
                    </span>
                  </div>
                </>
              ) : (
                /* Empty 3rd place slot */
                <div className="w-full flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-stone-600 flex items-center justify-center text-xs text-stone-500 mb-2">
                    🥉
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium mb-2">Open Spot</span>
                  <div className="w-full h-20 rounded-t-2xl border-t-2 border-x-2 border-dashed border-stone-700 bg-white/5 flex items-center justify-center p-2">
                    <span className="text-[10px] text-stone-500 font-mono">#3</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TABLE: 4TH PLACE & BEYOND */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
              <span>LEADERBOARD TABLE: 4TH PLACE & BEYOND</span>
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Rankings after the top 3 podium
            </p>
          </div>
          <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full">
            {remainingRunners.length} Runners
          </span>
        </div>

        {remainingRunners.length === 0 ? (
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
            {remainingRunners.map((entry) => {
              const isMe = entry.userId === currentUser.id;
              return (
                <div
                  key={entry.userId}
                  className={`py-3 px-3.5 rounded-2xl flex items-center justify-between transition-colors my-1 ${
                    isMe ? 'bg-emerald-50/80 border border-emerald-300 ring-1 ring-emerald-400/20' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Number (4, 5, 6, ...) */}
                    <div className="w-7 h-7 rounded-xl bg-stone-100 text-stone-700 font-mono font-black text-xs flex items-center justify-center shrink-0">
                      #{entry.rank}
                    </div>

                    {/* Avatar & Name */}
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

                  {/* Distance & Progress */}
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
    </div>
  );
};
