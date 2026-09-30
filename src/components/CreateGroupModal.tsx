import React, { useState } from 'react';
import { X, Users, Calendar, Target, AlertCircle, Share2, Copy, Check } from 'lucide-react';
import { Group } from '../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    targetKm: number;
    startDate: string;
    deadline: string;
    maxParticipants?: number | null;
  }) => Promise<Group>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onShowToast,
}) => {
  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [name, setName] = useState('Besok Lari 10K');
  const [description, setDescription] = useState('Besok Lari - Lace up, log your miles, and crush 10 KM together!');
  const [targetKm, setTargetKm] = useState('10');
  const [startDate, setStartDate] = useState(todayStr);
  const [deadline, setDeadline] = useState(nextWeek);
  const [maxParticipants, setMaxParticipants] = useState('25');

  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const km = parseFloat(targetKm);
    if (isNaN(km) || km <= 0) {
      setErrorMsg('Target KM must be greater than 0.');
      return;
    }

    if (new Date(deadline) <= new Date(startDate)) {
      setErrorMsg('Deadline must be after start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newGroup = await onSubmit({
        name: name.trim(),
        description: description.trim(),
        targetKm: km,
        startDate,
        deadline: `${deadline}T23:59:59`,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
      });
      setCreatedGroup(newGroup);
      onShowToast(`Challenge "${newGroup.name}" created!`, 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create challenge group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = () => {
    if (!createdGroup) return;
    const text = `🏃 Join my Besok Lari challenge "${createdGroup.name}"! Goal: ${createdGroup.targetKm} KM. Use Invite Code: ${createdGroup.inviteCode}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast('Invite code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const shareWhatsApp = () => {
    if (!createdGroup) return;
    const text = encodeURIComponent(
      `🏃 Come run with me in Besok Lari challenge "${createdGroup.name}"! Goal: ${createdGroup.targetKm} KM. Enter Invite Code: ${createdGroup.inviteCode} in the app to join!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 relative max-h-[92vh] sm:max-h-none overflow-y-auto my-0 sm:my-8 animate-in slide-in-from-bottom duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Screen with Invite Code (Rule 7) */}
        {createdGroup ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center text-3xl shadow-sm">
              🎉
            </div>
            <div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                Challenge Created!
              </h2>
              <p className="text-xs text-stone-600 mt-1">{createdGroup.name}</p>
            </div>

            {/* Generated Group Code Card */}
            <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl p-5 my-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                INVITE CODE
              </span>
              <div className="text-3xl font-black font-mono tracking-wider text-emerald-950">
                {createdGroup.inviteCode}
              </div>
              <p className="text-[11px] text-emerald-700 mt-2">
                Share this code with your crew so they can join your challenge!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={copyCode}
                className="w-full py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Code & Invite'}</span>
              </button>

              <button
                type="button"
                onClick={shareWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share to WhatsApp</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 mt-2 block w-full cursor-pointer"
            >
              Done & View Challenge
            </button>
          </div>
        ) : (
          /* Form (Rule 7) */
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/30">
                🏁
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">
                  + Create Challenge Group
                </h2>
                <p className="text-xs text-stone-600">
                  You will be the <strong>Host / Creator</strong> with permission to approve run submissions in this group.
                </p>
              </div>
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
                  Challenge Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Besok Lari 10K"
                  required
                  className="w-full text-sm font-semibold rounded-xl border border-stone-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Besok Lari - Lace up, hit the pavement & conquer 10 KM together!"
                  rows={2}
                  className="w-full text-sm rounded-xl border border-stone-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Target Distance (KM) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={targetKm}
                      onChange={(e) => setTargetKm(e.target.value)}
                      placeholder="10"
                      required
                      className="w-full text-sm font-bold rounded-xl border border-stone-300 p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-emerald-700">
                      KM
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Max Runners (Optional)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="500"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder="25"
                    className="w-full text-sm font-medium rounded-xl border border-stone-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-sm font-medium rounded-xl border border-stone-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="w-full text-sm font-medium rounded-xl border border-stone-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Creating Challenge...' : '+ CREATE CHALLENGE'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
