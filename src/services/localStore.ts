import {
  INITIAL_USERS,
  INITIAL_GROUPS,
  INITIAL_ACTIVITIES,
  INITIAL_MEMBERSHIPS,
  INITIAL_ACHIEVEMENTS,
} from '../mockData';
import {
  User,
  Group,
  Activity,
  Achievement,
  LeaderboardEntry,
  GroupProgressStats,
  UserStats,
} from '../types';
import { GroupDetailResponse, UserStatsResponse } from './api';

const STORAGE_KEY = 'besok_lari_local_db_v1';

interface LocalDatabaseState {
  users: (User & { password?: string })[];
  groups: Group[];
  memberships: typeof INITIAL_MEMBERSHIPS;
  activities: Activity[];
  achievements: Achievement[];
}

function getInitialDbState(): LocalDatabaseState {
  return {
    users: JSON.parse(JSON.stringify(INITIAL_USERS)),
    groups: JSON.parse(JSON.stringify(INITIAL_GROUPS)),
    memberships: JSON.parse(JSON.stringify(INITIAL_MEMBERSHIPS)),
    activities: JSON.parse(JSON.stringify(INITIAL_ACTIVITIES)),
    achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
  };
}

function getDb(): LocalDatabaseState {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (e) {
    console.error('Failed reading local storage db', e);
  }
  const initial = getInitialDbState();
  if (typeof localStorage !== 'undefined') {
    saveDb(initial);
  }
  return initial;
}

function saveDb(state: LocalDatabaseState) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.error('Failed writing local storage db', e);
  }
}

function calculateStreak(userId: string, activities: Activity[]): number {
  const approved = activities
    .filter((a) => a.userId === userId && a.status === 'APPROVED')
    .map((a) => a.date)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort()
    .reverse();

  if (approved.length === 0) return 0;

  let streak = 1;
  for (let i = 0; i < approved.length - 1; i++) {
    const current = new Date(approved[i]);
    const prev = new Date(approved[i + 1]);
    const diffDays = Math.round((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function calculateLeaderboard(
  groupId: string,
  activities: Activity[],
  memberships: typeof INITIAL_MEMBERSHIPS,
  users: User[],
  targetKm: number
): LeaderboardEntry[] {
  const groupMemberIds = memberships.filter((m) => m.groupId === groupId).map((m) => m.userId);

  const entries: LeaderboardEntry[] = groupMemberIds.map((userId) => {
    const user = users.find((u) => u.id === userId);
    const username = user ? user.username : 'Unknown';
    const userApprovedActivities = activities.filter(
      (a) => a.groupId === groupId && a.userId === userId && a.status === 'APPROVED'
    );
    const totalApprovedKm = Number(
      userApprovedActivities.reduce((sum, a) => sum + Number(a.distanceKm), 0).toFixed(1)
    );
    const progressPercent = Math.min(100, Math.round((totalApprovedKm / (targetKm || 10)) * 100));
    const isCompleted = totalApprovedKm >= targetKm;
    const lastRunDate =
      userApprovedActivities.length > 0
        ? userApprovedActivities.sort((a, b) => b.date.localeCompare(a.date))[0].date
        : undefined;

    return {
      userId,
      username,
      avatar: user?.avatar,
      totalApprovedKm,
      targetKm,
      progressPercent,
      isCompleted,
      rank: 0,
      approvedRunsCount: userApprovedActivities.length,
      lastRunDate,
    };
  });

  entries.sort((a, b) => {
    if (b.totalApprovedKm !== a.totalApprovedKm) {
      return b.totalApprovedKm - a.totalApprovedKm;
    }
    return b.approvedRunsCount - a.approvedRunsCount;
  });

  entries.forEach((e, idx) => {
    e.rank = idx + 1;
  });

  return entries;
}

function calculateGroupStats(
  groupId: string,
  activities: Activity[],
  memberships: typeof INITIAL_MEMBERSHIPS,
  group: Group
): GroupProgressStats {
  const groupMemberIds = memberships.filter((m) => m.groupId === groupId).map((m) => m.userId);
  const approved = activities.filter((a) => a.groupId === groupId && a.status === 'APPROVED');
  const pending = activities.filter((a) => a.groupId === groupId && a.status === 'PENDING');

  const totalApprovedKm = Number(
    approved.reduce((sum, a) => sum + Number(a.distanceKm), 0).toFixed(1)
  );
  const participantsCount = groupMemberIds.length;
  const targetCollectiveKm = group.targetKm * participantsCount;
  const collectiveProgressPercent =
    targetCollectiveKm > 0
      ? Math.min(100, Math.round((totalApprovedKm / targetCollectiveKm) * 100))
      : 0;
  const averageKmPerParticipant =
    participantsCount > 0 ? Number((totalApprovedKm / participantsCount).toFixed(2)) : 0;

  let completedCount = 0;
  groupMemberIds.forEach((uid) => {
    const userKm = activities
      .filter((a) => a.groupId === groupId && a.userId === uid && a.status === 'APPROVED')
      .reduce((sum, a) => sum + Number(a.distanceKm), 0);
    if (userKm >= group.targetKm) {
      completedCount++;
    }
  });

  return {
    totalApprovedKm,
    targetCollectiveKm,
    collectiveProgressPercent,
    participantsCount,
    completedParticipantsCount: completedCount,
    averageKmPerParticipant,
    pendingApprovalsCount: pending.length,
  };
}

export const localStore = {
  login(username: string, password?: string): User {
    const db = getDb();
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      throw new Error('Masukkan username kamu.');
    }
    const cleanPassword = (password || '').trim();
    if (!cleanPassword) {
      throw new Error('Masukkan password kamu.');
    }

    const found = db.users.find(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (!found) {
      throw new Error(`Username "${cleanUsername}" belum terdaftar. Silakan daftar terlebih dahulu atau periksa salah input.`);
    }

    // Check password
    if (found.password && found.password !== cleanPassword) {
      throw new Error('Password yang kamu masukkan salah. Silakan coba lagi.');
    }

    if (!found.password && cleanPassword) {
      found.password = cleanPassword;
      saveDb(db);
    }

    const { password: _, ...safeUser } = found;
    return safeUser;
  },

  register(username: string, password?: string, role?: 'USER' | 'CREATOR'): User {
    const db = getDb();
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      throw new Error('Masukkan username kamu.');
    }
    const cleanPassword = (password || '').trim();
    if (!cleanPassword || cleanPassword.length < 4) {
      throw new Error('Password minimal 4 karakter yaa biar aman.');
    }

    const existing = db.users.find(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (existing) {
      throw new Error(`Username "${cleanUsername}" sudah terdaftar. Silakan gunakan username lain atau silakan masuk.`);
    }

    const newUser: User & { password?: string } = {
      id: `user_${Date.now()}`,
      username: cleanUsername,
      name: cleanUsername,
      role: role || 'USER',
      password: cleanPassword,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDb(db);
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  },

  getUsers(): User[] {
    const db = getDb();
    return db.users.map(({ password: _, ...u }) => u);
  },

  upsertUser(user: User & { password?: string }): void {
    const db = getDb();
    const idx = db.users.findIndex(
      (u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase()
    );
    if (idx >= 0) {
      db.users[idx] = { ...db.users[idx], ...user };
    } else {
      db.users.push(user);
    }
    saveDb(db);
  },

  updateProfile(userId: string, data: { username?: string; password?: string; avatar?: string | null }): User {
    const db = getDb();
    let user = db.users.find((u) => u.id === userId);

    if (!user) {
      // Fallback 1: check by username if current user was stored in localStorage
      const currentRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('funrun_user') : null;
      const currentUser = currentRaw ? JSON.parse(currentRaw) : null;
      if (currentUser && (currentUser.id === userId || currentUser.username)) {
        user = db.users.find((u) => u.username.toLowerCase() === currentUser.username.toLowerCase());
        if (!user) {
          user = {
            id: currentUser.id || userId,
            username: currentUser.username,
            name: currentUser.name || currentUser.username,
            role: currentUser.role || 'USER',
            avatar: currentUser.avatar,
            createdAt: currentUser.createdAt || new Date().toISOString(),
          };
          db.users.push(user);
        }
      }
    }

    if (!user && (data as any).currentUsername) {
      user = db.users.find((u) => u.username.toLowerCase() === (data as any).currentUsername.toLowerCase());
    }

    if (!user) {
      const fallbackName = (data.username || (data as any).currentUsername || 'Runner').trim();
      user = {
        id: userId,
        username: fallbackName,
        name: fallbackName,
        role: 'USER',
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
    }

    if (data.username && data.username.trim() !== user.username) {
      const trimmed = data.username.trim();
      const exists = db.users.some(
        (u) => u.id !== user!.id && u.username.toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) throw new Error('Username is already taken by another runner.');
      user.username = trimmed;
      user.name = trimmed;

      db.activities.forEach((a) => {
        if (a.userId === userId || a.userId === user!.id) a.username = trimmed;
      });
      db.groups.forEach((g) => {
        if (g.creatorId === userId || g.creatorId === user!.id) g.creatorUsername = trimmed;
      });
    }

    if (data.password && data.password.trim()) {
      if (data.password.trim().length < 4) {
        throw new Error('Password must be at least 4 characters long.');
      }
      user.password = data.password.trim();
    }

    if (data.avatar !== undefined) {
      if (data.avatar && data.avatar.trim()) {
        user.avatar = data.avatar.trim();
      } else {
        delete user.avatar;
      }
    }

    saveDb(db);
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  getGroups(userId?: string): Group[] {
    const db = getDb();
    let groups = db.groups;
    if (userId) {
      groups = groups.filter((g) => !(g.kickedUserIds || []).includes(userId));
    }

    return groups.map((g) => {
      const isMember = userId ? db.memberships.some((m) => m.groupId === g.id && m.userId === userId) : false;
      const isCreator = userId ? g.creatorId === userId : false;

      const userApprovedActivities = userId
        ? db.activities.filter((a) => a.groupId === g.id && a.userId === userId && a.status === 'APPROVED')
        : [];
      const userProgress = Number(
        userApprovedActivities.reduce((sum, a) => sum + Number(a.distanceKm), 0).toFixed(1)
      );
      const userProgressPercent = Math.min(100, Math.round((userProgress / (g.targetKm || 10)) * 100));

      return {
        ...g,
        isMember: isMember || isCreator,
        isCreator,
        userProgress,
        userProgressPercent,
      };
    });
  },

  getGroupDetail(groupId: string, userId?: string): GroupDetailResponse {
    const db = getDb();
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) throw new Error('Group not found');

    if (userId && (group.kickedUserIds || []).includes(userId)) {
      throw new Error('Anda telah dikeluarkan dari challenge ini oleh host.');
    }

    const isMember = userId ? db.memberships.some((m) => m.groupId === group.id && m.userId === userId) : false;
    const isCreator = userId ? group.creatorId === userId : false;

    const stats = calculateGroupStats(groupId, db.activities, db.memberships, group);
    const leaderboard = calculateLeaderboard(groupId, db.activities, db.memberships, db.users, group.targetKm);

    const groupMemberships = db.memberships.filter((m) => m.groupId === groupId);
    const members = groupMemberships.map((m) => {
      const u = db.users.find((user) => user.id === m.userId);
      const userActs = db.activities.filter(
        (a) => a.groupId === groupId && a.userId === m.userId && a.status === 'APPROVED'
      );
      const totalKm = Number(userActs.reduce((sum, a) => sum + Number(a.distanceKm), 0).toFixed(1));
      return {
        userId: m.userId,
        username: u ? u.username : 'Unknown',
        avatar: u?.avatar,
        joinedAt: m.joinedAt,
        totalApprovedKm: totalKm,
        progressPercent: Math.min(100, Math.round((totalKm / group.targetKm) * 100)),
        isCompleted: totalKm >= group.targetKm,
      };
    });

    const activeMemberIds = new Set(groupMemberships.map((m) => m.userId));
    if (group.creatorId) activeMemberIds.add(group.creatorId);

    const recentApproved = db.activities
      .filter((a) => a.groupId === groupId && a.status === 'APPROVED' && activeMemberIds.has(a.userId))
      .map((a) => {
        const u = db.users.find((user) => user.id === a.userId);
        const resolvedName =
          (a.username && a.username.toLowerCase() !== 'runner' && a.username.toLowerCase() !== 'pelari' ? a.username : '') ||
          u?.username ||
          'Pelari';
        return {
          ...a,
          username: resolvedName,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);

    return {
      group: {
        ...group,
        isMember: isMember || isCreator,
        isCreator,
      },
      stats,
      leaderboard,
      members,
      recentApprovedActivities: recentApproved,
    };
  },

  createGroup(data: {
    name: string;
    description: string;
    targetKm: number;
    startDate: string;
    deadline: string;
    maxParticipants?: number | null;
    creatorId: string;
  }): Group {
    const db = getDb();
    const creator = db.users.find((u) => u.id === data.creatorId);
    const inviteCode = `BESOK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newGroup: Group = {
      id: `group_${Date.now()}`,
      name: data.name,
      description: data.description,
      targetKm: Number(data.targetKm),
      startDate: data.startDate,
      deadline: data.deadline,
      creatorId: data.creatorId,
      creatorUsername: creator ? creator.username : 'Creator',
      inviteCode,
      maxParticipants: data.maxParticipants || null,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      isMember: true,
      isCreator: true,
      userProgress: 0,
      userProgressPercent: 0,
    };

    db.groups.push(newGroup);
    db.memberships.push({
      id: `mem_${Date.now()}`,
      groupId: newGroup.id,
      userId: data.creatorId,
      joinedAt: new Date().toISOString(),
    });

    saveDb(db);
    return newGroup;
  },

  joinGroup(inviteCode: string, userId: string): { message: string; group: Group } {
    const db = getDb();
    const cleanCode = inviteCode.trim().toUpperCase();
    const group = db.groups.find((g) => g.inviteCode.toUpperCase() === cleanCode);
    if (!group) throw new Error('Invalid invite code');

    // Block kicked users from rejoining
    if ((group.kickedUserIds || []).includes(userId)) {
      throw new Error('Anda telah dikeluarkan dari challenge ini oleh host dan tidak dapat bergabung kembali.');
    }

    const alreadyMember = db.memberships.some((m) => m.groupId === group.id && m.userId === userId);
    if (!alreadyMember) {
      db.memberships.push({
        id: `mem_${Date.now()}`,
        groupId: group.id,
        userId,
        joinedAt: new Date().toISOString(),
      });
      saveDb(db);
    }

    return { message: 'Successfully joined group', group };
  },

  editGroup(groupId: string, data: any): Group {
    const db = getDb();
    const idx = db.groups.findIndex((g) => g.id === groupId);
    if (idx === -1) throw new Error('Group not found');

    db.groups[idx] = { ...db.groups[idx], ...data };
    saveDb(db);
    return db.groups[idx];
  },

  deleteGroup(groupId: string, userId: string): { message: string; deletedGroupId: string } {
    const db = getDb();
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) throw new Error('Group not found');
    if (group.creatorId !== userId) throw new Error('Unauthorized');

    db.groups = db.groups.filter((g) => g.id !== groupId);
    db.memberships = db.memberships.filter((m) => m.groupId !== groupId);
    db.activities = db.activities.filter((a) => a.groupId !== groupId);

    saveDb(db);
    return { message: 'Group deleted successfully', deletedGroupId: groupId };
  },

  removeParticipant(groupId: string, userId: string, requestingUserId: string): { message: string } {
    const db = getDb();
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) throw new Error('Group not found');
    const reqUser = db.users.find((u) => u.id === requestingUserId);
    const isPrivileged =
      group.creatorId === requestingUserId ||
      userId === requestingUserId ||
      reqUser?.role === 'CREATOR' ||
      reqUser?.role === 'ADMIN' ||
      reqUser?.username.toLowerCase() === 'admin' ||
      reqUser?.username.toLowerCase() === 'dafasr';

    if (!isPrivileged) {
      throw new Error('Unauthorized');
    }

    // 1. Mark user as kicked in group
    if (!group.kickedUserIds) {
      group.kickedUserIds = [];
    }
    if (!group.kickedUserIds.includes(userId)) {
      group.kickedUserIds.push(userId);
    }

    // 2. Remove memberships
    db.memberships = db.memberships.filter((m) => !(m.groupId === groupId && m.userId === userId));

    // 3. Remove ALL activities and running history for this user in this group
    db.activities = db.activities.filter((a) => !(a.groupId === groupId && a.userId === userId));

    saveDb(db);
    return { message: 'Participant removed successfully' };
  },

  getActivities(params?: {
    groupId?: string;
    userId?: string;
    status?: string;
    creatorId?: string;
  }): Activity[] {
    const db = getDb();
    let result = [...db.activities];

    if (params?.groupId) {
      result = result.filter((a) => a.groupId === params.groupId);
    }
    if (params?.userId) {
      result = result.filter((a) => a.userId === params.userId);
    }
    if (params?.status) {
      result = result.filter((a) => a.status === params.status);
    }
    if (params?.creatorId) {
      const createdGroupIds = db.groups
        .filter((g) => g.creatorId === params.creatorId)
        .map((g) => g.id);
      result = result.filter((a) => createdGroupIds.includes(a.groupId));
    }

    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  upsertGroup(group: Group): void {
    const db = getDb();
    const idx = db.groups.findIndex((g) => g.id === group.id);
    if (idx >= 0) {
      db.groups[idx] = { ...db.groups[idx], ...group };
    } else {
      db.groups.unshift(group);
    }
    saveDb(db);
  },

  upsertActivity(activity: Activity): void {
    const db = getDb();
    const idx = db.activities.findIndex((a) => a.id === activity.id);
    if (idx >= 0) {
      db.activities[idx] = { ...db.activities[idx], ...activity };
    } else {
      // Deduplication: if an equivalent activity already exists with a different temporary id, update it
      const dupIdx = db.activities.findIndex(
        (a) =>
          a.userId === activity.userId &&
          a.groupId === activity.groupId &&
          a.date === activity.date &&
          a.startTime === activity.startTime &&
          a.endTime === activity.endTime &&
          Math.abs(Number(a.distanceKm) - Number(activity.distanceKm)) < 0.01
      );
      if (dupIdx >= 0) {
        db.activities[dupIdx] = { ...db.activities[dupIdx], ...activity };
      } else {
        db.activities.unshift(activity);
      }
    }
    saveDb(db);
  },

  submitActivity(activityData: {
    groupId: string;
    userId: string;
    username?: string;
    date: string;
    distanceKm: number;
    startTime: string;
    endTime: string;
    photoUrl: string;
    photoUrls?: string[];
    note?: string;
  }): { message: string; activity: Activity } {
    const db = getDb();

    // Deduplication check: check if activity already exists in local DB
    const existing = db.activities.find(
      (a) =>
        a.userId === activityData.userId &&
        a.groupId === activityData.groupId &&
        a.date === activityData.date &&
        a.startTime === activityData.startTime &&
        a.endTime === activityData.endTime &&
        Math.abs(Number(a.distanceKm) - Number(activityData.distanceKm)) < 0.01
    );
    if (existing) {
      return { message: 'Activity already submitted', activity: existing };
    }

    const user = db.users.find((u) => u.id === activityData.userId);
    const group = db.groups.find((g) => g.id === activityData.groupId);

    // Calculate actual duration in minutes
    const [startH, startM] = activityData.startTime.split(':').map(Number);
    const [endH, endM] = activityData.endTime.split(':').map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    const durationMinutes = Math.max(1, endMinutes - startMinutes);

    const isSuspicious = Number(activityData.distanceKm) > 42;
    const suspiciousReason = isSuspicious ? 'Distance unusually long (>42 km)' : null;

    const resolvedUsername =
      activityData.username ||
      user?.username ||
      'Pelari';

    const newActivity: Activity = {
      id: `act_${Date.now()}`,
      groupId: activityData.groupId,
      groupName: group ? group.name : undefined,
      userId: activityData.userId,
      username: resolvedUsername,
      date: activityData.date,
      distanceKm: Number(activityData.distanceKm),
      startTime: activityData.startTime,
      endTime: activityData.endTime,
      durationMinutes,
      photoUrl: activityData.photoUrl,
      photoUrls: activityData.photoUrls || (activityData.photoUrl ? [activityData.photoUrl] : []),
      note: activityData.note,
      status: 'PENDING',
      isSuspicious,
      suspiciousReason,
      createdAt: new Date().toISOString(),
    };

    db.activities.unshift(newActivity);
    saveDb(db);
    return { message: 'Activity submitted successfully', activity: newActivity };
  },

  approveActivity(activityId: string, creatorId: string): { message: string; activity: Activity } {
    const db = getDb();
    const act = db.activities.find((a) => a.id === activityId);
    if (!act) throw new Error('Activity not found');

    act.status = 'APPROVED';
    act.approvedBy = creatorId;
    act.approvedAt = new Date().toISOString();
    act.rejectionReason = null;

    saveDb(db);
    return { message: 'Activity approved', activity: act };
  },

  rejectActivity(
    activityId: string,
    creatorId: string,
    rejectionReason?: string
  ): { message: string; activity: Activity } {
    const db = getDb();
    const act = db.activities.find((a) => a.id === activityId);
    if (!act) throw new Error('Activity not found');

    act.status = 'REJECTED';
    act.approvedBy = creatorId;
    act.approvedAt = new Date().toISOString();
    act.rejectionReason = rejectionReason || 'Run metrics did not meet verification criteria';

    saveDb(db);
    return { message: 'Activity rejected', activity: act };
  },

  getUserStats(userId: string): UserStatsResponse {
    const db = getDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const approvedActs = db.activities.filter((a) => a.userId === userId && a.status === 'APPROVED');
    const totalKm = Number(approvedActs.reduce((sum, a) => sum + Number(a.distanceKm), 0).toFixed(1));
    const totalRuns = approvedActs.length;
    const currentStreak = calculateStreak(userId, db.activities);

    const userGroupMemberships = db.memberships.filter((m) => m.userId === userId);
    let challengesCompleted = 0;
    userGroupMemberships.forEach((m) => {
      const g = db.groups.find((grp) => grp.id === m.groupId);
      if (!g) return;
      const groupKm = db.activities
        .filter((a) => a.groupId === g.id && a.userId === userId && a.status === 'APPROVED')
        .reduce((sum, a) => sum + Number(a.distanceKm), 0);
      if (groupKm >= g.targetKm) {
        challengesCompleted++;
      }
    });

    const longestRun = approvedActs.length > 0
      ? Math.max(...approvedActs.map((a) => Number(a.distanceKm)))
      : 0;

    const stats: UserStats = {
      totalKm,
      totalRuns,
      challengesJoined: userGroupMemberships.length,
      challengesCompleted,
      longestRun: Number(longestRun.toFixed(1)),
      currentStreak,
    };

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      stats,
      achievements: db.achievements,
    };
  },

  resetDemo(): void {
    const initial = getInitialDbState();
    saveDb(initial);
  },
};
