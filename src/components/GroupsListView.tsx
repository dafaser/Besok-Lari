import React, { useState } from 'react';
import { Plus, Users, Calendar, Target, ChevronRight, CheckCircle2, Trash2, Filter, AlertCircle } from 'lucide-react';
import { Group, User } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { formatDeadline } from '../utils/dateUtils';

interface GroupsListViewProps {
  groups: Group[];
  userGroupIds: string[];
  activeGroupId: string | null;
  currentUser: User;
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: (initialCode?: string) => void;
  onDeleteGroup?: (groupId: string) => Promise<void>;
}

export const GroupsListView: React.FC<GroupsListViewProps> = ({
  groups,
  userGroupIds,
  activeGroupId,
  currentUser,
  onSelectGroup,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onDeleteGroup,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!groupToDelete || !onDeleteGroup) return;
    setIsDeleting(true);
    try {
      await onDeleteGroup(groupToDelete.id);
    } finally {
      setIsDeleting(false);
      setGroupToDelete(null);
    }
  };

  const filteredGroups = groups.filter((g) => {
    if (filterStatus === 'ALL') return true;
    return g.status === filterStatus;
  });

  const activeCount = groups.filter((g) => g.status === 'ACTIVE').length;
  const closedCount = groups.filter((g) => g.status === 'CLOSED').length;

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24 md:pb-12">
      {/* Header Banner - Mobile First */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
              COMMUNITY & CHALLENGES
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              CHALLENGE GROUPS
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Browse active and past Besok Lari challenges
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <button
              onClick={() => onOpenJoinGroup()}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 active:bg-stone-100 text-xs font-bold text-stone-700 transition-colors cursor-pointer text-center"
            >
              + Join Code
            </button>
            <button
              onClick={onOpenCreateGroup}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black shadow-sm shadow-emerald-700/20 transition-all cursor-pointer text-center"
            >
              + New Challenge
            </button>
          </div>
        </div>

        {/* Filter Chips: All, Active, Finished */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-stone-100 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All ({groups.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === 'ACTIVE'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('CLOSED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === 'CLOSED'
                ? 'bg-stone-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Finished ({closedCount})
          </button>
        </div>
      </div>

      {/* Challenge Cards List */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center">
            <div className="text-3xl mb-2">🏃</div>
            <h3 className="font-black text-sm text-stone-800">No challenges in this category</h3>
            <p className="text-xs text-stone-500 mt-1">
              {filterStatus === 'CLOSED'
                ? 'No finished challenges yet.'
                : 'Create a new challenge or join with an invite code.'}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isMember = userGroupIds.includes(group.id);
            const isCurrentActive = group.id === activeGroupId;
            const isCreator = group.creatorId === currentUser.id;
            const isClosed = group.status === 'CLOSED';

            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between active:scale-[0.99] ${
                  isCurrentActive
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-stone-200 hover:border-emerald-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          isClosed
                            ? 'bg-stone-200 text-stone-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isClosed ? '🏁 FINISHED' : '🏃 ACTIVE'}
                      </span>
                      {isCreator && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          CREATOR
                        </span>
                      )}
                      {isCurrentActive && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          SELECTED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-mono text-emerald-700">
                        {group.targetKm} KM
                      </span>
                      {/* Delete Challenge Button strictly for its Creator */}
                      {isCreator && onDeleteGroup && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupToDelete(group);
                          }}
                          className="px-2 py-1 text-[11px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-rose-200/60"
                          title="Delete this challenge"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
                    {group.name}
                  </h3>
                  <p className="text-xs text-stone-600 line-clamp-2 mt-1 mb-3">
                    {group.description}
                  </p>
                </div>

                <div className="border-t border-stone-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {formatDeadline(group.deadline)}
                    </span>
                    <span className="font-mono font-bold text-xs bg-stone-100 px-2 py-0.5 rounded-md text-stone-700">
                      {group.inviteCode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-xs font-bold flex items-center gap-1 ${isMember ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {isMember ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>You're In</span>
                        </>
                      ) : (
                        <span>Not Joined</span>
                      )}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isMember && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenJoinGroup(group.inviteCode);
                          }}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          + Join
                        </button>
                      )}
                      <span className="text-stone-400 hover:text-stone-700 text-xs font-bold flex items-center">
                        View <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Deleting Active or Past Challenge */}
      {groupToDelete && (
        <ConfirmationModal
          isOpen={Boolean(groupToDelete)}
          onClose={() => setGroupToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete Challenge "${groupToDelete.name}"?`}
          message={`Are you sure you want to permanently delete "${groupToDelete.name}" (${groupToDelete.status === 'ACTIVE' ? 'Active' : 'Closed'})? All recorded distances, runner memberships, and running logs will be permanently erased.`}
          confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
          cancelText="Cancel"
          type="reject"
        />
      )}
    </div>
  );
};
