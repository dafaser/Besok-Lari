import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Gauge,
  Trophy,
  Flame,
  Plus,
  RefreshCw,
  Send,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Award,
  Footprints,
} from 'lucide-react';
import { Activity, User } from '../types';
import { api } from '../services/api';
import { useToast } from './Toast';

interface FeedViewProps {
  currentUser: User;
  onOpenAddRun: () => void;
  onViewPhoto: (activity: Activity) => void;
  onViewChallenge?: (groupId: string) => void;
}

// Helper: Calculate relative time (e.g. "12m ago", "2h ago", "Kemarin", "3 hari lalu")
function formatTimeAgo(isoString: string): string {
  try {
    const now = new Date();
    const past = new Date(isoString);
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - past.getTime()) / 1000));

    if (diffSeconds < 60) return 'Baru saja';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} minggu lalu`;
    return past.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return 'Beberapa waktu lalu';
  }
}

// Helper: Format duration from minutes into e.g. "1h 28min" or "45m"
function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}min`;
  if (hrs > 0) return `${hrs} jam`;
  return `${mins}min`;
}

// Helper: Format pace (e.g. 5.1 km in 30 mins -> "5'52\" /km")
function formatPace(distanceKm: number, durationMinutes: number): string {
  if (!distanceKm || distanceKm <= 0 || !durationMinutes || durationMinutes <= 0) {
    return "-'--\" /km";
  }
  const paceDecimal = durationMinutes / distanceKm;
  const paceMins = Math.floor(paceDecimal);
  const paceSecs = Math.round((paceDecimal - paceMins) * 60);
  const formattedSecs = paceSecs < 10 ? `0${paceSecs}` : `${paceSecs}`;
  return `${paceMins}'${formattedSecs}" /km`;
}

export const FeedView: React.FC<FeedViewProps> = ({
  currentUser,
  onOpenAddRun,
  onViewPhoto,
  onViewChallenge,
}) => {
  const { showToast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'approved'>('all');

  // Comment input per activity
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});

  // Photo carousel index per activity
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({});

  // Heart celebration animation trigger
  const [likedAnimPostId, setLikedAnimPostId] = useState<string | null>(null);

  // Fetch all activities for feed
  const loadFeed = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const list = await api.getActivities();
      setActivities(list);
    } catch (err: any) {
      console.error('Failed to load feed activities:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  // Filter activities
  const displayedActivities = activities.filter((act) => {
    if (filterMode === 'approved') return act.status === 'APPROVED';
    // By default show approved & pending runs
    return act.status !== 'REJECTED';
  });

  // Handle Like
  const handleToggleLike = async (activity: Activity) => {
    // Optimistic UI update
    const currentLikes = activity.likes || [];
    const isLiked = currentLikes.includes(currentUser.id);
    const newLikes = isLiked
      ? currentLikes.filter((uid) => uid !== currentUser.id)
      : [...currentLikes, currentUser.id];

    if (!isLiked) {
      setLikedAnimPostId(activity.id);
      setTimeout(() => setLikedAnimPostId(null), 800);
    }

    setActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, likes: newLikes } : a))
    );

    try {
      await api.toggleLikeActivity(activity.id, currentUser.id);
    } catch (err) {
      // Revert on error
      setActivities((prev) =>
        prev.map((a) => (a.id === activity.id ? { ...a, likes: currentLikes } : a))
      );
      showToast('Gagal memberikan like.', 'error');
    }
  };

  // Double tap to like
  const lastTapRef = useRef<Record<string, number>>({});
  const handlePhotoDoubleTap = (activity: Activity) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[activity.id] || 0;
    if (now - lastTap < 350) {
      const currentLikes = activity.likes || [];
      if (!currentLikes.includes(currentUser.id)) {
        handleToggleLike(activity);
      } else {
        setLikedAnimPostId(activity.id);
        setTimeout(() => setLikedAnimPostId(null), 800);
      }
    }
    lastTapRef.current[activity.id] = now;
  };

  // Handle Submit Comment
  const handleSendComment = async (activityId: string) => {
    const text = (commentInputs[activityId] || '').trim();
    if (!text) return;

    setIsSubmittingComment((prev) => ({ ...prev, [activityId]: true }));
    try {
      const updated = await api.addComment(activityId, {
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        text,
      });

      setActivities((prev) =>
        prev.map((a) => (a.id === activityId ? { ...a, comments: updated.comments } : a))
      );
      setCommentInputs((prev) => ({ ...prev, [activityId]: '' }));
      showToast('Komentar berhasil dikirim! 💬', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim komentar.', 'error');
    } finally {
      setIsSubmittingComment((prev) => ({ ...prev, [activityId]: false }));
    }
  };

  const quickCheerEmojis = ['🔥 Keren!', '👟 Gaspol!', '💪 Semangat!', '⚡ Mantap!'];

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-24 md:pb-12">
      {/* Top Banner / Feed Header */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              FOR YOU PAGE · LINIMASA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Aktivitas Pelari</span>
            <span className="text-base">👟✨</span>
          </h1>
          <p className="text-xs text-stone-500 font-medium">
            Pantau rute, bukti lari, dan beri semangat sesama runner!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadFeed(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl border border-stone-200 hover:bg-stone-50 active:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
            title="Muat ulang linimasa"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onOpenAddRun}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Bagikan Lari</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs: Semua vs Terverifikasi */}
      <div className="flex items-center gap-2 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
            filterMode === 'all'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          ✨ Semua Aktivitas
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('approved')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
            filterMode === 'approved'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          ✓ Terverifikasi Saja
        </button>
      </div>

      {/* Feed Stream */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-stone-500">Memuat linimasa aktivitas pelari...</p>
        </div>
      ) : displayedActivities.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl mx-auto mb-3">
            🏃
          </div>
          <h3 className="text-base font-black text-stone-900">Belum Ada Aktivitas di Linimasa</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Jadilah pelari pertama yang mengunggah sesi lari dan meramaikan For You Page!
          </p>
          <button
            type="button"
            onClick={onOpenAddRun}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Unggah Catatan Lari Perdana</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedActivities.map((activity) => {
            const photos =
              activity.photoUrls && activity.photoUrls.length > 0
                ? activity.photoUrls
                : activity.photoUrl
                ? [activity.photoUrl]
                : [];
            const activePhotoIdx = carouselIndex[activity.id] || 0;
            const currentPhoto = photos[activePhotoIdx] || photos[0];
            const likesList = activity.likes || [];
            const isLikedByMe = likesList.includes(currentUser.id);
            const commentsList = activity.comments || [];
            const isCommentsOpen = Boolean(expandedComments[activity.id]);

            // Title fallback
            const postTitle =
              activity.note && activity.note.length < 35
                ? activity.note
                : `Sesi Lari ${activity.distanceKm} KM`;

            return (
              <article
                key={activity.id}
                className="bg-stone-950 text-white rounded-3xl border border-stone-800 shadow-xl overflow-hidden transition-all duration-200 hover:border-stone-700"
              >
                {/* 1. Card Top Header (Avatar, Username, Time Ago, Challenge Badge) */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      {((activity.userId === currentUser.id ? currentUser.avatar : null) || activity.userAvatar) ? (
                        <img
                          src={(activity.userId === currentUser.id ? currentUser.avatar : null) || activity.userAvatar}
                          alt={activity.username}
                          className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/80 shadow-md"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-stone-950 font-black text-sm flex items-center justify-center border-2 border-emerald-400 shadow-md">
                          {activity.username[0]?.toUpperCase() || 'R'}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 text-xs">
                        ⚡
                      </span>
                    </div>

                    {/* Username & Time */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm sm:text-base text-stone-100 truncate">
                          {activity.username}
                        </span>
                        {activity.userId === currentUser.id && (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                        <span>{formatTimeAgo(activity.createdAt)}</span>
                        <span>•</span>
                        <span>{activity.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Challenge Tag Pill */}
                  {activity.groupName && (
                    <button
                      type="button"
                      onClick={() => onViewChallenge && onViewChallenge(activity.groupId)}
                      className="shrink-0 max-w-[140px] sm:max-w-[180px] truncate text-[11px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                      title={activity.groupName}
                    >
                      <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{activity.groupName}</span>
                    </button>
                  )}
                </div>

                {/* 2. Workout Title & Note / Caption */}
                <div className="px-4 sm:px-5 pb-3">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                    {postTitle}
                  </h2>
                  {activity.note && activity.note !== postTitle && (
                    <p className="text-xs sm:text-sm text-stone-300 mt-1 leading-relaxed whitespace-pre-line font-medium">
                      {activity.note}
                    </p>
                  )}
                </div>

                {/* 3. Three-Column Metrics Bar (Matching Reference Screenshot: Time, Volume/Distance, Records/Pace) */}
                <div className="px-4 sm:px-5 py-3 border-t border-stone-800/80 bg-stone-900/60 grid grid-cols-3 gap-2">
                  {/* Metric 1: Time */}
                  <div>
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-0.5">
                      Time
                    </span>
                    <div className="text-sm sm:text-base font-black text-white font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatDuration(activity.durationMinutes)}</span>
                    </div>
                    <span className="text-[10px] text-stone-500">
                      {activity.startTime} - {activity.endTime}
                    </span>
                  </div>

                  {/* Metric 2: Distance */}
                  <div>
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-0.5">
                      Jarak
                    </span>
                    <div className="text-sm sm:text-base font-black text-emerald-400 font-mono flex items-center gap-1">
                      <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{Number(activity.distanceKm).toFixed(2)} KM</span>
                    </div>
                    <span className="text-[10px] text-stone-500">
                      Total Jarak Lari
                    </span>
                  </div>

                  {/* Metric 3: Pace / Record */}
                  <div>
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-0.5">
                      Pace Rata-rata
                    </span>
                    <div className="text-sm sm:text-base font-black text-amber-300 font-mono flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-amber-400" />
                      <span>{formatPace(activity.distanceKm, activity.durationMinutes)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {activity.status === 'APPROVED' ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Terverifikasi</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-bold">
                          ⏳ Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Large Visual Asset / Multi-Photo Carousel */}
                {photos.length > 0 && (
                  <div
                    className="relative w-full bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none group"
                    onClick={() => handlePhotoDoubleTap(activity)}
                  >
                    <div className="w-full max-h-[460px] aspect-[4/5] sm:aspect-[4/3] flex items-center justify-center bg-stone-900">
                      <img
                        src={currentPhoto}
                        alt="Bukti lari"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                        loading="lazy"
                        onClick={(e) => {
                          // Single click can also open modal if clicked directly on image icon
                          if (e.detail === 1) {
                            setTimeout(() => {
                              if (Date.now() - (lastTapRef.current[activity.id] || 0) > 300) {
                                onViewPhoto(activity);
                              }
                            }, 250);
                          }
                        }}
                      />
                    </div>

                    {/* Double Tap Heart Celebration Animation */}
                    {likedAnimPostId === activity.id && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <Heart className="w-24 h-24 text-rose-500 fill-rose-500 animate-ping opacity-90 drop-shadow-2xl" />
                      </div>
                    )}

                    {/* Multiple Photos Controls */}
                    {photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarouselIndex((prev) => ({
                              ...prev,
                              [activity.id]: (activePhotoIdx - 1 + photos.length) % photos.length,
                            }));
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-opacity cursor-pointer z-10"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarouselIndex((prev) => ({
                              ...prev,
                              [activity.id]: (activePhotoIdx + 1) % photos.length,
                            }));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-opacity cursor-pointer z-10"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Carousel Dots Indicators (as shown in reference screenshot) */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm z-10">
                          {photos.map((_, i) => (
                            <span
                              key={i}
                              className={`h-1.5 rounded-full transition-all ${
                                i === activePhotoIdx ? 'w-4 bg-emerald-400' : 'w-1.5 bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Enlarge Hint */}
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      🔍 Klik untuk perbesar
                    </div>
                  </div>
                )}

                {/* 5. Bottom Interactive Actions Bar (Like, Comment, Share) */}
                <div className="px-4 sm:px-5 py-3 border-t border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Like / Cheer Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleLike(activity)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-90 ${
                        isLikedByMe
                          ? 'text-rose-400 font-extrabold'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 transition-transform ${
                          isLikedByMe ? 'fill-rose-500 text-rose-500 scale-110' : ''
                        }`}
                      />
                      <span>{likesList.length > 0 ? likesList.length : 'Semangat'}</span>
                    </button>

                    {/* Comments Toggle Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [activity.id]: !prev[activity.id],
                        }))
                      }
                      className="flex items-center gap-1.5 text-xs font-bold text-stone-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{commentsList.length > 0 ? commentsList.length : 'Komentar'}</span>
                    </button>
                  </div>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(
                          `🏃 Sesi lari ${activity.username} sejauh ${activity.distanceKm} KM di Besok Lari! 🔥`
                        );
                        showToast('Tautan lari berhasil disalin ke clipboard! 📋', 'success');
                      }
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Bagikan sesi lari"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 6. Expandable Comments & Cheering Section */}
                {isCommentsOpen && (
                  <div className="px-4 sm:px-5 py-3.5 border-t border-stone-800 bg-stone-900/90 space-y-3 animate-in fade-in duration-150">
                    {/* Existing Comments List */}
                    {commentsList.length > 0 ? (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {commentsList.map((comm) => (
                          <div key={comm.id} className="flex items-start gap-2.5 text-xs">
                            {((comm.userId === currentUser.id ? currentUser.avatar : null) || comm.userAvatar) ? (
                              <img
                                src={(comm.userId === currentUser.id ? currentUser.avatar : null) || comm.userAvatar}
                                alt={comm.username}
                                className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {comm.username[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 bg-stone-800/80 rounded-2xl px-3 py-2 border border-stone-700/60">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-extrabold text-stone-200">
                                  {comm.username}
                                </span>
                                <span className="text-[10px] text-stone-500">
                                  {formatTimeAgo(comm.createdAt)}
                                </span>
                              </div>
                              <p className="text-stone-300 font-medium leading-relaxed">
                                {comm.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-stone-500 text-center py-1">
                        Belum ada komentar. Beri ucapan selamat atau semangat untuk pelari ini! ✨
                      </p>
                    )}

                    {/* Quick Cheer Emoji Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {quickCheerEmojis.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setCommentInputs((prev) => ({
                              ...prev,
                              [activity.id]: (prev[activity.id] ? `${prev[activity.id]} ` : '') + chip,
                            }));
                          }}
                          className="px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-[11px] font-bold text-stone-300 transition-colors cursor-pointer border border-stone-700/80"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Comment Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputs[activity.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [activity.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendComment(activity.id);
                          }
                        }}
                        placeholder="Tulis pesan penyemangat..."
                        className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendComment(activity.id)}
                        disabled={
                          isSubmittingComment[activity.id] ||
                          !(commentInputs[activity.id] || '').trim()
                        }
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                        title="Kirim"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
