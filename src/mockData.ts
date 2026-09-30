import { User, Group, Activity, Achievement } from './types';

// Preset realistic running photos for instant testing & seeding
export const SAMPLE_RUN_PHOTOS = [
  'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80', // Running shoes on trail
  'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop&q=80', // Running watch & wrist
  'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&auto=format&fit=crop&q=80', // Running track morning
  'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&auto=format&fit=crop&q=80', // Runner morning sun
  'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&auto=format&fit=crop&q=80', // Sports GPS watch metric
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80', // Running park path
];

// Pengguna aktif: DAFASR (Creator grup) dan Budi (Runner)
export const INITIAL_USERS: (User & { password: string })[] = [
  {
    id: 'user_dafasr',
    username: 'DAFASR',
    password: 'password123',
    name: 'Dafa S.R.',
    role: 'CREATOR',
    createdAt: '2026-09-19T10:00:00Z',
  },
  {
    id: 'user_budi',
    username: 'Budi',
    password: 'password123',
    name: 'Budi Santoso',
    role: 'USER',
    createdAt: '2026-09-19T12:00:00Z',
  },
];

// 1 Challenge aktif yang bersih untuk dicoba-coba (Creator: DAFASR)
export const INITIAL_GROUPS: Group[] = [
  {
    id: 'group_besok_lari_sept',
    name: 'Besok Lari 10K Kickoff',
    description: 'Besok Lari - Lace up, hit the pavement & conquer 10 KM together!',
    targetKm: 10,
    startDate: '2026-09-21',
    deadline: '2026-10-07T23:59:59',
    creatorId: 'user_dafasr',
    creatorUsername: 'DAFASR',
    inviteCode: 'BESOK-7X92',
    maxParticipants: 30,
    status: 'ACTIVE',
    createdAt: '2026-09-18T10:00:00Z',
  },
];

// Aktivitas lari direset kosong (0 KM) agar pengguna bisa mencoba input (+ ADD RUN), approval, leaderboard dari awal
export const INITIAL_ACTIVITIES: Activity[] = [];

// Member yang bergabung dalam challenge Besok Lari (hanya creator DAFASR; user lain harus memasukkan kode invite)
export const INITIAL_MEMBERSHIPS = [
  { id: 'm1', groupId: 'group_besok_lari_sept', userId: 'user_dafasr', joinedAt: '2026-09-19T10:00:00Z' },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [];
