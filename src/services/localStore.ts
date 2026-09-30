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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading local storage db', e);
  }
  const initial = getInitialDbState();
  saveDb(initial);
  return initial;
}

function saveDb(state: LocalDatabaseState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  login(username: string): User {
    const db = getDb();
    const found = db.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!found) {
      // Auto-create user for frictionless offline/static testing
      const newUser: User = {
        id: `user_${Date.now()}`,
        username: username.trim(),
        name: username.trim(),
        role: 'USER',
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      saveDb(db);
      return newUser;
    }
    const { password: _, ...safeUser } = found;
    return safeUser;
  },

  register(username: string, role?: 'USER' | 'CREATOR'): User {
    const db = getDb();
    const existing = db.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (existing) {
      const { password: _, ...safeUser } = existing;
      return safeUser;
    }
    const newUser: User = {
      id: `user_${Date.now()}`,
      username: username.trim(),
      name: username.trim(),
      role: role || 'USER',
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDb(db);
    return newUser;
  },

  getUsers(): User[] {
    const db = getDb();
    return db.users.map(({ password: _, ...u }) => u);
  },

  getGroups(userId?: string): Group[] {
    const db = getDb();
    return db.groups.map((g) => {
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
        joinedAt: m.joinedAt,
        totalApprovedKm: totalKm,
        progressPercent: Math.min(100, Math.round((totalKm / group.targetKm) * 100)),
        isCompleted: totalKm >= group.targetKm,
      };
    });

    const recentApproved = db.activities
      .filter((a) => a.groupId === groupId && a.status === 'APPROVED')
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
    if (group.creatorId !== requestingUserId && userId !== requestingUserId) {
      throw new Error('Unauthorized');
    }

    db.memberships = db.memberships.filter((m) => !(m.groupId === groupId && m.userId === userId));
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

  submitActivity(activityData: {
    groupId: string;
    userId: string;
    date: string;
    distanceKm: number;
    startTime: string;
    endTime: string;
    photoUrl: string;
    note?: string;
  }): { message: string; activity: Activity } {
    const db = getDb();
    const user = db.users.find((u) => u.id === activityData.userId);
    const group = db.groups.find((g) => g.id === activityData.groupId);

    const isSuspicious = Number(activityData.distanceKm) > 42;
    const suspiciousReason = isSuspicious ? 'Distance unusually long (>42 km)' : null;

    const newActivity: Activity = {
      id: `act_${Date.now()}`,
      groupId: activityData.groupId,
      groupName: group ? group.name : undefined,
      userId: activityData.userId,
      username: user ? user.username : 'Runner',
      date: activityData.date,
      distanceKm: Number(activityData.distanceKm),
      startTime: activityData.startTime,
      endTime: activityData.endTime,
      durationMinutes: 45,
      photoUrl: activityData.photoUrl,
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
