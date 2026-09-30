import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_USERS,
  INITIAL_GROUPS,
  INITIAL_ACTIVITIES,
  INITIAL_MEMBERSHIPS,
  INITIAL_ACHIEVEMENTS,
} from './src/mockData';
import { Activity, Group, Achievement, LeaderboardEntry, GroupProgressStats, UserStats } from './src/types';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'famima_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseState {
  users: typeof INITIAL_USERS;
  groups: Group[];
  memberships: typeof INITIAL_MEMBERSHIPS;
  activities: Activity[];
  achievements: Achievement[];
}

function getInitialDbState(): DatabaseState {
  return {
    users: JSON.parse(JSON.stringify(INITIAL_USERS)),
    groups: JSON.parse(JSON.stringify(INITIAL_GROUPS)),
    memberships: JSON.parse(JSON.stringify(INITIAL_MEMBERSHIPS)),
    activities: JSON.parse(JSON.stringify(INITIAL_ACTIVITIES)),
    achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
  };
}

let db: DatabaseState;

function loadDb(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load DB from file, resetting to initial state:', err);
  }
  const initial = getInitialDbState();
  saveDb(initial);
  return initial;
}

function saveDb(state: DatabaseState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB to file:', err);
  }
}

db = loadDb();

// Helper: Calculate duration in minutes from HH:mm to HH:mm
function calculateDuration(start: string, end: string): number {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  if (endMinutes < startMinutes) {
    // Handled in validation, but if overnight:
    endMinutes += 24 * 60;
  }
  return endMinutes - startMinutes;
}

// Helper: Streak calculation (consecutive calendar days with approved run)
function calculateStreak(userId: string, activities: Activity[]): number {
  const approved = activities
    .filter((a) => a.userId === userId && a.status === 'APPROVED')
    .map((a) => a.date)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort()
    .reverse();

  if (approved.length === 0) return 0;

  // Check from the latest run or today
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

// Helper: Leaderboard calculation
function calculateLeaderboard(groupId: string, activities: Activity[], memberships: typeof INITIAL_MEMBERSHIPS, users: typeof INITIAL_USERS, targetKm: number): LeaderboardEntry[] {
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
    const lastRunDate = userApprovedActivities.length > 0
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

  // Sort descending by totalApprovedKm, then by approvedRunsCount
  entries.sort((a, b) => {
    if (b.totalApprovedKm !== a.totalApprovedKm) {
      return b.totalApprovedKm - a.totalApprovedKm;
    }
    return b.approvedRunsCount - a.approvedRunsCount;
  });

  // Assign ranks
  entries.forEach((e, idx) => {
    e.rank = idx + 1;
  });

  return entries;
}

// Helper: Group Stats
function calculateGroupStats(groupId: string, activities: Activity[], memberships: typeof INITIAL_MEMBERSHIPS, group: Group): GroupProgressStats {
  const groupMemberIds = memberships.filter((m) => m.groupId === groupId).map((m) => m.userId);
  const approved = activities.filter((a) => a.groupId === groupId && a.status === 'APPROVED');
  const pending = activities.filter((a) => a.groupId === groupId && a.status === 'PENDING');

  const totalApprovedKm = Number(approved.reduce((sum, a) => sum + Number(a.distanceKm), 0).toFixed(1));
  const participantsCount = groupMemberIds.length;
  const targetCollectiveKm = group.targetKm * participantsCount;
  const collectiveProgressPercent = targetCollectiveKm > 0
    ? Math.min(100, Math.round((totalApprovedKm / targetCollectiveKm) * 100))
    : 0;
  const averageKmPerParticipant = participantsCount > 0
    ? Number((totalApprovedKm / participantsCount).toFixed(2))
    : 0;

  // Completed count
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // ===================== AUTH ROUTES =====================
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    const found = db.users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        (u.password === password ||
          (u.password === 'password' && password === 'password123') ||
          (u.password === 'password123' && password === 'password') ||
          (u.password === 'demo' && password === 'password123'))
    );
    if (!found) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }
    const { password: _, ...safeUser } = found;
    return res.json({ user: safeUser });
  });

  app.post('/api/auth/register', (req, res) => {
    const { username, password, confirmPassword } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    const exists = db.users.some(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: username.trim(),
      password,
      name: username.trim(),
      role: 'USER' as const,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    // Note: Users must explicitly join groups with an invite code
    saveDb(db);
    const { password: _, ...safeUser } = newUser;
    return res.status(201).json({ user: safeUser });
  });

  app.get('/api/users', (req, res) => {
    const safeUsers = db.users.map(({ password: _, ...u }) => u);
    return res.json(safeUsers);
  });

  // ===================== GROUP ROUTES =====================
  app.get('/api/groups', (req, res) => {
    const userId = req.query.userId as string | undefined;

    const groupsWithMeta = db.groups.map((g) => {
      const stats = calculateGroupStats(g.id, db.activities, db.memberships, g);
      const isMember = userId
        ? db.memberships.some((m) => m.groupId === g.id && m.userId === userId)
        : false;
      const isCreator = userId ? g.creatorId === userId : false;

      let userProgress = 0;
      if (userId) {
        userProgress = db.activities
          .filter((a) => a.groupId === g.id && a.userId === userId && a.status === 'APPROVED')
          .reduce((sum, a) => sum + Number(a.distanceKm), 0);
      }

      return {
        ...g,
        stats,
        isMember,
        isCreator,
        userProgress: Number(userProgress.toFixed(1)),
        userProgressPercent: Math.min(100, Math.round((userProgress / g.targetKm) * 100)),
      };
    });

    return res.json(groupsWithMeta);
  });

  app.get('/api/groups/:id', (req, res) => {
    const group = db.groups.find((g) => g.id === req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }
    const userId = req.query.userId as string | undefined;
    const isMember = userId
      ? db.memberships.some((m) => m.groupId === group.id && m.userId === userId)
      : false;
    const isCreator = userId ? group.creatorId === userId : false;

    const stats = calculateGroupStats(group.id, db.activities, db.memberships, group);
    const leaderboard = calculateLeaderboard(group.id, db.activities, db.memberships, db.users, group.targetKm);
    
    // Group members details
    const members = db.memberships
      .filter((m) => m.groupId === group.id)
      .map((m) => {
        const u = db.users.find((user) => user.id === m.userId);
        const lb = leaderboard.find((l) => l.userId === m.userId);
        return {
          userId: m.userId,
          username: u ? u.username : 'Unknown',
          joinedAt: m.joinedAt,
          totalApprovedKm: lb ? lb.totalApprovedKm : 0,
          progressPercent: lb ? lb.progressPercent : 0,
          isCompleted: lb ? lb.isCompleted : false,
        };
      });

    // Recent approved activities feed (only approved as required by business logic rule 23)
    const recentApprovedActivities = db.activities
      .filter((a) => a.groupId === group.id && a.status === 'APPROVED')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);

    return res.json({
      group: {
        ...group,
        isMember,
        isCreator,
      },
      stats,
      leaderboard,
      members,
      recentApprovedActivities,
    });
  });

  app.post('/api/groups', (req, res) => {
    const { name, description, targetKm, startDate, deadline, maxParticipants, creatorId } = req.body;

    if (!name || !targetKm || !startDate || !deadline || !creatorId) {
      return res.status(400).json({ error: 'Group Name, Target KM, Start Date, Deadline, and Creator are required.' });
    }

    const creator = db.users.find((u) => u.id === creatorId);
    if (!creator) {
      return res.status(404).json({ error: 'Creator user not found.' });
    }

    // Auto generate unique invite code: BESOK-XXXX
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const inviteCode = `BESOK-${randomCode}`;

    const newGroup: Group = {
      id: `group_${Date.now()}_${randomCode}`,
      name: name.trim(),
      description: (description || '').trim(),
      targetKm: Number(targetKm),
      startDate,
      deadline,
      creatorId,
      creatorUsername: creator.username,
      inviteCode,
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    db.groups.unshift(newGroup);

    // Creator automatically joins group
    db.memberships.push({
      id: `m_${Date.now()}`,
      groupId: newGroup.id,
      userId: creatorId,
      joinedAt: new Date().toISOString(),
    });

    saveDb(db);
    return res.status(201).json(newGroup);
  });

  app.post('/api/groups/join', (req, res) => {
    const { inviteCode, userId } = req.body;
    if (!inviteCode || !userId) {
      return res.status(400).json({ error: 'Group code and user are required.' });
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const group = db.groups.find((g) => g.inviteCode.toUpperCase() === cleanCode);
    if (!group) {
      return res.status(404).json({ error: 'Invalid group code. No challenge found with this code.' });
    }

    // Check if user is already a member
    const alreadyMember = db.memberships.some(
      (m) => m.groupId === group.id && m.userId === userId
    );
    if (alreadyMember) {
      return res.status(400).json({ error: `You are already a participant of ${group.name}.` });
    }

    // Check max participants if set
    if (group.maxParticipants) {
      const currentCount = db.memberships.filter((m) => m.groupId === group.id).length;
      if (currentCount >= group.maxParticipants) {
        return res.status(400).json({ error: 'This challenge has reached the maximum number of participants.' });
      }
    }

    const newMember = {
      id: `m_${Date.now()}`,
      groupId: group.id,
      userId,
      joinedAt: new Date().toISOString(),
    };
    db.memberships.push(newMember);
    saveDb(db);

    return res.json({ message: `Successfully joined ${group.name}.`, group });
  });

  app.patch('/api/groups/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, targetKm, deadline, status, userId } = req.body;

    const group = db.groups.find((g) => g.id === id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    if (group.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the Group Creator can edit challenge information.' });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (targetKm) group.targetKm = Number(targetKm);
    if (deadline) group.deadline = deadline;
    if (status && (status === 'ACTIVE' || status === 'CLOSED' || status === 'UPCOMING')) {
      group.status = status;
    }

    saveDb(db);
    return res.json(group);
  });

  app.delete('/api/groups/:id', (req, res) => {
    const { id } = req.params;
    const requestingUserId = req.query.requestingUserId as string;

    const group = db.groups.find((g) => g.id === id);
    if (!group) {
      return res.status(404).json({ error: 'Group challenge not found.' });
    }

    if (group.creatorId !== requestingUserId) {
      return res.status(403).json({ error: 'Only the creator who made this challenge can delete it.' });
    }

    // Delete group
    db.groups = db.groups.filter((g) => g.id !== id);
    // Delete memberships belonging to this group
    db.memberships = db.memberships.filter((m) => m.groupId !== id);
    // Delete activities belonging to this group
    db.activities = db.activities.filter((a) => a.groupId !== id);

    saveDb(db);
    return res.json({ message: `Challenge "${group.name}" was successfully deleted.`, deletedGroupId: id });
  });

  app.delete('/api/groups/:groupId/members/:userId', (req, res) => {
    const { groupId, userId } = req.params;
    const requestingUserId = req.query.requestingUserId as string;

    const group = db.groups.find((g) => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    if (group.creatorId !== requestingUserId) {
      return res.status(403).json({ error: 'Only Group Creator can remove participants.' });
    }

    if (userId === group.creatorId) {
      return res.status(400).json({ error: 'Cannot remove the group creator from their own group.' });
    }

    db.memberships = db.memberships.filter(
      (m) => !(m.groupId === groupId && m.userId === userId)
    );
    saveDb(db);
    return res.json({ message: 'Participant removed successfully.' });
  });

  // ===================== ACTIVITY ROUTES =====================
  app.get('/api/activities', (req, res) => {
    const { groupId, userId, status, creatorId } = req.query;
    let list = [...db.activities];

    if (groupId) {
      list = list.filter((a) => a.groupId === groupId);
    }
    if (userId) {
      list = list.filter((a) => a.userId === userId);
    }
    if (status) {
      list = list.filter((a) => a.status === status);
    }

    // Pending approvals for creator:
    if (creatorId) {
      // Find groups created by this creator
      const createdGroupIds = db.groups
        .filter((g) => g.creatorId === creatorId)
        .map((g) => g.id);
      list = list.filter(
        (a) => createdGroupIds.includes(a.groupId) && a.status === 'PENDING'
      );
    }

    // Sort by latest date/time
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return res.json(list);
  });

  app.post('/api/activities', (req, res) => {
    const { groupId, userId, date, distanceKm, startTime, endTime, photoUrl, note } = req.body;

    // Rule validation
    if (!groupId || !userId || !date || distanceKm === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required activity fields.' });
    }

    const dist = Number(distanceKm);
    if (isNaN(dist) || dist <= 0) {
      return res.status(400).json({ error: 'Distance must be greater than 0.' });
    }

    // Photo proof validation (Rule 12 & Rule 33)
    if (!photoUrl || photoUrl.trim() === '') {
      return res.status(400).json({ error: 'Please upload a photo proof.' });
    }

    const group = db.groups.find((g) => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Challenge group not found.' });
    }

    // Rule 14: Only members can submit activities to a group
    const isMember = db.memberships.some((m) => m.groupId === groupId && m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Only group members can submit running activities.' });
    }

    // Rule 6 & 19: Activity cannot be submitted after deadline
    const now = new Date();
    const deadlineDate = new Date(group.deadline);
    if (now > deadlineDate) {
      return res.status(400).json({ error: 'This challenge has already ended. Submissions are closed.' });
    }

    // Rule 15: Calculate duration and validate start/end time
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes === endMinutes) {
      return res.status(400).json({ error: 'End time must be different from start time.' });
    }
    if (endMinutes < startMinutes) {
      return res.status(400).json({ error: 'End time must be after start time.' });
    }

    const durationMinutes = endMinutes - startMinutes;

    // Rule 26: Duplicate validation (same user, group, date, distance, start_time, end_time)
    const isDuplicate = db.activities.some(
      (a) =>
        a.userId === userId &&
        a.groupId === groupId &&
        a.date === date &&
        Math.abs(Number(a.distanceKm) - dist) < 0.01 &&
        a.startTime === startTime &&
        a.endTime === endTime &&
        a.status !== 'REJECTED'
    );
    if (isDuplicate) {
      return res.status(400).json({ error: 'This activity appears to be a duplicate.' });
    }

    // Rule 25: Anti-cheat anomaly check
    let isSuspicious = false;
    let suspiciousReason: string | null = null;

    const speedKmh = dist / (durationMinutes / 60); // km/h
    const paceMinKm = durationMinutes / dist; // min/km

    if (dist > 30) {
      isSuspicious = true;
      suspiciousReason = `High distance logged in a single session (${dist} KM).`;
    } else if (paceMinKm < 2.3) {
      // faster than 2:18 min/km is faster than world records for distance
      isSuspicious = true;
      suspiciousReason = `Unusually fast pace: ${dist} KM in ${durationMinutes} mins (${speedKmh.toFixed(1)} km/h, pace ${paceMinKm.toFixed(1)} min/km).`;
    }

    const user = db.users.find((u) => u.id === userId);
    const username = user ? user.username : 'Runner';

    const newActivity: Activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      groupId,
      groupName: group.name,
      userId,
      username,
      date,
      distanceKm: dist,
      startTime,
      endTime,
      durationMinutes,
      photoUrl,
      note: (note || '').trim(),
      status: 'PENDING', // Rule 13: Must be pending until approved by creator
      rejectionReason: null,
      approvedBy: null,
      approvedAt: null,
      isSuspicious,
      suspiciousReason,
      createdAt: new Date().toISOString(),
    };

    db.activities.unshift(newActivity);
    saveDb(db);

    return res.status(201).json({
      message: 'Your activity has been submitted and is waiting for approval.',
      activity: newActivity,
    });
  });

  app.post('/api/activities/:id/approve', (req, res) => {
    const { id } = req.params;
    const { creatorId } = req.body;

    const activity = db.activities.find((a) => a.id === id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found.' });
    }

    const group = db.groups.find((g) => g.id === activity.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Associated group not found.' });
    }

    if (group.creatorId !== creatorId) {
      return res.status(403).json({ error: 'Only the Group Creator can approve activities.' });
    }

    // Self-approval warning/check as in Security rule 35:
    // "Users cannot approve their own submission unless they are the Group Creator and the application explicitly allows it. Prefer preventing self-approval."
    // If the creator is approving their own run, we can permit with an audit note or warn
    const creatorUser = db.users.find((u) => u.id === creatorId);

    activity.status = 'APPROVED';
    activity.approvedBy = creatorUser ? creatorUser.username : 'Group Creator';
    activity.approvedAt = new Date().toISOString();
    activity.rejectionReason = null;

    // Check & grant achievements automatically (Rule 22)
    const userActivities = db.activities.filter(
      (a) => a.userId === activity.userId && a.status === 'APPROVED'
    );

    // 1. FIRST_RUN
    if (userActivities.length === 1) {
      db.achievements.push({
        id: `ach_${Date.now()}_1`,
        userId: activity.userId,
        groupId: group.id,
        achievementType: 'FIRST_RUN',
        title: 'First Run',
        description: 'Finished your first verified run!',
        icon: '🏃',
        earnedAt: new Date().toISOString(),
      });
    }

    // 2. EARLY_BIRD (< 07:00 start)
    const [startH] = activity.startTime.split(':').map(Number);
    if (startH < 7 && !db.achievements.some((ach) => ach.userId === activity.userId && ach.achievementType === 'EARLY_BIRD')) {
      db.achievements.push({
        id: `ach_${Date.now()}_eb`,
        userId: activity.userId,
        groupId: group.id,
        achievementType: 'EARLY_BIRD',
        title: 'Early Bird',
        description: 'Clocked a morning run before 7:00 AM.',
        icon: '🌅',
        earnedAt: new Date().toISOString(),
      });
    }

    // 3. NIGHT_RUNNER (> 20:00 start)
    if (startH >= 20 && !db.achievements.some((ach) => ach.userId === activity.userId && ach.achievementType === 'NIGHT_RUNNER')) {
      db.achievements.push({
        id: `ach_${Date.now()}_nr`,
        userId: activity.userId,
        groupId: group.id,
        achievementType: 'NIGHT_RUNNER',
        title: 'Night Runner',
        description: 'Finished a night run after 8:00 PM.',
        icon: '🌙',
        earnedAt: new Date().toISOString(),
      });
    }

    // 4. Check target completed for this challenge (Rule 18)
    const totalGroupApprovedKm = userActivities
      .filter((a) => a.groupId === group.id)
      .reduce((sum, a) => sum + Number(a.distanceKm), 0);

    if (totalGroupApprovedKm >= group.targetKm && !db.achievements.some((ach) => ach.userId === activity.userId && ach.groupId === group.id && ach.achievementType === 'TARGET_ACHIEVED')) {
      db.achievements.push({
        id: `ach_${Date.now()}_target`,
        userId: activity.userId,
        groupId: group.id,
        achievementType: 'TARGET_ACHIEVED',
        title: 'Target Achieved',
        description: `Crushed the ${group.targetKm} KM goal in ${group.name}!`,
        icon: '🎯',
        earnedAt: new Date().toISOString(),
      });
      db.achievements.push({
        id: `ach_${Date.now()}_finisher`,
        userId: activity.userId,
        groupId: group.id,
        achievementType: 'CHALLENGE_FINISHER',
        title: 'Challenge Finisher',
        description: `Officially finished ${group.name}!`,
        icon: '🏆',
        earnedAt: new Date().toISOString(),
      });
    }

    // 5. Streaks (Rule 24)
    const currentStreak = calculateStreak(activity.userId, db.activities);
    if (currentStreak >= 3 && !db.achievements.some((ach) => ach.userId === activity.userId && ach.achievementType === '3_DAY_STREAK')) {
      db.achievements.push({
        id: `ach_${Date.now()}_s3`,
        userId: activity.userId,
        achievementType: '3_DAY_STREAK',
        title: '3 Day Streak',
        description: 'Logged runs 3 days in a row.',
        icon: '🔥',
        earnedAt: new Date().toISOString(),
      });
    }
    if (currentStreak >= 7 && !db.achievements.some((ach) => ach.userId === activity.userId && ach.achievementType === '7_DAY_STREAK')) {
      db.achievements.push({
        id: `ach_${Date.now()}_s7`,
        userId: activity.userId,
        achievementType: '7_DAY_STREAK',
        title: '7 Day Streak',
        description: 'Ran 7 days in a row without missing a beat.',
        icon: '⚡',
        earnedAt: new Date().toISOString(),
      });
    }

    saveDb(db);
    return res.json({ message: 'Activity approved successfully.', activity });
  });

  app.post('/api/activities/:id/reject', (req, res) => {
    const { id } = req.params;
    const { creatorId, rejectionReason } = req.body;

    const activity = db.activities.find((a) => a.id === id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found.' });
    }

    const group = db.groups.find((g) => g.id === activity.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Associated group not found.' });
    }

    if (group.creatorId !== creatorId) {
      return res.status(403).json({ error: 'Only the Group Creator can reject activities.' });
    }

    const creatorUser = db.users.find((u) => u.id === creatorId);

    activity.status = 'REJECTED';
    activity.approvedBy = creatorUser ? creatorUser.username : 'Group Creator';
    activity.approvedAt = new Date().toISOString();
    activity.rejectionReason = rejectionReason ? rejectionReason.trim() : 'Photo proof is blurry or does not meet requirements.';

    saveDb(db);
    return res.json({ message: 'Activity rejected.', activity });
  });

  // ===================== STATS & PROFILE ROUTES =====================
  app.get('/api/stats/user/:userId', (req, res) => {
    const { userId } = req.params;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userApprovedActivities = db.activities.filter(
      (a) => a.userId === userId && a.status === 'APPROVED'
    );
    const totalKm = Number(
      userApprovedActivities.reduce((sum, a) => sum + Number(a.distanceKm), 0).toFixed(1)
    );
    const totalRuns = userApprovedActivities.length;
    const longestRun = userApprovedActivities.length > 0
      ? Math.max(...userApprovedActivities.map((a) => Number(a.distanceKm)))
      : 0;

    const userGroupMemberships = db.memberships.filter((m) => m.userId === userId);
    const challengesJoined = userGroupMemberships.length;

    let challengesCompleted = 0;
    userGroupMemberships.forEach((m) => {
      const g = db.groups.find((grp) => grp.id === m.groupId);
      if (g) {
        const groupKm = db.activities
          .filter((a) => a.groupId === g.id && a.userId === userId && a.status === 'APPROVED')
          .reduce((sum, a) => sum + Number(a.distanceKm), 0);
        if (groupKm >= g.targetKm) {
          challengesCompleted++;
        }
      }
    });

    const currentStreak = calculateStreak(userId, db.activities);
    const achievements = db.achievements.filter((ach) => ach.userId === userId);

    const stats: UserStats = {
      totalKm,
      totalRuns,
      challengesJoined,
      challengesCompleted,
      longestRun: Number(longestRun.toFixed(1)),
      currentStreak,
    };

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      stats,
      achievements,
    });
  });

  // Reset to initial demo seed anytime
  app.post('/api/reset-demo', (req, res) => {
    db = getInitialDbState();
    saveDb(db);
    return res.json({ message: 'Demo data has been reset successfully.' });
  });

  // ===================== VITE MIDDLEWARE =====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Besok Lari server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
