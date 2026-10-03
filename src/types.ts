export interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  role?: 'USER' | 'CREATOR' | 'ADMIN';
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  targetKm: number;
  startDate: string; // YYYY-MM-DD
  deadline: string; // ISO or YYYY-MM-DDTHH:mm:ss
  creatorId: string;
  creatorUsername: string;
  inviteCode: string;
  maxParticipants?: number | null;
  kickedUserIds?: string[];
  status: 'UPCOMING' | 'ACTIVE' | 'CLOSED';
  createdAt: string;
  isMember?: boolean;
  isCreator?: boolean;
  userProgress?: number;
  userProgressPercent?: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: string;
}

export type ActivityStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ActivityComment {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  groupId: string;
  groupName?: string;
  userId: string;
  username: string;
  userAvatar?: string;
  date: string; // YYYY-MM-DD
  distanceKm: number;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  photoUrl: string;
  photoUrls?: string[];
  note?: string;
  status: ActivityStatus;
  rejectionReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  isSuspicious?: boolean;
  suspiciousReason?: string | null;
  likes?: string[]; // Array of user IDs who liked the post
  comments?: ActivityComment[];
  createdAt: string;
}

export type AchievementType =
  | 'FIRST_RUN'
  | 'TARGET_ACHIEVED'
  | '3_DAY_STREAK'
  | '7_DAY_STREAK'
  | 'EARLY_BIRD'
  | 'NIGHT_RUNNER'
  | 'CHALLENGE_FINISHER';

export interface Achievement {
  id: string;
  userId: string;
  groupId?: string;
  achievementType: AchievementType;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface UserStats {
  totalKm: number;
  totalRuns: number;
  challengesJoined: number;
  challengesCompleted: number;
  longestRun: number;
  currentStreak: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  totalApprovedKm: number;
  targetKm: number;
  progressPercent: number;
  isCompleted: boolean;
  rank: number;
  approvedRunsCount: number;
  lastRunDate?: string;
}

export interface GroupProgressStats {
  totalApprovedKm: number;
  targetCollectiveKm: number;
  collectiveProgressPercent: number;
  participantsCount: number;
  completedParticipantsCount: number;
  averageKmPerParticipant: number;
  pendingApprovalsCount: number;
}
