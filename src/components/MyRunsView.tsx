import React, { useState } from 'react';
import { Plus, Footprints, Calendar, Clock, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Activity } from '../types';

interface MyRunsViewProps {
  activities: Activity[];
  onOpenAddRun: () => void;
  onViewPhoto: (activity: Activity) => void;
}

export const MyRunsView: React.FC<MyRunsViewProps> = ({
  activities,
  onOpenAddRun,
  onViewPhoto,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  const filtered = activities.filter((a) => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  const totalApprovedKm = activities
    .filter((a) => a.status === 'APPROVED')
    .reduce((sum, a) => sum + Number(a.distanceKm), 0);

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24 md:pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900">MY RUNS</h1>
          <p className="text-xs text-stone-500">
            All your logged miles, stats, and photo proofs in one place
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
              Total Approved
            </span>
            <span className="text-lg font-black font-mono text-emerald-700">
              {totalApprovedKm.toFixed(1)} KM
            </span>
          </div>

          <button
            onClick={onOpenAddRun}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ LOG RUN</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filter === status
                ? 'bg-stone-900 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {status === 'ALL' && `All (${activities.length})`}
            {status === 'APPROVED' && `🟢 Approved (${activities.filter((a) => a.status === 'APPROVED').length})`}
            {status === 'PENDING' && `🟡 Pending (${activities.filter((a) => a.status === 'PENDING').length})`}
            {status === 'REJECTED' && `🔴 Rejected (${activities.filter((a) => a.status === 'REJECTED').length})`}
          </button>
        ))}
      </div>

      {/* Activities List (Rule 16) */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
          <div className="text-4xl mb-2">👟</div>
          <h3 className="text-lg font-black text-stone-900">
            {filter === 'ALL' ? "You haven't logged a run yet" : `No ${filter.toLowerCase()} runs`}
          </h3>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            Log your first run and snap a proof photo to join the action!
          </p>
          <button
            onClick={onOpenAddRun}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            + LOG YOUR FIRST RUN
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((act) => (
            <div
              key={act.id}
              onClick={() => onViewPhoto(act)}
              className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                {/* Photo Thumbnail */}
                <div className="relative rounded-xl overflow-hidden w-16 h-16 sm:w-20 sm:h-20 bg-stone-100 shrink-0 border border-stone-200">
                  <img
                    src={act.photoUrl}
                    alt="Run proof"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-[10px] font-bold">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      {act.date}
                    </span>
                    <span className="text-xs text-stone-400">•</span>
                    <span className="text-xs font-semibold text-stone-600">
                      {act.groupName || 'Challenge'}
                    </span>
                  </div>

                  <div className="text-xl font-black text-stone-900 font-mono flex items-center gap-1.5">
                    <span>🏃 {act.distanceKm} KM</span>
                  </div>

                  <div className="text-xs text-stone-500 flex items-center gap-2">
                    <span>
                      {act.startTime} — {act.endTime}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-stone-700">
                      {act.durationMinutes} minutes
                    </span>
                  </div>

                  {act.note && (
                    <div className="text-xs text-stone-600 italic mt-0.5">
                      "{act.note}"
                    </div>
                  )}

                  {/* Rejection Reason if Rejected */}
                  {act.status === 'REJECTED' && act.rejectionReason && (
                    <div className="mt-1 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 font-medium">
                      <span className="font-bold">Host feedback: </span>
                      {act.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge (Rule 16) */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                {act.status === 'APPROVED' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    🟢 APPROVED
                  </span>
                )}
                {act.status === 'PENDING' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    🟡 PENDING
                  </span>
                )}
                {act.status === 'REJECTED' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    🔴 REJECTED
                  </span>
                )}

                <span className="text-[11px] text-stone-400 font-medium">
                  Tap to see full photo
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
