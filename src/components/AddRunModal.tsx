import React, { useState, useEffect } from 'react';
import { X, Upload, Camera, AlertCircle } from 'lucide-react';
import { Group } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface AddRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    groupId: string;
    date: string;
    distanceKm: number;
    startTime: string;
    endTime: string;
    photoUrl: string;
    photoUrls?: string[];
    note?: string;
  }) => Promise<void>;
  groups: Group[];
  selectedGroupId?: string;
  onOpenJoinGroup?: () => void;
}

export const AddRunModal: React.FC<AddRunModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  groups,
  selectedGroupId,
  onOpenJoinGroup,
}) => {
  // Today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const [groupId, setGroupId] = useState(selectedGroupId || (groups[0]?.id || ''));
  const [date, setDate] = useState(todayStr);
  const [distanceKm, setDistanceKm] = useState<string>('2.5');
  const [startTime, setStartTime] = useState<string>('06:30');
  const [endTime, setEndTime] = useState<string>('07:05');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(35);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form inputs on open
  useEffect(() => {
    if (isOpen) {
      setPhotoUrls([]);
      setNote('');
      setErrorMsg(null);
      setIsCompressing(false);
    }
  }, [isOpen]);

  // Sync selectedGroupId
  useEffect(() => {
    if (selectedGroupId) {
      setGroupId(selectedGroupId);
    } else if (groups.length > 0 && !groupId) {
      setGroupId(groups[0].id);
    }
  }, [selectedGroupId, groups]);

  // Calculate duration automatically whenever startTime or endTime changes (Rule 15)
  useEffect(() => {
    if (!startTime || !endTime) {
      setDurationMinutes(0);
      setTimeError(null);
      return;
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
      setTimeError('Invalid time entered.');
      return;
    }

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal === endTotal) {
      setTimeError('End time must be after start time.');
      setDurationMinutes(0);
      return;
    }

    if (endTotal < startTotal) {
      setTimeError('End time must be after start time.');
      setDurationMinutes(0);
      return;
    }

    setTimeError(null);
    setDurationMinutes(endTotal - startTotal);
  }, [startTime, endTime]);

  if (!isOpen) return null;

  // Handle local image file upload (compresses and supports up to 3 photos, fitting comfortably in Firestore)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 3 - photoUrls.length;
    if (availableSlots <= 0) {
      setErrorMsg('Maksimal 3 foto bukti.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    for (const file of filesToProcess) {
      if (!file.type.match(/image\/(jpeg|png|webp|jpg)/i)) {
        setErrorMsg('File must be JPG, JPEG, PNG, or WEBP.');
        return;
      }
    }

    setIsCompressing(true);
    setErrorMsg(null);
    try {
      const compressedResults = await Promise.all(
        filesToProcess.map((file) => compressImage(file, 1080, 0.72))
      );
      setPhotoUrls((prev) => [...prev, ...compressedResults].slice(0, 3));
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses gambar bukti lari.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const dist = parseFloat(distanceKm);
    if (isNaN(dist) || dist <= 0) {
      setErrorMsg('Distance must be greater than 0.');
      return;
    }

    if (timeError) {
      setErrorMsg(timeError);
      return;
    }

    if (photoUrls.length === 0) {
      setErrorMsg('Please upload at least 1 photo proof (max 3).');
      return;
    }

    if (!groupId) {
      setErrorMsg('Please select an active challenge group.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        groupId,
        date,
        distanceKm: dist,
        startTime,
        endTime,
        photoUrl: photoUrls[0],
        photoUrls,
        note,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit run.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 relative max-h-[92vh] sm:max-h-none overflow-y-auto my-0 sm:my-8 animate-in slide-in-from-bottom duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/30">
            🏃
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Log Your Run
            </h2>
            <p className="text-xs text-stone-700 font-medium">
              Submit your miles and photo proof for the challenge host to verify
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl mx-auto mb-3">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-stone-900">No Challenge Joined Yet</h3>
            <p className="text-xs text-stone-600 mt-1 mb-5">
              You need to join a challenge first before logging any miles. Grab an invite code from a friend or challenge host!
            </p>
            <div className="flex items-center justify-center gap-3">
              {onOpenJoinGroup && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenJoinGroup();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 cursor-pointer"
                >
                  + Enter Invite Code
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Group selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Select Challenge
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full text-sm font-semibold rounded-xl border border-stone-300 p-3 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (Goal: {g.targetKm} KM)
                  </option>
                ))}
              </select>
            </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Run Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-sm font-medium rounded-xl border border-stone-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>

            {/* Distance Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Distance (KM)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="2.5"
                  required
                  className="w-full text-sm font-bold rounded-xl border border-stone-300 p-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-emerald-700">
                  KM
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {['2', '3', '5', '10'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDistanceKm(preset)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      distanceKm === preset
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {preset}K
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full text-sm font-medium rounded-xl border border-stone-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className={`w-full text-sm font-medium rounded-xl border p-2.5 focus:outline-none focus:ring-2 ${
                  timeError
                    ? 'border-rose-300 focus:ring-rose-500/30 focus:border-rose-500 bg-rose-50/50'
                    : 'border-stone-300 focus:ring-emerald-500/30 focus:border-emerald-600'
                }`}
              />
            </div>
          </div>

          {/* Automatic Duration display (Rule 15) */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              Auto-Calculated Duration:
            </span>
            <span className="text-sm font-black font-mono text-emerald-900">
              {timeError ? (
                <span className="text-rose-600 text-xs font-bold">{timeError}</span>
              ) : (
                `${durationMinutes} Mins`
              )}
            </span>
          </div>

          {/* Photo Proof Upload - Up to 3 photos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Upload Run Photo Proof * <span className="text-emerald-700 font-bold">({photoUrls.length}/3)</span>
              </label>
              <span className="text-[11px] text-stone-500">Maks. 3 Foto (JPG, PNG, WEBP)</span>
            </div>

            {/* Uploaded photos preview grid */}
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                {photoUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-emerald-500 shadow-xs aspect-square bg-stone-100">
                    <img
                      src={url}
                      alt={`Bukti lari ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-stone-900/80 text-white font-mono text-[9px] font-bold">
                      #{idx + 1}{idx === 0 ? ' (Utama)' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-90"
                      title="Hapus foto ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Photo upload dropzone (visible if < 3 photos) */}
            {photoUrls.length < 3 ? (
              <div className="relative border-2 border-dashed border-stone-300 rounded-2xl p-4 bg-stone-50 text-center hover:bg-stone-100/80 transition-colors">
                <div className="py-4 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-2xs border border-emerald-100">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-stone-800">
                    {isCompressing
                      ? 'Sedang mengompres foto...'
                      : photoUrls.length === 0
                      ? 'Tap untuk unggah foto bukti lari'
                      : `+ Tambah foto bukti (${photoUrls.length}/3)`}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {isCompressing
                      ? 'Mengoptimalkan ukuran agar kilat & tidak error...'
                      : 'Bisa unggah hingga 3 foto (GPS watch, aplikasi lari, atau selfie)'}
                  </p>
                </div>

                <input
                  type="file"
                  multiple
                  disabled={isCompressing}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs font-semibold text-emerald-800">
                ✓ Maksimal 3 foto bukti telah dipilih
              </div>
            )}
          </div>

          {/* Note (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Run Notes (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Easy morning jog, great weather and felt energetic!"
              className="w-full text-sm rounded-xl border border-stone-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isCompressing || !!timeError}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Submitting your run...</span>
              ) : isCompressing ? (
                <span>Mengompres foto...</span>
              ) : (
                <>
                  <span>SUBMIT RUN</span>
                  <span className="text-emerald-200 text-xs">➔ Waiting Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
      </div>
    </div>
  );
};
