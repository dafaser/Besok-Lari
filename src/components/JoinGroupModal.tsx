import React, { useState } from 'react';
import { X, Users, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { Group } from '../types';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (inviteCode: string) => Promise<Group>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  availableGroups?: Group[];
  initialCode?: string;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onJoin,
  onShowToast,
  availableGroups = [],
  initialCode = '',
}) => {
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setInviteCode(initialCode || '');
      setErrorMsg(null);
    }
  }, [isOpen, initialCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setErrorMsg('Please enter an invite code.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const joined = await onJoin(inviteCode.trim());
      onShowToast(`Joined "${joined.name}"! Let's get running!`, 'success');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not join challenge.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (code: string) => {
    setInviteCode(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 relative max-h-[92vh] sm:max-h-none overflow-y-auto my-0 sm:my-8 animate-in slide-in-from-bottom duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/30">
            🤝
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              + JOIN CHALLENGE
            </h2>
            <p className="text-xs text-stone-600">
              Enter the invite code from your friend or running club
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
              Invite Code *
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. BESOK-7X92"
              required
              className="w-full text-base font-mono font-bold uppercase tracking-wider rounded-xl border border-stone-300 p-3 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            />
          </div>

          {/* Quick preset selector for testing convenience */}
          {availableGroups.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                Or pick an open challenge:
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {availableGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleQuickSelect(g.inviteCode)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      inviteCode === g.inviteCode
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold block">{g.name}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Goal: {g.targetKm} KM • Code: {g.inviteCode}
                      </span>
                    </div>
                    {inviteCode === g.inviteCode && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !inviteCode}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Joining...' : 'JOIN CHALLENGE'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
