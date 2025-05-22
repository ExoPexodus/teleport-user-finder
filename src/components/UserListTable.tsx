
import React, { useState } from 'react';
import { User } from '@/types/user';
import {
  Table,
  TableBody,
} from '@/components/ui/table';
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

export const UserListTable = ({
  users,
  onUserClick,
  onExportSelected,
  onDeleteSelected,
  onManagerUpdate,
}: UserListTableProps) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);

  // Extract all managers from users
  const allManagers = users
    .map(user => user.manager)
    .filter((manager): manager is string => Boolean(manager));

  const handleSelectUser = (userId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedUserIds(users.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleExportClick = () => {
    const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
    onExportSelected(selectedUsers);
  };

  const handleDeleteClick = () => {
    onDeleteSelected(selectedUserIds);
  };

  const handleManagerUpdateClick = () => {
    setManagerDialogOpen(true);
  };

  const handleUpdateManager = (userId: string, manager: string | null) => {
    if (onManagerUpdate) {
      // Apply the manager update to all selected users
      selectedUserIds.forEach(id => {
        onManagerUpdate(id, manager);
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPortalColor = (portal: string | null) => {
    switch (portal) {
      case 'kocharsoft': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'igzy': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'maxicus': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Find the first selected user to use as a reference for the manager dialog
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
      
      <div className="rounded-md border border-slate-800 overflow-hidden">
        <Table className="bg-teleport-gray">
          <UserTableHeader 
            onSelectAll={handleSelectAll} 
            allSelected={selectedUserIds.length === users.length} 
            userCount={users.length}
          />
          <TableBody>
            {users.map(user => (
              <UserTableRow
                key={user.id}
                user={user}
                isSelected={selectedUserIds.includes(user.id)}
                onSelectUser={handleSelectUser}
                onClick={onUserClick}
                getStatusColor={getStatusColor}
                getPortalColor={getPortalColor}
              />
            ))}
          </TableBody>
        </Table>
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
