import React, { useState, useEffect, useCallback } from 'react';
import { api, GroupDetailResponse } from './services/api';
import {
  User,
  Group,
  Activity,
  LeaderboardEntry,
  UserStats,
  Achievement,
  GroupProgressStats,
} from './types';
import { Navbar, TabType } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { GroupDetailView } from './components/GroupDetailView';
import { MyRunsView } from './components/MyRunsView';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { GroupsListView } from './components/GroupsListView';
import { PendingApprovalsView } from './components/PendingApprovalsView';
import { AddRunModal } from './components/AddRunModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { PhotoViewModal } from './components/PhotoViewModal';
import { AuthView } from './components/AuthView';
import { ToastProvider, useToast } from './components/Toast';

function FunRunApp() {
  const { showToast } = useToast();

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // Core Data State
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [activeGroupStats, setActiveGroupStats] = useState<GroupProgressStats | null>(null);
  const [activeLeaderboard, setActiveLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeGroupMembers, setActiveGroupMembers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userActivities, setUserActivities] = useState<Activity[]>([]);
  const [recentApprovedActivities, setRecentApprovedActivities] = useState<Activity[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Activity[]>([]);

  // Modals state
  const [isAddRunOpen, setIsAddRunOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [joinModalInitialCode, setJoinModalInitialCode] = useState<string>('');
  const [photoModalActivity, setPhotoModalActivity] = useState<Activity | null>(null);

  const handleOpenJoinGroup = (code?: string) => {
    setJoinModalInitialCode(code || '');
    setIsJoinGroupOpen(true);
  };

  // 1. Initial Load: Check Auth & Sync any offline data to Firebase
  useEffect(() => {
    api.syncLocalData().catch(() => {});
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // 2. Refresh all data
  const refreshData = useCallback(async () => {
    try {
      // Fetch users
      const users = await api.getUsers();
      setAllUsers(users);

      // Auto-sync client user and data to server if missing
      if (currentUser && !users.some((u) => u.id === currentUser.id)) {
        await api.syncLocalData();
        const updatedUsers = await api.getUsers();
        setAllUsers(updatedUsers);
      }

      // Keep currentUser state in sync with fresh user record if avatar or username changed
      if (currentUser) {
        const freshUser = users.find(
          (u) => u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase()
        );
        if (freshUser && (freshUser.avatar !== currentUser.avatar || freshUser.username !== currentUser.username)) {
          setCurrentUser(freshUser);
          api.setCurrentUser(freshUser);
        }
      }

      // Fetch groups with user context so isMember is computed
      const allGroups = await api.getGroups(currentUser?.id);
      setGroups(allGroups);

      // Groups the current user has actually joined or created
      const userGrps = currentUser
        ? allGroups.filter((g: any) => g.isMember || g.creatorId === currentUser.id)
        : [];
      setUserGroupIds(userGrps.map((g) => g.id));

      // Decide target group for Dashboard & Active view:
      // 1. If user previously selected a group that they are actually in, use it.
      // 2. Otherwise default to a group the user actually joined.
      // 3. If the user hasn't joined any group yet, targetId is empty (no active challenge joined yet).
      let targetId = '';
      if (selectedGroupId && userGrps.some((g: any) => g.id === selectedGroupId)) {
        targetId = selectedGroupId;
      } else if (userGrps.length > 0) {
        targetId = userGrps[0].id;
      }

      setSelectedGroupId(targetId);

      if (targetId) {
        try {
          const detail: GroupDetailResponse = await api.getGroupDetail(targetId, currentUser?.id);
          setActiveGroup(detail.group);
          setActiveGroupStats(detail.stats);
          setActiveLeaderboard(detail.leaderboard);
          setActiveGroupMembers(detail.members);
          setRecentApprovedActivities(detail.recentApprovedActivities);
        } catch (detailErr) {
          console.error('Failed to load group detail', detailErr);
          setSelectedGroupId('');
          setActiveGroup(null);
          setActiveGroupStats(null);
          setActiveLeaderboard([]);
          setActiveGroupMembers([]);
          setRecentApprovedActivities([]);
        }
      } else {
        setActiveGroup(null);
        setActiveGroupStats(null);
        setActiveLeaderboard([]);
        setActiveGroupMembers([]);
        setRecentApprovedActivities([]);
      }

      if (currentUser) {
        // User specific stats & activities
        try {
          const statsRes = await api.getUserStats(currentUser.id);
          setUserStats(statsRes.stats);
          setAchievements(statsRes.achievements);
        } catch (e) {
          console.error(e);
        }

        try {
          const userActs = await api.getActivities({ userId: currentUser.id });
          setUserActivities(userActs);
        } catch (e) {
          console.error(e);
        }

        // Fitur approval aktif ketika user membuat grup (menjadi host dari tantangan tersebut)
        const hasCreatedGroups = allGroups.some((g: any) => g.creatorId === currentUser.id);

        if (hasCreatedGroups) {
          try {
            const pending = await api.getActivities({
              creatorId: currentUser.id,
              status: 'PENDING',
            });
            setPendingApprovals(pending);
          } catch (e) {
            console.error(e);
          }
        } else {
          setPendingApprovals([]);
        }
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, [currentUser, selectedGroupId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auth Handlers
  const handleLogin = async (username: string, password?: string) => {
    const user = await api.login(username, password);
    setCurrentUser(user);
    setSelectedGroupId('');
    return user;
  };

  const handleRegister = async (username: string, password?: string, role?: 'USER' | 'CREATOR') => {
    const user = await api.register(username, password, role);
    setCurrentUser(user);
    setSelectedGroupId('');
    return user;
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setSelectedGroupId('');
    showToast('Logged out. See you on the next run!', 'info');
  };

  const handleUpdateProfile = async (data: {
    username?: string;
    password?: string;
    avatar?: string | null;
  }) => {
    if (!currentUser) return;
    const updatedUser = await api.updateProfile(currentUser.id, {
      ...data,
      currentUsername: currentUser.username,
    });
    setCurrentUser(updatedUser);
    await refreshData();
  };

  const handleSwitchUser = async (username: string) => {
    try {
      const user = await api.login(username);
      setCurrentUser(user);
      setSelectedGroupId(''); // Reset selected group so the new user sees their own challenges
      showToast(`Switched to test runner ${username}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Could not switch accounts', 'error');
    }
  };

  // Run Submission Handler (Rule 12 & 13)
  const handleSubmitRun = async (data: {
    groupId: string;
    date: string;
    distanceKm: number;
    startTime: string;
    endTime: string;
    photoUrl: string;
    photoUrls?: string[];
    note?: string;
  }) => {
    if (!currentUser) return;
    await api.submitActivity({
      ...data,
      userId: currentUser.id,
      username: currentUser.username,
    });
    showToast('Run submitted! Waiting for the challenge host to approve.', 'success');
    await refreshData();
  };

  // Creator Approval Handlers (Rule 14)
  const handleApproveActivity = async (activityId: string) => {
    if (!currentUser) return;
    await api.approveActivity(activityId, currentUser.id);
    showToast('Run approved! Distance added to the board.', 'success');
    await refreshData();
  };

  const handleRejectActivity = async (activityId: string, reason?: string) => {
    if (!currentUser) return;
    await api.rejectActivity(activityId, currentUser.id, reason);
    showToast('Run rejected.', 'info');
    await refreshData();
  };

  // Create Group Handler (Rule 7)
  const handleCreateGroup = async (data: {
    name: string;
    description: string;
    targetKm: number;
    startDate: string;
    deadline: string;
    maxParticipants?: number | null;
  }) => {
    if (!currentUser) throw new Error('Please log in first.');
    const newGroup = await api.createGroup({
      ...data,
      creatorId: currentUser.id,
    });
    setSelectedGroupId(newGroup.id);
    await refreshData();
    return newGroup;
  };

  // Join Group Handler (Rule 8)
  const handleJoinGroup = async (inviteCode: string) => {
    if (!currentUser) throw new Error('Please log in first.');
    const res = await api.joinGroup(inviteCode, currentUser.id);
    setSelectedGroupId(res.group.id);
    await refreshData();
    return res.group;
  };

  // Remove participant handler
  const handleRemoveParticipant = async (userId: string, username: string) => {
    if (!activeGroup || !currentUser) return;
    try {
      await api.removeParticipant(activeGroup.id, userId, currentUser.id);
      showToast(`Runner @${username} berhasil dikeluarkan dari challenge.`, 'info');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengeluarkan runner.', 'error');
    }
  };

  // Edit group handler (Rule 27)
  const handleEditGroup = async (data: {
    name?: string;
    description?: string;
    targetKm?: number;
    deadline?: string;
    status?: 'ACTIVE' | 'CLOSED';
  }) => {
    if (!activeGroup || !currentUser) return;
    await api.editGroup(activeGroup.id, {
      ...data,
      userId: currentUser.id,
    });
    await refreshData();
  };

  // Delete group handler (both active and past challenges)
  const handleDeleteGroup = async (groupId: string) => {
    if (!currentUser) return;
    try {
      await api.deleteGroup(groupId, currentUser.id);
      showToast('Challenge deleted successfully.', 'info');
      setSelectedGroupId('');
      setCurrentTab('dashboard');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete challenge.', 'error');
    }
  };

  // Current user's progress in active group
  const userEntryInActiveGroup = activeLeaderboard.find((l) => l.userId === currentUser?.id);
  const userActiveProgressKm = userEntryInActiveGroup ? userEntryInActiveGroup.totalApprovedKm : 0;

  // Other groups list
  const otherGroups = groups.filter((g) => g.id !== selectedGroupId);

  // If not logged in, show Auth View
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-100 font-sans text-stone-900">
        <AuthView
          onLogin={handleLogin}
          onRegister={handleRegister}
          onShowToast={showToast}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 flex flex-col selection:bg-emerald-200">
      {/* Navbar with responsive desktop & mobile tabs + prominent Add Run button */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAddRun={() => setIsAddRunOpen(true)}
        pendingApprovalsCount={pendingApprovals.length}
        availableUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        hasCreatedGroups={groups.some((g) => g.creatorId === currentUser?.id)}
      />

      {/* Main Content Area - Handphone First & Mobile Friendly */}
      <main className="flex-1 max-w-xl sm:max-w-2xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-5 pb-28">
        {/* Tab 1: Dashboard (Prioritized strictly according to Rule 38) */}
        {currentTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            activeGroup={activeGroup}
            activeGroupStats={activeGroupStats}
            activeLeaderboard={activeLeaderboard}
            userStats={userStats}
            userActiveProgressKm={userActiveProgressKm}
            recentApprovedActivities={recentApprovedActivities}
            otherGroups={otherGroups}
            pendingApprovals={pendingApprovals}
            onOpenAddRun={() => setIsAddRunOpen(true)}
            onViewChallenge={(groupId) => {
              setSelectedGroupId(groupId);
              setCurrentTab('manage-groups');
            }}
            onOpenPendingApprovals={() => setCurrentTab('pending-approvals')}
            onApproveActivity={(act) => handleApproveActivity(act.id)}
            onRejectActivity={(act) => handleRejectActivity(act.id)}
            onViewPhoto={(act) => setPhotoModalActivity(act)}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenJoinGroup={(code) => handleOpenJoinGroup(code)}
            onDeleteGroup={handleDeleteGroup}
          />
        )}

        {/* Tab 2: Group Detail View (Rule 9) */}
        {currentTab === 'manage-groups' && activeGroup && (
          <GroupDetailView
            group={activeGroup}
            stats={
              activeGroupStats || {
                totalApprovedKm: 0,
                participantsCount: 0,
                averageKmPerParticipant: 0,
                targetCollectiveKm: 0,
                collectiveProgressPercent: 0,
                completedParticipantsCount: 0,
                pendingApprovalsCount: 0,
              }
            }
            leaderboard={activeLeaderboard}
            members={activeGroupMembers}
            recentActivities={recentApprovedActivities}
            currentUser={currentUser}
            onBack={() => setCurrentTab('dashboard')}
            onOpenAddRun={() => setIsAddRunOpen(true)}
            onViewPhoto={(act) => setPhotoModalActivity(act)}
            onRemoveParticipant={handleRemoveParticipant}
            onEditGroup={handleEditGroup}
            onShowToast={showToast}
            onOpenJoinGroup={(code) => handleOpenJoinGroup(code)}
            onDeleteGroup={handleDeleteGroup}
          />
        )}

        {/* Tab 3: My Runs View (Rule 16) */}
        {currentTab === 'my-runs' && (
          <MyRunsView
            activities={userActivities}
            onOpenAddRun={() => setIsAddRunOpen(true)}
            onViewPhoto={(act) => setPhotoModalActivity(act)}
          />
        )}

        {/* Tab 4: Groups Explorer */}
        {currentTab === 'groups' && (
          <GroupsListView
            groups={groups}
            userGroupIds={userGroupIds}
            activeGroupId={selectedGroupId}
            currentUser={currentUser}
            onSelectGroup={(id) => {
              setSelectedGroupId(id);
              setCurrentTab('manage-groups');
            }}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenJoinGroup={(code) => handleOpenJoinGroup(code)}
            onDeleteGroup={handleDeleteGroup}
          />
        )}

        {/* Tab 5: Leaderboard View (Rule 11) */}
        {currentTab === 'leaderboard' && (
          <LeaderboardView
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={(id) => setSelectedGroupId(id)}
            leaderboard={activeLeaderboard}
            currentUser={currentUser}
          />
        )}

        {/* Tab 6: Profile View (Rule 21 & 22) */}
        {currentTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            stats={userStats}
            achievements={achievements}
            hasCreatedGroups={groups.some((g) => g.creatorId === currentUser.id)}
            onOpenAddRun={() => setIsAddRunOpen(true)}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
            onShowToast={showToast}
          />
        )}

        {/* Tab 7: Creator Pending Approvals (Rule 14 & 39) */}
        {currentTab === 'pending-approvals' && (
          <PendingApprovalsView
            pendingActivities={pendingApprovals}
            onApprove={handleApproveActivity}
            onReject={handleRejectActivity}
            onViewPhoto={(act) => setPhotoModalActivity(act)}
          />
        )}
      </main>

      {/* Global Modals */}
      {/* 1. Add Run Form (The most important action - Rule 12, 13, 15, 25, 26) */}
      <AddRunModal
        isOpen={isAddRunOpen}
        onClose={() => setIsAddRunOpen(false)}
        onSubmit={handleSubmitRun}
        groups={groups.filter((g) => userGroupIds.includes(g.id))}
        selectedGroupId={selectedGroupId}
        onOpenJoinGroup={() => handleOpenJoinGroup()}
      />

      {/* 2. Create Group Modal (Rule 7) */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSubmit={handleCreateGroup}
        onShowToast={showToast}
      />

      {/* 3. Join Group Modal (Rule 8) */}
      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        onClose={() => {
          setIsJoinGroupOpen(false);
          setJoinModalInitialCode('');
        }}
        onJoin={handleJoinGroup}
        onShowToast={showToast}
        availableGroups={groups.filter((g) => !userGroupIds.includes(g.id))}
        initialCode={joinModalInitialCode}
      />

      {/* 4. Full Photo Proof Modal (Rule 14 & 16) */}
      <PhotoViewModal
        activity={photoModalActivity}
        onClose={() => setPhotoModalActivity(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <FunRunApp />
    </ToastProvider>
  );
}
