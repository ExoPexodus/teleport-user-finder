
import React, { useState } from 'react';
import { User } from '@/types/user';
import { UserCard } from '@/components/UserCard';
import { UserEditDialog } from '@/components/UserEditDialog';
import { Card } from '@/components/ui/card';

interface UserListProps {
  users: User[];
  onUserUpdate: (updatedUser: User) => void;
}

export const UserList = ({ users, onUserUpdate }: UserListProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <UserCard 
            key={user.id} 
            user={user} 
            onClick={() => handleUserClick(user)}
          />
        ))}
      </div>

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
