
import React, { useState } from 'react';
import { User } from '@/types/user';
import { UserCard } from '@/components/UserCard';
import { UserEditDialog } from '@/components/UserEditDialog';
import { Card } from '@/components/ui/card';
import { UserListTable } from '@/components/UserListTable';
import { ViewMode } from '@/components/ViewModeToggle';
import { useToast } from '@/hooks/use-toast';

interface UserListProps {
  users: User[];
  onUserUpdate: (updatedUser: User) => void;
  viewMode: ViewMode;
  onDeleteSelected?: (userIds: string[]) => void;
}

export const UserList = ({ 
  users, 
  onUserUpdate,
  viewMode,
  onDeleteSelected
}: UserListProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleUserClick = (user: User) => {
    // Create a deep copy of the user to avoid reference issues
    setSelectedUser(JSON.parse(JSON.stringify(user)));
    setDialogOpen(true);
  };

  const handleExportSelected = (selectedUsers: User[]) => {
    // Create CSV content
    const headers = ["ID", "Name", "Roles", "Status", "Created Date", "Last Login", "Manager", "Portal"];
    const userRows = selectedUsers.map(user => [
      user.id,
      // Wrap fields in quotes to handle special characters
      `"${user.name}"`,
      `"${user.roles.join("; ")}"`, // Use semicolon as separator for roles
      user.status,
      new Date(user.createdDate).toLocaleDateString(),
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never",
      user.manager ? `"${user.manager}"` : "None",
      user.portal ? `"${user.portal}"` : "None"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...userRows.map(row => row.join(","))
    ].join("\n");
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `selected_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Downloaded",
      description: `${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} exported to CSV successfully.`
    });
  };

  const handleDeleteSelected = (userIds: string[]) => {
    if (onDeleteSelected) {
      onDeleteSelected(userIds);
    }
  };

  const handleManagerUpdate = (userId: string, manager: string | null) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      const updatedUser = { ...userToUpdate, manager };
      onUserUpdate(updatedUser);
    }
  };

  if (users.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg text-gray-600">No users found matching your search criteria.</p>
      </Card>
    );
  }

  return (
    <>
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => (
            <UserCard 
              key={user.id} 
              user={user} 
              onClick={() => handleUserClick(user)}
            />
          ))}
        </div>
      ) : (
        <UserListTable 
          users={users} 
          onUserClick={handleUserClick}
          onExportSelected={handleExportSelected}
          onDeleteSelected={handleDeleteSelected}
          onManagerUpdate={handleManagerUpdate}
        />
      )}

      {selectedUser && (
        <UserEditDialog
          user={selectedUser}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onUserUpdate={onUserUpdate}
        />
      )}
    </>
  );
};
