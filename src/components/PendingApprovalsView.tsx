import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Check,
  X,
  Filter,
} from 'lucide-react';
import { Activity } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface PendingApprovalsViewProps {
  pendingActivities: Activity[];
  onApprove: (activityId: string) => Promise<void>;
  onReject: (activityId: string, reason?: string) => Promise<void>;
  onViewPhoto: (activity: Activity) => void;
}

export const PendingApprovalsView: React.FC<PendingApprovalsViewProps> = ({
  pendingActivities,
  onApprove,
  onReject,
  onViewPhoto,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [confirmType, setConfirmType] = useState<'approve' | 'reject' | null>(null);

  const handleOpenApprove = (activity: Activity) => {
    setSelectedActivity(activity);
    setConfirmType('approve');
  };

  const handleOpenReject = (activity: Activity) => {
    setSelectedActivity(activity);
    setConfirmType('reject');
  };

  const handleConfirmAction = async (reason?: string) => {
    if (!selectedActivity) return;

    if (confirmType === 'approve') {
      await onApprove(selectedActivity.id);
    } else if (confirmType === 'reject') {
      await onReject(selectedActivity.id, reason);
    }

    setSelectedActivity(null);
    setConfirmType(null);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24 md:pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Group Creator Verification Panel
          </div>
          <h1 className="text-2xl font-black text-stone-900">PENDING APPROVALS</h1>
          <p className="text-xs text-stone-700 font-medium">
            Review photo proofs and run details before miles are credited to group progress & leaderboard
          </p>
        </div>

        <div className="bg-stone-50 px-4 py-2.5 rounded-2xl border border-stone-200 flex items-center gap-3">
          <span className="text-xs font-bold text-stone-500">Review Queue:</span>
          <span className="text-xl font-black font-mono text-amber-600">
            {pendingActivities.length}
          </span>
        </div>
      </div>

      {/* Empty State (Rule 31) */}
      {pendingActivities.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
          <div className="text-4xl mb-2">✨</div>
          <h3 className="text-lg font-black text-stone-900">You're all caught up!</h3>
          <p className="text-xs text-stone-500 mt-1">
            No pending run submissions waiting for review right now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingActivities.map((act) => (
            <div
              key={act.id}
              className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs transition-all ${
                act.isSuspicious
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              {/* Anti-Cheat Anomaly Flag (Rule 25) */}
              {act.isSuspicious && (
                <div className="mb-4 p-3 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold uppercase">⚠️ POSSIBLE ANOMALY DETECTED: </span>
                    <span>{act.suspiciousReason || 'Unusual pace or distance detected.'}</span>
                    <p className="text-[11px] text-amber-800 font-normal mt-0.5">
                      System flagged this submission for a quick double-check. As the challenge creator, you always have the final call to Approve or Reject.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* User & Running info */}
                <div className="flex items-start gap-4">
                  {/* Photo proof thumbnail */}
                  <div
                    onClick={() => onViewPhoto(act)}
                    className="relative group cursor-pointer shrink-0 rounded-2xl overflow-hidden border border-stone-200 w-24 h-24 sm:w-28 sm:h-28 bg-stone-100 shadow-2xs"
                  >
                    <img
                      src={act.photoUrl}
                      alt={`Run proof for ${act.username}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    {act.photoUrls && act.photoUrls.length > 1 && (
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-stone-900/80 text-white font-mono text-[9px] font-bold z-10 flex items-center gap-1 shadow-xs">
                        📸 {act.photoUrls.length} Foto
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold text-center p-1">
                      [VIEW PHOTO]
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-base text-stone-900">
                        {act.username}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🏆 {act.groupName}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        🟡 PENDING
                      </span>
                    </div>

                    <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                      🏃 {act.distanceKm} KM
                    </div>

                    <div className="text-xs text-stone-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium">{act.date}</span>
                      <span>•</span>
                      <span>
                        {act.startTime} — {act.endTime}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-stone-800">
                        Duration: {act.durationMinutes} minutes
                      </span>
                    </div>

                    {act.note && (
                      <div className="text-xs text-stone-600 italic bg-stone-50 p-2 rounded-lg border border-stone-100 mt-1">
                        "{act.note}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions: Approve / Reject (Rule 14) */}
                <div className="flex sm:flex-col items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleOpenApprove(act)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>[✓ APPROVE]</span>
                  </button>

                  <button
                    onClick={() => handleOpenReject(act)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 active:scale-95 text-stone-700 font-bold text-xs border border-stone-200 hover:border-rose-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[3]" />
                    <span>[✕ REJECT]</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modals for Approval and Rejection (Rule 14) */}
      <ConfirmationModal
        isOpen={confirmType === 'approve'}
        onClose={() => setConfirmType(null)}
        onConfirm={handleConfirmAction}
        type="approve"
        title="Approve Running Activity"
        message={`Approve this ${selectedActivity?.distanceKm} KM activity for ${selectedActivity?.username}? Distance will immediately count toward the runner's progress and the leaderboard.`}
        confirmText="Confirm & Approve"
      />

      <ConfirmationModal
        isOpen={confirmType === 'reject'}
        onClose={() => setConfirmType(null)}
        onConfirm={handleConfirmAction}
        type="reject"
        withReasonInput={true}
        reasonPlaceholder="e.g. Photo proof is blurry or stopwatch distance is cut off."
        title="Reject Running Activity"
        message={`Are you sure you want to reject ${selectedActivity?.username}'s ${selectedActivity?.distanceKm} KM run? This distance will not count toward the challenge.`}
        confirmText="Reject Activity"
      />
    </div>
  );
};
