import React, { useState } from 'react';
import { X, Camera, Trash2, Lock, User as UserIcon, Eye, EyeOff, Check, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { User } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface EditProfileModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onUpdateProfile: (data: {
    username?: string;
    password?: string;
    avatar?: string | null;
  }) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUpdateProfile,
  onShowToast,
}) => {
  const [username, setUsername] = useState(currentUser.username);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(currentUser.avatar || null);
  const [isPhotoChanged, setIsPhotoChanged] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state whenever modal opens or currentUser changes
  React.useEffect(() => {
    if (isOpen) {
      setUsername(currentUser.username);
      setNewPassword('');
      setShowPassword(false);
      setAvatar(currentUser.avatar || null);
      setIsPhotoChanged(false);
      setIsCompressing(false);
      setErrorMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|png|webp|jpg)/i)) {
      setErrorMsg('Format foto harus berupa JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran foto maksimal 15 MB.');
      return;
    }

    setIsCompressing(true);
    setErrorMsg(null);
    try {
      // Compress avatar to 400x400 max, ~25-45KB crisp image
      const compressedDataUrl = await compressImage(file, 400, 0.82);
      setAvatar(compressedDataUrl);
      setIsPhotoChanged(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses foto profil.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = () => {
    setAvatar(null);
    setIsPhotoChanged(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMsg('Username tidak boleh kosong.');
      return;
    }

    if (newPassword && newPassword.trim().length < 4) {
      setErrorMsg('Password baru minimal 4 karakter.');
      return;
    }

    const updatePayload: {
      username?: string;
      password?: string;
      avatar?: string | null;
    } = {};

    if (trimmedUsername !== currentUser.username) {
      updatePayload.username = trimmedUsername;
    }

    if (newPassword.trim()) {
      updatePayload.password = newPassword.trim();
    }

    if (isPhotoChanged) {
      updatePayload.avatar = avatar;
    }

    // Check if anything changed
    if (
      !updatePayload.username &&
      !updatePayload.password &&
      updatePayload.avatar === undefined
    ) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateProfile(updatePayload);
      onShowToast('Profil berhasil diperbarui!', 'success');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-600/20">
            ⚙️
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Pengaturan Profil
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Ubah foto profil, username, atau password baru
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* PHOTO PROFILE SECTION (Add, Edit, Delete) */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-3 text-center sm:text-left">
              Foto Profil
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview */}
              <div className="relative group shrink-0">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile Avatar"
                    className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-emerald-500 ring-2 ring-emerald-500/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-md">
                    {username[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Photo Action Buttons */}
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="relative">
                  <input
                    type="file"
                    id="profile-photo-upload"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileUpload}
                    disabled={isCompressing || isSubmitting}
                    className="sr-only"
                  />
                  <label
                    htmlFor={isCompressing || isSubmitting ? undefined : 'profile-photo-upload'}
                    className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-bold shadow-2xs transition-colors w-full sm:w-auto ${
                      isCompressing || isSubmitting
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:border-emerald-500 hover:text-emerald-700 cursor-pointer'
                    }`}
                  >
                    {isCompressing ? (
                      <>
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                        <span>Mengompres Foto...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>{avatar ? 'Ganti Foto' : 'Unggah Foto'}</span>
                      </>
                    )}
                  </label>
                </div>

                {avatar && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={isCompressing || isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 text-rose-700 text-xs font-bold transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-stone-400 mt-2.5 text-center sm:text-left">
              Format: JPG, PNG, WEBP. Otomatis dikompresi agar jernih & ringan.
            </p>
          </div>

          {/* USERNAME INPUT */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Username baru"
                className="w-full text-sm font-semibold rounded-xl border border-stone-300 p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
              <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Username akan tampil pada tantangan dan leaderboard.
            </p>
          </div>

          {/* NEW PASSWORD INPUT (No old password needed!) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Password Baru (Opsional)
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Tanpa Password Lama
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kosongkan jika tidak ingin ganti password"
                className="w-full text-sm font-semibold rounded-xl border border-stone-300 p-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              💡 Cukup ketik password baru jika ingin mengubah. Tidak perlu memasukkan password lama.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : isCompressing ? (
                <span>Mengompres Foto...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
