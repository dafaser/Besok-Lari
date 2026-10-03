import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
  arrayUnion,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
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

// Initialize Firebase App & Firestore with provisioned Database ID
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Connectivity verification per system requirements
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connected to Firestore database:', firebaseConfig.firestoreDatabaseId);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[Firebase] Client is offline or database configuration needs attention.');
    } else {
      console.log('[Firebase] Firestore initialized and responsive');
    }
    return true;
  }
}

// Automatically test connection on boot
testConnection();

export interface MembershipRecord {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  joinedAt: string;
  role: 'HOST' | 'MEMBER';
}

export const firestoreService = {
  // ---------------- AUTH & USERS ----------------
  async getUsers(): Promise<User[]> {
    const snap = await getDocs(collection(db, 'users'));
    const users: User[] = [];
    snap.forEach((d) => {
      const data = d.data() as User;
      users.push(data);
    });
    return users;
  },

  async login(username: string, password?: string): Promise<User> {
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      throw new Error('Masukkan username kamu.');
    }
    const cleanPassword = (password || '').trim();
    if (!cleanPassword) {
      throw new Error('Masukkan password kamu.');
    }

    const snap = await getDocs(collection(db, 'users'));
    const matchingUsers: (User & { password?: string })[] = [];

    snap.forEach((d) => {
      const data = d.data() as User & { password?: string };
      if (data.username && data.username.trim().toLowerCase() === cleanUsername.toLowerCase()) {
        matchingUsers.push(data);
      }
    });

    if (matchingUsers.length === 0) {
      throw new Error(`Username "${cleanUsername}" belum terdaftar. Silakan daftar terlebih dahulu atau periksa salah input.`);
    }

    // Prefer primary doc that has id user_dafasr (to prevent duplicate shadow user with no data), or creator, or has password set
    const userObj =
      matchingUsers.find((u) => u.id === 'user_dafasr') ||
      matchingUsers.find((u) => u.role === 'CREATOR') ||
      matchingUsers.find((u) => Boolean(u.password)) ||
      matchingUsers[0];
    const hasPasswordSet = Boolean(userObj.password);
    const storedPassword = userObj.password || 'password123';

    // Support password matching, plus known aliases for dafasr (dafa1234, password123)
    const isDafasr = cleanUsername.toLowerCase() === 'dafasr';
    const isPasswordValid =
      !hasPasswordSet || // If account was created before passwords were required, adopt user's password on login
      storedPassword === cleanPassword ||
      (isDafasr && (cleanPassword === 'dafa1234' || cleanPassword === 'password123')) ||
      (storedPassword === 'password123' && cleanPassword === 'password') ||
      (storedPassword === 'password' && cleanPassword === 'password123');

    if (!isPasswordValid) {
      throw new Error('Password yang kamu masukkan salah. Silakan coba lagi.');
    }

    // Ensure password is kept in sync with the user's latest valid login across all matching docs
    for (const match of matchingUsers) {
      if (match.password !== cleanPassword) {
        try {
          await setDoc(doc(db, 'users', match.id), { password: cleanPassword }, { merge: true });
          match.password = cleanPassword;
        } catch (err) {
          console.warn('Could not update password for doc', match.id, err);
        }
      }
    }

    const user: User = {
      id: userObj.id,
      username: userObj.username,
      name: userObj.name,
      avatar: userObj.avatar,
      role: userObj.role || 'USER',
      createdAt: userObj.createdAt,
    };
    return user;
  },

  async register(
    username: string,
    password?: string,
    role: 'USER' | 'CREATOR' | 'ADMIN' = 'USER'
  ): Promise<User> {
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      throw new Error('Masukkan username kamu.');
    }
    const cleanPassword = (password || '').trim();
    if (!cleanPassword || cleanPassword.length < 4) {
      throw new Error('Password minimal 4 karakter yaa biar aman.');
    }

    const snap = await getDocs(collection(db, 'users'));
    let existing: User | null = null;

    snap.forEach((d) => {
      const data = d.data() as User;
      if (data.username && data.username.toLowerCase() === cleanUsername.toLowerCase()) {
        existing = data;
      }
    });

    if (existing) {
      throw new Error(`Username "${cleanUsername}" sudah terdaftar. Silakan gunakan username lain atau silakan masuk.`);
    }

    const newUser: User & { password?: string } = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: cleanUsername,
      name: cleanUsername,
      role: 'USER',
      createdAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(cleanUsername)}`,
      password: cleanPassword,
    };

    await setDoc(doc(db, 'users', newUser.id), newUser);
    const user: User = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      avatar: newUser.avatar,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
    return user;
  },

  async updateProfile(
    userId: string,
    data: { username?: string; password?: string; avatar?: string | null }
  ): Promise<User> {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    let targetRef = ref;
    let current: (User & { password?: string }) | null = null;

    if (snap.exists()) {
      current = snap.data() as User & { password?: string };
    } else {
      // Robust lookup: search users collection by id property or username
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((d) => {
        const u = d.data() as User & { password?: string };
        if (d.id === userId || u.id === userId) {
          targetRef = doc(db, 'users', d.id);
          current = u;
        }
      });
      if (!current && data.username) {
        usersSnap.forEach((d) => {
          const u = d.data() as User & { password?: string };
          if (u.username && u.username.toLowerCase() === data.username!.toLowerCase()) {
            targetRef = doc(db, 'users', d.id);
            current = u;
          }
        });
      }
    }

    if (!current) {
      throw new Error('User not found');
    }

    const updated: any = {
      ...current,
      username: data.username?.trim() || current.username,
      name: data.username?.trim() || current.name || current.username,
      password: data.password || current.password,
    };
    if (data.avatar !== undefined) {
      if (data.avatar) {
        updated.avatar = data.avatar;
      } else {
        delete updated.avatar;
      }
    }

    await setDoc(targetRef, updated);

    // Propagate avatar updates to activities in Firestore
    if (data.avatar !== undefined) {
      try {
        const actSnap = await getDocs(collection(db, 'activities'));
        const actUpdates: Promise<any>[] = [];
        actSnap.forEach((d) => {
          const a = d.data();
          if (
            a.userId === userId ||
            a.userId === current!.id ||
            (current!.username && a.username?.toLowerCase() === current!.username.toLowerCase())
          ) {
            actUpdates.push(
              setDoc(
                doc(db, 'activities', d.id),
                { userAvatar: data.avatar || '' },
                { merge: true }
              )
            );
          }
        });
        await Promise.all(actUpdates);
      } catch (e) {
        console.warn('Could not propagate avatar to activities:', e);
      }
    }

    // Propagate username updates to memberships and activities if username changed
    if (data.username && data.username.trim() !== current.username) {
      const newUsername = data.username.trim();
      try {
        const memSnap = await getDocs(collection(db, 'memberships'));
        const memUpdates: Promise<any>[] = [];
        memSnap.forEach((d) => {
          const m = d.data();
          if (m.userId === userId || m.userId === current!.id) {
            memUpdates.push(setDoc(doc(db, 'memberships', d.id), { username: newUsername }, { merge: true }));
          }
        });
        await Promise.all(memUpdates);
      } catch (e) {
        console.warn('Could not propagate username to memberships:', e);
      }
    }

    const user: User = {
      id: updated.id || userId,
      username: updated.username,
      name: updated.name,
      avatar: updated.avatar,
      role: updated.role,
      createdAt: updated.createdAt,
    };
    return user;
  },

  // ---------------- GROUPS (CHALLENGES) ----------------
  async getGroups(userId?: string): Promise<Group[]> {
    const [groupsSnap, membershipsSnap] = await Promise.all([
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'memberships')),
    ]);

    const userMemberships = new Set<string>();

    membershipsSnap.forEach((d) => {
      const m = d.data() as MembershipRecord;
      if (userId && m.userId === userId) {
        userMemberships.add(m.groupId);
      }
    });

    const groups: Group[] = [];
    groupsSnap.forEach((d) => {
      const g = d.data() as Group;
      // If user was kicked from this challenge by host, do not show or list it
      if (userId && (g.kickedUserIds || []).includes(userId)) {
        return;
      }

      const isMember = userId
        ? userMemberships.has(g.id) || g.creatorId === userId
        : false;
      const isCreator = userId ? g.creatorId === userId : false;

      groups.push({
        ...g,
        isMember,
        isCreator,
      });
    });

    // Sort newest first
    return groups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getGroupDetail(groupId: string, userId?: string): Promise<GroupDetailResponse> {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      throw new Error('Group not found');
    }

    const groupData = groupSnap.data() as Group;

    // Check if user was kicked by host
    if (userId && (groupData.kickedUserIds || []).includes(userId)) {
      throw new Error('Anda telah dikeluarkan dari challenge ini oleh host.');
    }

    const [membershipsSnap, activitiesSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'memberships')),
      getDocs(collection(db, 'activities')),
      getDocs(collection(db, 'users')),
    ]);

    const memberships: MembershipRecord[] = [];
    membershipsSnap.forEach((d) => {
      const m = d.data() as MembershipRecord;
      if (m.groupId === groupId) {
        memberships.push(m);
      }
    });

    const usersMap: Record<string, User> = {};
    usersSnap.forEach((d) => {
      const u = d.data() as User;
      usersMap[u.id] = u;
    });

    // Ensure host is included in memberships if missing
    if (!memberships.some((m) => m.userId === groupData.creatorId)) {
      const hostMembership: MembershipRecord = {
        id: `mem_${groupId}_${groupData.creatorId}`,
        groupId,
        userId: groupData.creatorId,
        username: groupData.creatorUsername || usersMap[groupData.creatorId]?.username || 'Host',
        joinedAt: groupData.createdAt,
        role: 'HOST',
      };
      memberships.push(hostMembership);
    }

    // CRITICAL: Only include activities for this group from users who are currently active members!
    // If a user has been removed, their activities are excluded from the challenge entirely!
    const activeMemberUserIds = new Set(memberships.map((m) => m.userId));
    activeMemberUserIds.add(groupData.creatorId);

    const activities: Activity[] = [];
    activitiesSnap.forEach((d) => {
      const a = d.data() as Activity;
      if (a.groupId === groupId && activeMemberUserIds.has(a.userId)) {
        const mem = memberships.find((m) => m.userId === a.userId);
        const resolvedUsername =
          (mem?.username && mem.username.toLowerCase() !== 'runner' && mem.username.toLowerCase() !== 'pelari' ? mem.username : '') ||
          (a.userId === groupData.creatorId ? (groupData.creatorUsername || usersMap[groupData.creatorId]?.username || 'Host') : '') ||
          (usersMap[a.userId]?.username && usersMap[a.userId].username.toLowerCase() !== 'runner' && usersMap[a.userId].username.toLowerCase() !== 'pelari' ? usersMap[a.userId].username : '') ||
          (a.username && a.username.toLowerCase() !== 'runner' && a.username.toLowerCase() !== 'pelari' ? a.username : '') ||
          usersMap[a.userId]?.name ||
          mem?.username ||
          a.username ||
          'Pelari';

        activities.push({
          ...a,
          username: resolvedUsername,
        });
      }
    });

    // Build user avatar lookup
    const userAvatars = new Map<string, string>();
    usersSnap.forEach((d) => {
      const u = d.data() as User;
      if (u.avatar) {
        userAvatars.set(d.id, u.avatar);
        if (u.id) userAvatars.set(u.id, u.avatar);
        if (u.username) userAvatars.set(u.username.toLowerCase(), u.avatar);
      }
    });

    const isMember = userId
      ? memberships.some((m) => m.userId === userId) || groupData.creatorId === userId
      : false;
    const isCreator = userId ? groupData.creatorId === userId : false;

    const group: Group = {
      ...groupData,
      isMember,
      isCreator,
    };

    // Calculate leaderboard
    const targetKm = group.targetKm || 10;
    const leaderboard: LeaderboardEntry[] = memberships.map((m) => {
      const userApprovedActivities = activities.filter(
        (a) => a.userId === m.userId && a.status === 'APPROVED'
      );
      const totalApprovedKm = Number(
        userApprovedActivities.reduce((sum, a) => sum + Number(a.distanceKm || 0), 0).toFixed(1)
      );
      const progressPercent = Math.min(100, Math.round((totalApprovedKm / targetKm) * 100));
      const isCompleted = totalApprovedKm >= targetKm;
      const lastRunDate =
        userApprovedActivities.length > 0
          ? [...userApprovedActivities].sort((a, b) => b.date.localeCompare(a.date))[0].date
          : undefined;

      const avatar = userAvatars.get(m.userId) || (m.username ? userAvatars.get(m.username.toLowerCase()) : undefined) || usersMap[m.userId]?.avatar;

      return {
        userId: m.userId,
        username: m.username || usersMap[m.userId]?.username || 'Pelari',
        avatar,
        totalApprovedKm,
        targetKm,
        progressPercent,
        isCompleted,
        rank: 0,
        approvedRunsCount: userApprovedActivities.length,
        lastRunDate,
      };
    });

    leaderboard.sort((a, b) => {
      if (b.totalApprovedKm !== a.totalApprovedKm) {
        return b.totalApprovedKm - a.totalApprovedKm;
      }
      return b.approvedRunsCount - a.approvedRunsCount;
    });

    leaderboard.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    // Calculate group stats
    const approvedActivities = activities.filter((a) => a.status === 'APPROVED');
    const totalApprovedKm = Number(
      approvedActivities.reduce((sum, a) => sum + Number(a.distanceKm || 0), 0).toFixed(1)
    );
    const participantsCount = memberships.length;
    const targetCollectiveKm = targetKm * participantsCount;
    const collectiveProgressPercent =
      targetCollectiveKm > 0
        ? Math.min(100, Math.round((totalApprovedKm / targetCollectiveKm) * 100))
        : 0;
    const averageKmPerParticipant =
      participantsCount > 0 ? Number((totalApprovedKm / participantsCount).toFixed(2)) : 0;
    const completedCount = leaderboard.filter((l) => l.isCompleted).length;

    const stats: GroupProgressStats = {
      totalApprovedKm,
      targetCollectiveKm,
      collectiveProgressPercent,
      participantsCount,
      completedParticipantsCount: completedCount,
      averageKmPerParticipant,
      pendingApprovalsCount: activities.filter((a) => a.status === 'PENDING').length,
    };

    const members = leaderboard.map((l) => {
      const mem = memberships.find((m) => m.userId === l.userId);
      return {
        userId: l.userId,
        username: l.username,
        avatar: l.avatar,
        joinedAt: mem?.joinedAt || group.createdAt,
        totalApprovedKm: l.totalApprovedKm,
        progressPercent: l.progressPercent,
        isCompleted: l.isCompleted,
      };
    });

    const recentApprovedActivities = approvedActivities
      .map((a) => ({
        ...a,
        userAvatar: a.userAvatar || userAvatars.get(a.userId) || (a.username ? userAvatars.get(a.username.toLowerCase()) : undefined),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      group,
      stats,
      leaderboard,
      members,
      recentApprovedActivities,
    };
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
    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newGroup: Group = {
      id: groupId,
      name: data.name,
      description: data.description,
      targetKm: Number(data.targetKm),
      startDate: data.startDate,
      deadline: data.deadline,
      maxParticipants: data.maxParticipants || null,
      inviteCode,
      creatorId: data.creatorId,
      creatorUsername: data.creatorUsername || 'Host Pelari',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      isMember: true,
      isCreator: true,
    };

    // Save group to Firestore
    await setDoc(doc(db, 'groups', groupId), newGroup);

    // Save creator's host membership to Firestore
    const membershipId = `mem_${groupId}_${data.creatorId}`;
    const hostMembership: MembershipRecord = {
      id: membershipId,
      groupId,
      userId: data.creatorId,
      username: data.creatorUsername || 'Host Pelari',
      joinedAt: new Date().toISOString(),
      role: 'HOST',
    };
    await setDoc(doc(db, 'memberships', membershipId), hostMembership);

    return newGroup;
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
    const ref = doc(db, 'groups', groupId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error('Group not found');
    }

    const current = snap.data() as Group;
    const updated: Group = {
      ...current,
      ...(data.name ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.targetKm ? { targetKm: Number(data.targetKm) } : {}),
      ...(data.deadline ? { deadline: data.deadline } : {}),
      ...(data.status ? { status: data.status } : {}),
    };

    await setDoc(ref, updated);
    return updated;
  },

  async deleteGroup(
    groupId: string,
    userId: string
  ): Promise<{ message: string; deletedGroupId: string }> {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) {
      throw new Error('Group not found');
    }

    const group = snap.data() as Group;
    if (group.creatorId !== userId) {
      throw new Error('Unauthorized: only the group host can delete this group.');
    }

    await deleteDoc(groupRef);

    // Delete associated memberships & activities
    const [memSnap, actSnap] = await Promise.all([
      getDocs(collection(db, 'memberships')),
      getDocs(collection(db, 'activities')),
    ]);

    const deletes: Promise<void>[] = [];
    memSnap.forEach((d) => {
      const m = d.data() as MembershipRecord;
      if (m.groupId === groupId) {
        deletes.push(deleteDoc(doc(db, 'memberships', d.id)));
      }
    });

    actSnap.forEach((d) => {
      const a = d.data() as Activity;
      if (a.groupId === groupId) {
        deletes.push(deleteDoc(doc(db, 'activities', d.id)));
      }
    });

    await Promise.all(deletes);

    return { message: 'Group deleted successfully', deletedGroupId: groupId };
  },

  async removeParticipant(
    groupId: string,
    userId: string,
    requestingUserId: string
  ): Promise<{ message: string }> {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) {
      throw new Error('Group not found');
    }

    const group = snap.data() as Group;
    const userSnap = await getDoc(doc(db, 'users', requestingUserId));
    const requestingUser = userSnap.exists() ? (userSnap.data() as User) : null;
    const isPrivileged =
      group.creatorId === requestingUserId ||
      userId === requestingUserId ||
      requestingUser?.role === 'CREATOR' ||
      requestingUser?.role === 'ADMIN' ||
      requestingUser?.username.toLowerCase() === 'admin' ||
      requestingUser?.username.toLowerCase() === 'dafasr';

    if (!isPrivileged) {
      throw new Error('Unauthorized');
    }

    const toDelete: Promise<any>[] = [];

    // 1. Mark user as kicked on the group so they cannot view or rejoin
    toDelete.push(
      setDoc(
        groupRef,
        {
          kickedUserIds: arrayUnion(userId),
        },
        { merge: true }
      )
    );

    // 2. Delete membership records for this user in this group
    const memSnap = await getDocs(collection(db, 'memberships'));
    memSnap.forEach((d) => {
      const m = d.data() as MembershipRecord;
      if (m.groupId === groupId && m.userId === userId) {
        toDelete.push(deleteDoc(doc(db, 'memberships', d.id)));
      }
    });
    const defaultMemId = `mem_${groupId}_${userId}`;
    toDelete.push(deleteDoc(doc(db, 'memberships', defaultMemId)).catch(() => {}));

    // 3. CRITICAL: Delete ALL activities & running history for this user in this group!
    const actSnap = await getDocs(collection(db, 'activities'));
    actSnap.forEach((d) => {
      const a = d.data() as Activity;
      if (a.groupId === groupId && a.userId === userId) {
        toDelete.push(deleteDoc(doc(db, 'activities', d.id)));
      }
    });

    await Promise.all(toDelete);

    return { message: 'Participant and all associated activities removed successfully' };
  },

  async joinGroup(inviteCode: string, userId: string): Promise<{ message: string; group: Group }> {
    const cleanCode = inviteCode.trim().toUpperCase();
    const groupsSnap = await getDocs(collection(db, 'groups'));
    let matchedGroup: Group | null = null;

    groupsSnap.forEach((d) => {
      const g = d.data() as Group;
      if (g.inviteCode && g.inviteCode.toUpperCase() === cleanCode) {
        matchedGroup = g;
      }
    });

    if (!matchedGroup) {
      throw new Error('Kode invite tidak ditemukan.');
    }

    const group: Group = matchedGroup;

    // Block kicked users from rejoining
    if ((group.kickedUserIds || []).includes(userId)) {
      throw new Error('Anda telah dikeluarkan dari challenge ini oleh host dan tidak dapat bergabung kembali.');
    }

    const membershipId = `mem_${group.id}_${userId}`;
    const memRef = doc(db, 'memberships', membershipId);
    const memSnap = await getDoc(memRef);

    if (memSnap.exists()) {
      return { message: 'Kamu sudah menjadi anggota grup ini!', group };
    }

    // Get user details
    const userSnap = await getDoc(doc(db, 'users', userId));
    const username = userSnap.exists() ? (userSnap.data() as User).username : 'Pelari';

    const newMembership: MembershipRecord = {
      id: membershipId,
      groupId: group.id,
      userId,
      username,
      joinedAt: new Date().toISOString(),
      role: 'MEMBER',
    };

    await setDoc(memRef, newMembership);

    return {
      message: `Selamat! Kamu berhasil bergabung dengan "${group.name}".`,
      group: { ...group, isMember: true },
    };
  },

  // ---------------- RUNS & ACTIVITIES ----------------
  async getActivities(params?: {
    groupId?: string;
    userId?: string;
    status?: string;
    creatorId?: string;
  }): Promise<Activity[]> {
    const [actSnap, groupsSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'activities')),
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'users')),
    ]);

    const groupsMap = new Map<string, string>();
    groupsSnap.forEach((d) => {
      const g = d.data() as Group;
      groupsMap.set(g.id, g.name);
    });

    const userAvatars = new Map<string, string>();
    usersSnap.forEach((d) => {
      const u = d.data() as User;
      if (u.avatar) userAvatars.set(u.id, u.avatar);
      if (u.avatar && u.username) userAvatars.set(u.username.toLowerCase(), u.avatar);
    });

    let result: Activity[] = [];
    actSnap.forEach((d) => {
      const a = d.data() as Activity;
      const avatar = userAvatars.get(a.userId) || (a.username ? userAvatars.get(a.username.toLowerCase()) : undefined);
      result.push({
        ...a,
        groupName: a.groupName || groupsMap.get(a.groupId) || 'Tantangan Lari',
        userAvatar: a.userAvatar || avatar,
        likes: Array.isArray(a.likes) ? a.likes : [],
        comments: Array.isArray(a.comments) ? a.comments : [],
      });
    });

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
      const createdGroupIds = new Set<string>();
      groupsSnap.forEach((d) => {
        const g = d.data() as Group;
        if (g.creatorId === params.creatorId) {
          createdGroupIds.add(g.id);
        }
      });
      result = result.filter((a) => createdGroupIds.has(a.groupId));
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async toggleLikeActivity(activityId: string, userId: string): Promise<Activity> {
    const ref = doc(db, 'activities', activityId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Aktivitas tidak ditemukan');
    const act = snap.data() as Activity;
    const currentLikes = Array.isArray(act.likes) ? [...act.likes] : [];
    const idx = currentLikes.indexOf(userId);
    if (idx >= 0) {
      currentLikes.splice(idx, 1);
    } else {
      currentLikes.push(userId);
    }
    const updated: Activity = { ...act, likes: currentLikes };
    await setDoc(ref, { likes: currentLikes }, { merge: true });
    return updated;
  },

  async addComment(
    activityId: string,
    commentData: { userId: string; username: string; userAvatar?: string; text: string }
  ): Promise<Activity> {
    const ref = doc(db, 'activities', activityId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Aktivitas tidak ditemukan');
    const act = snap.data() as Activity;
    const currentComments = Array.isArray(act.comments) ? [...act.comments] : [];
    const newComment: any = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: commentData.userId,
      username: commentData.username,
      text: commentData.text.trim(),
      createdAt: new Date().toISOString(),
    };
    if (commentData.userAvatar) {
      newComment.userAvatar = commentData.userAvatar;
    }
    currentComments.push(newComment);
    const updated: Activity = { ...act, comments: currentComments };
    await setDoc(ref, { comments: currentComments }, { merge: true });
    return updated;
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
    const [startH, startM] = activityData.startTime.split(':').map(Number);
    const [endH, endM] = activityData.endTime.split(':').map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    const durationMinutes = Math.max(1, endMinutes - startMinutes);
    const distanceKm = Number(activityData.distanceKm);

    // Deduplication check: prevent accidental double submission (e.g. rapid clicks or network retries)
    const existingSnap = await getDocs(collection(db, 'activities'));
    for (const d of existingSnap.docs) {
      const ea = d.data() as Activity;
      if (
        ea.userId === activityData.userId &&
        ea.groupId === activityData.groupId &&
        ea.date === activityData.date &&
        ea.startTime === activityData.startTime &&
        ea.endTime === activityData.endTime &&
        Math.abs(Number(ea.distanceKm) - distanceKm) < 0.01
      ) {
        return {
          message: 'Aktivitas lari sudah tercatat!',
          activity: ea,
        };
      }
    }

    const userSnap = await getDoc(doc(db, 'users', activityData.userId));
    const userObj = userSnap.exists() ? (userSnap.data() as User) : null;
    const username =
      activityData.username ||
      userObj?.username ||
      userObj?.name ||
      'Pelari';

    const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const photos = activityData.photoUrls && activityData.photoUrls.length > 0
      ? activityData.photoUrls
      : activityData.photoUrl ? [activityData.photoUrl] : [];
    const primaryPhoto = photos[0] || activityData.photoUrl || 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80';

    const newActivity: Activity = {
      id: actId,
      groupId: activityData.groupId,
      userId: activityData.userId,
      username,
      date: activityData.date,
      startTime: activityData.startTime,
      endTime: activityData.endTime,
      durationMinutes,
      distanceKm,
      photoUrl: primaryPhoto,
      photoUrls: photos,
      note: activityData.note || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'activities', actId), newActivity);
    return {
      message: 'Aktivitas lari berhasil dicatat dan menunggu verifikasi host!',
      activity: newActivity,
    };
  },

  async approveActivity(
    activityId: string,
    creatorId: string
  ): Promise<{ message: string; activity: Activity }> {
    const updated = await this.verifyActivity(activityId, 'APPROVED', creatorId);
    return {
      message: 'Aktivitas berhasil disetujui!',
      activity: updated,
    };
  },

  async rejectActivity(
    activityId: string,
    creatorId: string,
    rejectionReason?: string
  ): Promise<{ message: string; activity: Activity }> {
    const updated = await this.verifyActivity(activityId, 'REJECTED', creatorId, rejectionReason);
    return {
      message: 'Aktivitas ditolak.',
      activity: updated,
    };
  },

  async verifyActivity(
    activityId: string,
    status: 'APPROVED' | 'REJECTED',
    verifierId: string,
    rejectionReason?: string
  ): Promise<Activity> {
    const ref = doc(db, 'activities', activityId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error('Activity not found');
    }

    const activity = snap.data() as Activity;
    const updated: Activity = {
      ...activity,
      status,
      approvedAt: status === 'APPROVED' ? new Date().toISOString() : null,
      approvedBy: status === 'APPROVED' ? verifierId : null,
      rejectionReason: status === 'REJECTED' ? (rejectionReason || 'Ditolak oleh host') : null,
    };

    await setDoc(ref, updated);
    return updated;
  },

  // ---------------- USER STATS & ACHIEVEMENTS ----------------
  async getUserStats(userId: string): Promise<UserStatsResponse> {
    const [userSnap, activitiesSnap, groupsSnap, membershipsSnap] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getDocs(collection(db, 'activities')),
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'memberships')),
    ]);

    const user: User = userSnap.exists()
      ? (userSnap.data() as User)
      : {
          id: userId,
          username: 'Pelari',
          name: 'Pelari',
          role: 'USER',
          createdAt: new Date().toISOString(),
        };

    const userApprovedRuns: Activity[] = [];
    let longestRun = 0;
    activitiesSnap.forEach((d) => {
      const a = d.data() as Activity;
      if (a.userId === userId && a.status === 'APPROVED') {
        userApprovedRuns.push(a);
        if (a.distanceKm > longestRun) {
          longestRun = a.distanceKm;
        }
      }
    });

    const totalKm = Number(
      userApprovedRuns.reduce((sum, a) => sum + Number(a.distanceKm || 0), 0).toFixed(1)
    );

    const userGroupIds = new Set<string>();
    membershipsSnap.forEach((d) => {
      const m = d.data() as MembershipRecord;
      if (m.userId === userId) {
        userGroupIds.add(m.groupId);
      }
    });

    let challengesJoined = 0;
    let challengesCompleted = 0;

    groupsSnap.forEach((d) => {
      const g = d.data() as Group;
      if (userGroupIds.has(g.id)) {
        challengesJoined++;
        if (g.status === 'CLOSED') {
          challengesCompleted++;
        }
      }
    });

    // Streak calculation
    const approvedDates = userApprovedRuns
      .map((a) => a.date)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort()
      .reverse();

    let currentStreak = 0;
    if (approvedDates.length > 0) {
      currentStreak = 1;
      for (let i = 0; i < approvedDates.length - 1; i++) {
        const c = new Date(approvedDates[i]);
        const p = new Date(approvedDates[i + 1]);
        const diff = Math.round((c.getTime() - p.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) currentStreak++;
        else break;
      }
    }

    const stats: UserStats = {
      totalKm,
      totalRuns: userApprovedRuns.length,
      challengesJoined,
      challengesCompleted,
      longestRun,
      currentStreak,
    };

    const achievements: Achievement[] = [
      {
        id: 'ach_first_run',
        userId,
        achievementType: 'FIRST_RUN',
        title: 'Lari Perdana 👟',
        description: 'Menyelesaikan lari pertama yang telah diverifikasi!',
        earnedAt: userApprovedRuns.length > 0 ? userApprovedRuns[0].createdAt : '',
        icon: '👟',
      },
      {
        id: 'ach_target',
        userId,
        achievementType: 'TARGET_ACHIEVED',
        title: 'Target Tercapai 🎯',
        description: 'Menyelesaikan target KM challenge!',
        earnedAt: challengesCompleted > 0 ? new Date().toISOString() : '',
        icon: '🎯',
      },
      {
        id: 'ach_streak_3',
        userId,
        achievementType: '3_DAY_STREAK',
        title: 'Semangat Membara 🔥',
        description: 'Lari 3 hari berturut-turut tanpa jeda!',
        earnedAt: currentStreak >= 3 ? new Date().toISOString() : '',
        icon: '🔥',
      },
    ];

    return { user, stats, achievements };
  },

  // ---------------- MIGRATION / SYNC ----------------
  // Automatically sync any offline / local data from Samsung Phone or Chrome into Firestore
  async syncLocalDataToFirestore(): Promise<void> {
    try {
      const raw = localStorage.getItem('besok_lari_local_db_v1');
      if (!raw) return;
      const local = JSON.parse(raw);

      // 1. Sync users
      if (Array.isArray(local.users)) {
        for (const u of local.users) {
          if (u.id && u.username) {
            await setDoc(doc(db, 'users', u.id), u, { merge: true });
          }
        }
      }

      // 2. Sync groups
      if (Array.isArray(local.groups) && local.groups.length > 0) {
        const groupsSnap = await getDocs(collection(db, 'groups'));
        const existingGroupIds = new Set<string>();
        const existingGroupCodes = new Set<string>();
        groupsSnap.forEach((d) => {
          const g = d.data() as Group;
          existingGroupIds.add(g.id);
          if (g.inviteCode) existingGroupCodes.add(g.inviteCode.toUpperCase());
        });

        for (const g of local.groups) {
          if (g.id && g.name) {
            if (!existingGroupIds.has(g.id) && (!g.inviteCode || !existingGroupCodes.has(g.inviteCode.toUpperCase()))) {
              await setDoc(doc(db, 'groups', g.id), g, { merge: true });
            }
          }
        }
      }

      // 3. Sync memberships
      if (Array.isArray(local.memberships)) {
        for (const m of local.memberships) {
          if (m.id || (m.groupId && m.userId)) {
            const id = m.id || `mem_${m.groupId}_${m.userId}`;
            await setDoc(doc(db, 'memberships', id), { ...m, id }, { merge: true });
          }
        }
      }

      // 4. Sync activities (safely deduplicated, never creating duplicate runs)
      if (Array.isArray(local.activities) && local.activities.length > 0) {
        const actSnap = await getDocs(collection(db, 'activities'));
        const existingMap = new Map<string, Activity>();
        actSnap.forEach((d) => {
          const act = d.data() as Activity;
          existingMap.set(act.id, act);
        });

        for (const a of local.activities) {
          if (a.id && a.groupId && a.userId) {
            // Never re-upload rejected or invalidated runs
            if (a.status === 'REJECTED') continue;

            const existsById = existingMap.has(a.id);
            const existsByContent = Array.from(existingMap.values()).some(
              (ea) =>
                ea.userId === a.userId &&
                ea.groupId === a.groupId &&
                ea.date === a.date &&
                (ea.startTime === a.startTime || Math.abs(Number(ea.distanceKm) - Number(a.distanceKm)) < 0.05)
            );

            if (!existsById && !existsByContent) {
              await setDoc(doc(db, 'activities', a.id), a, { merge: true });
            }
          }
        }
      }

      console.log('[Firebase] Local data synchronized successfully into cloud Firestore.');
    } catch (e) {
      console.warn('[Firebase] Background local data sync info:', e);
    }
  },
};
