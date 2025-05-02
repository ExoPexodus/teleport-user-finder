
import React, { useState } from 'react';
import { User } from '@/types/user';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Trash2, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UpdateManagerDialog } from '@/components/UpdateManagerDialog';

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
  const [selectedUserForManager, setSelectedUserForManager] = useState<User | null>(null);
  const { toast } = useToast();

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
    if (selectedUserIds.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to export.",
        variant: "destructive"
      });
      return;
    }
    const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
    onExportSelected(selectedUsers);
  };

  const handleDeleteClick = () => {
    if (selectedUserIds.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to delete.",
        variant: "destructive"
      });
      return;
    }
    onDeleteSelected(selectedUserIds);
  };

  const handleUpdateManager = (userId: string, manager: string | null) => {
    if (onManagerUpdate) {
      onManagerUpdate(userId, manager);
      toast({
        title: "Manager updated",
        description: `Manager has been successfully updated.`
      });
    }
  };

  const openManagerDialog = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setSelectedUserForManager(user);
    setManagerDialogOpen(true);
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

  return (
    <div className="space-y-4">
      {selectedUserIds.length > 0 && (
        <div className="flex gap-2 items-center bg-teleport-gray p-3 rounded-md border border-teleport-blue">
          <span className="text-white mr-2">
            {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-white border-teleport-blue hover:bg-teleport-blue/20"
            onClick={handleExportClick}
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={handleDeleteClick}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      )}
      
      <div className="rounded-md border border-slate-800 overflow-hidden">
        <Table className="bg-teleport-gray">
          <TableHeader className="bg-teleport-darkgray">
            <TableRow className="hover:bg-slate-800/50 border-slate-700">
              <TableCell className="w-12">
                <Checkbox 
                  checked={selectedUserIds.length === users.length && users.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="border-slate-600"
                />
              </TableCell>
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Roles</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Portal</TableHead>
              <TableHead className="text-white">Manager</TableHead>
              <TableHead className="text-white">Created Date</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow 
                key={user.id} 
                className="hover:bg-teleport-darkgray/50 border-slate-700 cursor-pointer text-white"
                onClick={() => onUserClick(user)}
              >
                <TableCell 
                  onClick={(e) => e.stopPropagation()}
                  className="w-12"
                >
                  <Checkbox 
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectUser(user.id, Boolean(checked))}
                    className="border-slate-600"
                  />
                </TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map(role => (
                      <Badge key={role} variant="outline" className="text-xs bg-indigo-900/50 text-indigo-300 border-indigo-700">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(user.status)}`}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.portal ? (
                    <Badge variant="outline" className={`text-xs ${getPortalColor(user.portal)}`}>
                      {user.portal}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </TableCell>
                <TableCell>{user.manager || <span className="text-gray-400">None</span>}</TableCell>
                <TableCell>{format(new Date(user.createdDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => openManagerDialog(e, user)}
                  >
                    <UserCog className="h-4 w-4" />
                    <span className="sr-only">Update Manager</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <UpdateManagerDialog 
        open={managerDialogOpen}
        onOpenChange={setManagerDialogOpen}
        user={selectedUserForManager}
        managers={allManagers}
        onUpdate={handleUpdateManager}
      />
    </div>
  );
};
