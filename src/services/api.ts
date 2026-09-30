import { User, Group, Activity, LeaderboardEntry, GroupProgressStats, UserStats, Achievement } from '../types';
import { localStore } from './localStore';

const API_BASE = '/api';

export interface GroupDetailResponse {
  group: Group;
  stats: GroupProgressStats;
  leaderboard: LeaderboardEntry[];
  members: {
    userId: string;
    username: string;
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

// Wrapper to try backend first; if server is not present (e.g. Netlify static hosting), gracefully fall back to localStore
async function tryApi<T>(apiCall: () => Promise<T>, fallbackCall: () => T | Promise<T>): Promise<T> {
  try {
    return await apiCall();
  } catch (err) {
    return await fallbackCall();
  }
}

export const api = {
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem('funrun_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem('funrun_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('funrun_user');
    }
  },

  logout(): void {
    localStorage.removeItem('funrun_user');
  },

  async login(username: string, password?: string): Promise<User> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: password || 'password123' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to login.');
        const user: User = data.user;
        this.setCurrentUser(user);
        return user;
      },
      () => {
        const user = localStore.login(username);
        this.setCurrentUser(user);
        return user;
      }
    );
  },

  async register(username: string, password?: string, role?: 'USER' | 'CREATOR'): Promise<User> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: password || 'password123', role: role || 'USER' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create account.');
        const user: User = data.user;
        this.setCurrentUser(user);
        return user;
      },
      () => {
        const user = localStore.register(username, role);
        this.setCurrentUser(user);
        return user;
      }
    );
  },

  async getUsers(): Promise<User[]> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/users`);
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      },
      () => localStore.getUsers()
    );
  },

  async updateProfile(
    userId: string,
    data: { username?: string; password?: string; avatar?: string | null }
  ): Promise<User> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/users/${userId}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to update profile.');
        const updatedUser: User = resData.user;
        this.setCurrentUser(updatedUser);
        return updatedUser;
      },
      () => {
        const updatedUser = localStore.updateProfile(userId, data);
        this.setCurrentUser(updatedUser);
        return updatedUser;
      }
    );
  },

  async getGroups(userId?: string): Promise<Group[]> {
    return tryApi(
      async () => {
        const url = userId ? `${API_BASE}/groups?userId=${encodeURIComponent(userId)}` : `${API_BASE}/groups`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch groups.');
        return res.json();
      },
      () => localStore.getGroups(userId)
    );
  },

  async getGroupDetail(groupId: string, userId?: string): Promise<GroupDetailResponse> {
    return tryApi(
      async () => {
        const url = userId
          ? `${API_BASE}/groups/${groupId}?userId=${encodeURIComponent(userId)}`
          : `${API_BASE}/groups/${groupId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch group details.');
        return data;
      },
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
  }): Promise<Group> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to create group.');
        return resData;
      },
      () => localStore.createGroup(data)
    );
  },

  async joinGroup(inviteCode: string, userId: string): Promise<{ message: string; group: Group }> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/groups/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteCode, userId }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to join group.');
        return resData;
      },
      () => localStore.joinGroup(inviteCode, userId)
    );
  },

  async editGroup(groupId: string, data: {
    name?: string;
    description?: string;
    targetKm?: number;
    deadline?: string;
    status?: 'ACTIVE' | 'CLOSED';
    userId: string;
  }): Promise<Group> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/groups/${groupId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to update group.');
        return resData;
      },
      () => localStore.editGroup(groupId, data)
    );
  },

  async deleteGroup(groupId: string, userId: string): Promise<{ message: string; deletedGroupId: string }> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/groups/${groupId}?requestingUserId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to delete group.');
        return resData;
      },
      () => localStore.deleteGroup(groupId, userId)
    );
  },

  async removeParticipant(groupId: string, userId: string, requestingUserId: string): Promise<{ message: string }> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/groups/${groupId}/members/${userId}?requestingUserId=${encodeURIComponent(requestingUserId)}`, {
          method: 'DELETE',
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to remove participant.');
        return resData;
      },
      () => localStore.removeParticipant(groupId, userId, requestingUserId)
    );
  },

  async getActivities(params?: {
    groupId?: string;
    userId?: string;
    status?: string;
    creatorId?: string;
  }): Promise<Activity[]> {
    return tryApi(
      async () => {
        const query = new URLSearchParams();
        if (params?.groupId) query.append('groupId', params.groupId);
        if (params?.userId) query.append('userId', params.userId);
        if (params?.status) query.append('status', params.status);
        if (params?.creatorId) query.append('creatorId', params.creatorId);

        const res = await fetch(`${API_BASE}/activities?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch activities.');
        return res.json();
      },
      () => localStore.getActivities(params)
    );
  },

  async submitActivity(activityData: {
    groupId: string;
    userId: string;
    date: string;
    distanceKm: number;
    startTime: string;
    endTime: string;
    photoUrl: string;
    note?: string;
  }): Promise<{ message: string; activity: Activity }> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activityData),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to submit activity.');
        return resData;
      },
      () => localStore.submitActivity(activityData)
    );
  },

  async approveActivity(activityId: string, creatorId: string): Promise<{ message: string; activity: Activity }> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/activities/${activityId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to approve activity.');
        return resData;
      },
      () => localStore.approveActivity(activityId, creatorId)
    );
  },

  async rejectActivity(activityId: string, creatorId: string, rejectionReason?: string): Promise<{ message: string; activity: Activity }> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/activities/${activityId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId, rejectionReason }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to reject activity.');
        return resData;
      },
      () => localStore.rejectActivity(activityId, creatorId, rejectionReason)
    );
  },

  async getUserStats(userId: string): Promise<UserStatsResponse> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/stats/user/${userId}`);
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to fetch user stats.');
        return resData;
      },
      () => localStore.getUserStats(userId)
    );
  },

  async resetDemo(): Promise<void> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE}/reset-demo`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to reset demo data.');
      },
      () => localStore.resetDemo()
    );
  },
};
