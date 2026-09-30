import { User, Group, Activity, Achievement } from './types';

// Preset running photos
export const SAMPLE_RUN_PHOTOS: string[] = [
  'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
];

// Deployment mode: Users start fresh from 0 (must register first)
export const INITIAL_USERS: (User & { password: string })[] = [];

// Clean challenges list for deployment
export const INITIAL_GROUPS: Group[] = [];

// Clean activities
export const INITIAL_ACTIVITIES: Activity[] = [];

// Clean memberships
export const INITIAL_MEMBERSHIPS: { id: string; groupId: string; userId: string; joinedAt: string }[] = [];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [];
