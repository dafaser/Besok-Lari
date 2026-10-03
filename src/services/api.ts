import { User, Group, Activity, LeaderboardEntry, GroupProgressStats, UserStats, Achievement } from '../types';
import { localStore } from './localStore';
import { firestoreService } from './firebase';

export interface GroupDetailResponse {
  group: Group;
  stats: GroupProgressStats;
  leaderboard: LeaderboardEntry[];
  members: {
    userId: string;
    username: string;
    avatar?: string;
    joinedAt: string;
    totalApprovedKm: number;
    progressPercent: number;
    isCompleted: boolean;
  }[];
  recentApprovedActivities: Activity[];
}

export interface UserStatsResponse {
  user: User;
  stats: UserStats;
  achievements: Achievement[];
}

// Wrapper to try Firestore first; if offline, fall back to localStore
async function tryFirestore<T>(firestoreCall: () => Promise<T>, fallbackCall: () => T | Promise<T>): Promise<T> {
  try {
    return await firestoreCall();
  } catch (err: any) {
    const msg = err?.message || '';
    // If it's a validation, business, or authentication error, rethrow directly so UI shows the exact message!
    if (
      msg.includes('belum terdaftar') ||
      msg.includes('salah') ||
      msg.includes('sudah terdaftar') ||
      msg.includes('sudah digunakan') ||
      msg.includes('minimal 4') ||
      msg.includes('dikeluarkan') ||
      msg.includes('Kode invite tidak ditemukan') ||
      msg.includes('Unauthorized') ||
      msg.includes('tidak ditemukan') ||
      msg.includes('Password') ||
      msg.includes('Username')
    ) {
      throw err;
    }
    console.warn('[Firestore] Falling back to localStore due to network error:', err);
    return await fallbackCall();
  }
}

export const api = {
  getCurrentUser(): User | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('funrun_user');
        return stored ? JSON.parse(stored) : null;
      }
      return null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    try {
      if (typeof localStorage !== 'undefined') {
        if (user) {
          localStorage.setItem('funrun_user', JSON.stringify(user));
        } else {
          localStorage.removeItem('funrun_user');
        }
      }
    } catch {}
  },

  logout(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('funrun_user');
      }
    } catch {}
  },

  // Cross-device sync: Uploads any locally created challenges/activities to shared Firebase Firestore
  async syncLocalData(): Promise<void> {
    try {
      await firestoreService.syncLocalDataToFirestore();
    } catch (e) {
      console.warn('Sync to firestore error:', e);
    }
  },

  async login(username: string, password?: string): Promise<User> {
    return tryFirestore(
      async () => {
        const user = await firestoreService.login(username, password);
        this.setCurrentUser(user);
        try {
          localStore.upsertUser({ ...user, password });
        } catch {}
        // Sync any pending local data
        this.syncLocalData();
        return user;
      },
      () => {
        const user = localStore.login(username, password);
        this.setCurrentUser(user);
        return user;
      }
    );
  },

  async resetPassword(username: string, newPassword: string): Promise<User> {
    return tryFirestore(
      async () => {
        const user = await firestoreService.resetPassword(username, newPassword);
        this.setCurrentUser(user);
        try {
          localStore.upsertUser({ ...user, password: newPassword });
        } catch {}
        this.syncLocalData();
        return user;
      },
      () => {
        const user = localStore.resetPassword(username, newPassword);
        this.setCurrentUser(user);
        return user;
      }
    );
  },

  async register(username: string, password?: string, role?: 'USER' | 'CREATOR'): Promise<User> {
    return tryFirestore(
      async () => {
        const user = await firestoreService.register(username, password, role);
        this.setCurrentUser(user);
        try {
          localStore.upsertUser({ ...user, password });
        } catch {}
        // Sync any pending local data
        this.syncLocalData();
        return user;
      },
      () => {
        const user = localStore.register(username, password, role);
        this.setCurrentUser(user);
        return user;
      }
    );
  },

  async getUsers(): Promise<User[]> {
    return tryFirestore(
      () => firestoreService.getUsers(),
      () => localStore.getUsers()
    );
  },

  async updateProfile(
    userId: string,
    data: { username?: string; password?: string; avatar?: string | null; currentUsername?: string }
  ): Promise<User> {
    return tryFirestore(
      async () => {
        const updated = await firestoreService.updateProfile(userId, data);
        this.setCurrentUser(updated);
        try {
          localStore.upsertUser(updated);
        } catch {}
        return updated;
      },
      () => {
        const updated = localStore.updateProfile(userId, data);
        this.setCurrentUser(updated);
        return updated;
      }
    );
  },

  async getGroups(userId?: string): Promise<Group[]> {
    // Attempt background sync of any pending local data
    await this.syncLocalData();

    return tryFirestore(
      () => firestoreService.getGroups(userId),
      () => localStore.getGroups(userId)
    );
  },

  async getGroupDetail(groupId: string, userId?: string): Promise<GroupDetailResponse> {
    return tryFirestore(
      () => firestoreService.getGroupDetail(groupId, userId),
      () => localStore.getGroupDetail(groupId, userId)
    );
  },

  async createGroup(data: {
    name: string;
    description: string;
    targetKm: number;
    startDate: string;
    deadline: string;
    maxParticipants?: number | null;
    creatorId: string;
    creatorUsername?: string;
  }): Promise<Group> {
    const currentUser = this.getCurrentUser();
    const payload = {
      ...data,
      creatorUsername: data.creatorUsername || currentUser?.username || 'Pelari',
    };

    return tryFirestore(
      async () => {
        const newGroup = await firestoreService.createGroup(payload);
        try {
          localStore.upsertGroup(newGroup);
        } catch {}
        return newGroup;
      },
      () => localStore.createGroup(payload)
    );
  },

  async joinGroup(inviteCode: string, userId: string): Promise<{ message: string; group: Group }> {
    return tryFirestore(
      () => firestoreService.joinGroup(inviteCode, userId),
      () => localStore.joinGroup(inviteCode, userId)
    );
  },

  async editGroup(
    groupId: string,
    data: {
      name?: string;
      description?: string;
      targetKm?: number;
      deadline?: string;
      status?: 'ACTIVE' | 'CLOSED';
      userId: string;
    }
  ): Promise<Group> {
    return tryFirestore(
      () => firestoreService.editGroup(groupId, data),
      () => localStore.editGroup(groupId, data)
    );
  },

  async deleteGroup(
    groupId: string,
    userId: string
  ): Promise<{ message: string; deletedGroupId: string }> {
    return tryFirestore(
      () => firestoreService.deleteGroup(groupId, userId),
      () => localStore.deleteGroup(groupId, userId)
    );
  },

  async removeParticipant(
    groupId: string,
    userId: string,
    requestingUserId: string
  ): Promise<{ message: string }> {
    return tryFirestore(
      () => firestoreService.removeParticipant(groupId, userId, requestingUserId),
      () => localStore.removeParticipant(groupId, userId, requestingUserId)
    );
  },

  async getActivities(params?: {
    groupId?: string;
    userId?: string;
    status?: string;
    creatorId?: string;
  }): Promise<Activity[]> {
    return tryFirestore(
      () => firestoreService.getActivities(params),
      () => localStore.getActivities(params)
    );
  },

  async submitActivity(activityData: {
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
  }): Promise<{ message: string; activity: Activity }> {
    return tryFirestore(
      async () => {
        const res = await firestoreService.submitActivity(activityData);
        try {
          localStore.upsertActivity(res.activity);
        } catch {}
        return res;
      },
      () => localStore.submitActivity(activityData)
    );
  },

  async approveActivity(
    activityId: string,
    creatorId: string
  ): Promise<{ message: string; activity: Activity }> {
    return tryFirestore(
      async () => {
        const res = await firestoreService.approveActivity(activityId, creatorId);
        try {
          localStore.upsertActivity(res.activity);
        } catch {}
        return res;
      },
      () => localStore.approveActivity(activityId, creatorId)
    );
  },

  async rejectActivity(
    activityId: string,
    creatorId: string,
    rejectionReason?: string
  ): Promise<{ message: string; activity: Activity }> {
    return tryFirestore(
      async () => {
        const res = await firestoreService.rejectActivity(activityId, creatorId, rejectionReason);
        try {
          localStore.upsertActivity(res.activity);
        } catch {}
        return res;
      },
      () => localStore.rejectActivity(activityId, creatorId, rejectionReason)
    );
  },

  async getUserStats(userId: string): Promise<UserStatsResponse> {
    return tryFirestore(
      () => firestoreService.getUserStats(userId),
      () => localStore.getUserStats(userId)
    );
  },

  async resetDemo(): Promise<void> {
    return localStore.resetDemo();
  },
};
