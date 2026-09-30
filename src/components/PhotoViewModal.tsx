import React from 'react';
import { X, Calendar, MapPin, Clock, User as UserIcon } from 'lucide-react';
import { Activity } from '../types';

interface PhotoViewModalProps {
  activity: Activity | null;
  onClose: () => void;
}

export const PhotoViewModal: React.FC<PhotoViewModalProps> = ({ activity, onClose }) => {
  if (!activity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 text-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 flex items-center justify-between border-b border-stone-800 bg-stone-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              {activity.username[0]?.toUpperCase() || 'R'}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{activity.username}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    activity.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : activity.status === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {activity.status}
                </span>
              </h3>
              <p className="text-xs text-stone-400">{activity.groupName || 'Besok Lari Challenge'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-2 rounded-xl hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Container */}
        <div className="flex-1 overflow-auto bg-black flex items-center justify-center min-h-[250px] p-2">
          <img
            src={activity.photoUrl}
            alt={`Run proof for ${activity.username}`}
            className="max-h-[60vh] max-w-full object-contain rounded-lg"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Details Footer */}
        <div className="p-5 bg-stone-900/90 border-t border-stone-800 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-stone-800/80 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Distance</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {activity.distanceKm} KM
              </span>
            </div>
            <div className="bg-stone-800/80 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Duration</span>
              <span className="text-lg font-black text-white font-mono">
                {activity.durationMinutes} min
              </span>
            </div>
            <div className="bg-stone-800/80 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Time</span>
              <span className="text-xs font-bold text-stone-200 mt-1 block">
                {activity.startTime} - {activity.endTime}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-400 px-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              {activity.date}
            </span>
            {activity.approvedBy && (
              <span className="text-emerald-400 font-medium">
                Verified by {activity.approvedBy}
              </span>
            )}
          </div>

          {activity.note && (
            <div className="bg-stone-800/50 p-3 rounded-xl text-xs text-stone-300 italic border border-stone-800">
              "{activity.note}"
            </div>
          )}

          {activity.rejectionReason && (
            <div className="bg-rose-950/50 p-3 rounded-xl text-xs text-rose-300 border border-rose-800/60">
              <span className="font-bold">Host feedback: </span>
              {activity.rejectionReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
