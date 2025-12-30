
import React, { useState } from 'react';
import { User } from '@/types/user';
import { UpdateManagerDialog } from '@/components/UpdateManagerDialog';
import { UserActions } from './UserActions';
import { UserTableHeader } from './UserTableHeader';
import { UserTableRow } from './UserTableRow';

interface UserListTableProps {
  users: User[];
  onUserClick: (user: User) => void;
  onExportSelected: (users: User[]) => void;
  onDeleteSelected: (userIds: string[]) => void;
  onManagerUpdate?: (userId: string, manager: string | null) => void;
}

type SortField = 'name' | 'status' | 'portal' | 'manager' | 'createdDate';
type SortDirection = 'asc' | 'desc';

export const UserListTable = ({
  users,
  onUserClick,
  onExportSelected,
  onDeleteSelected,
  onManagerUpdate,
}: UserListTableProps) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const allManagers = users
    .map(user => user.manager)
    .filter((manager): manager is string => Boolean(manager));

  const sortedUsers = [...users].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'portal':
        aValue = a.portal || '';
        bValue = b.portal || '';
        break;
      case 'manager':
        aValue = a.manager || '';
        bValue = b.manager || '';
        break;
      case 'createdDate':
        aValue = new Date(a.createdDate).getTime();
        bValue = new Date(b.createdDate).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectUser = (userId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (isChecked: boolean) => {
    setSelectedUserIds(isChecked ? users.map(user => user.id) : []);
  };

  const clearSelection = () => setSelectedUserIds([]);

  const handleExportClick = () => {
    const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
    onExportSelected(selectedUsers);
    clearSelection();
  };

  const handleDeleteClick = () => {
    onDeleteSelected(selectedUserIds);
    clearSelection();
  };

  const handleManagerUpdateClick = () => {
    setManagerDialogOpen(true);
  };

  const handleUpdateManager = (userId: string, manager: string | null) => {
    if (onManagerUpdate) {
      selectedUserIds.forEach(id => {
        onManagerUpdate(id, manager);
      });
      clearSelection();
    }
  };

  const selectedUser = selectedUserIds.length > 0 
    ? users.find(user => user.id === selectedUserIds[0]) || null
    : null;

  return (
    <div className="space-y-4">
      {selectedUserIds.length > 0 && (
        <UserActions 
          selectedCount={selectedUserIds.length}
          onExportClick={handleExportClick}
          onManagerUpdateClick={handleManagerUpdateClick}
          onDeleteClick={handleDeleteClick}
        />
      )}
      
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <UserTableHeader 
              onSelectAll={handleSelectAll} 
              allSelected={selectedUserIds.length === users.length && users.length > 0} 
              userCount={users.length}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
            />
            <tbody>
              {sortedUsers.map(user => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  isSelected={selectedUserIds.includes(user.id)}
                  onSelectUser={handleSelectUser}
                  onClick={onUserClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <UpdateManagerDialog 
        open={managerDialogOpen}
        onOpenChange={setManagerDialogOpen}
        user={selectedUser}
        managers={allManagers}
        onUpdate={handleUpdateManager}
      />
    </div>
  );
};