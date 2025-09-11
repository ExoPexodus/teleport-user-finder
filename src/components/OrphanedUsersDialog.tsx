import React, { useState } from 'react';
import { User } from '@/types/user';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Calendar, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrphanedUsersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orphanedUsers: User[];
  portal: string;
  onManageUsers: (action: 'keep_all' | 'delete_all' | 'selective', userIdsToKeep?: string[]) => Promise<void>;
}

export const OrphanedUsersDialog = ({
  isOpen,
  onClose,
  orphanedUsers,
  portal,
  onManageUsers
}: OrphanedUsersDialogProps) => {
  const { toast } = useToast();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(orphanedUsers.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleAction = async (action: 'keep_all' | 'delete_all' | 'selective') => {
    setIsLoading(true);
    try {
      if (action === 'selective' && selectedUserIds.length === 0) {
        toast({
          title: "No Users Selected",
          description: "Please select at least one user to keep, or choose 'Delete All'.",
          variant: "destructive"
        });
        return;
      }

      await onManageUsers(action, action === 'selective' ? selectedUserIds : undefined);
      onClose();
    } catch (error) {
      console.error('Error managing orphaned users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Orphaned Users Detected</DialogTitle>
          </div>
          <DialogDescription>
            The following {orphanedUsers.length} user{orphanedUsers.length !== 1 ? 's' : ''} exist in your database but not in the <strong>{portal}</strong> portal.
            Choose what to do with these users.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                <strong>{orphanedUsers.length}</strong> orphaned users
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="text-sm">
                <strong>{selectedUserIds.length}</strong> selected to keep
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm">
                <strong>{orphanedUsers.length - selectedUserIds.length}</strong> will be deleted
              </span>
            </div>
          </div>

          {/* Select All Controls */}
          <div className="flex items-center gap-2 p-2 border rounded">
            <Checkbox
              id="select-all"
              checked={selectedUserIds.length === orphanedUsers.length}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All Users
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUserIds([])}
              className="ml-auto"
            >
              Deselect All
            </Button>
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {orphanedUsers.map((user) => (
              <div
                key={user.id}
                className={`p-3 border rounded-lg transition-colors ${
                  selectedUserIds.includes(user.id) 
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={user.id}
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{user.name}</h4>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Last Login: {formatDate(user.lastLogin)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>Manager: {user.manager || 'None'}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              onClick={() => handleAction('keep_all')}
              disabled={isLoading}
              className="flex-1"
            >
              Keep All as Inactive
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction('delete_all')}
              disabled={isLoading}
              className="flex-1"
            >
              Delete All
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleAction('selective')}
              disabled={isLoading || selectedUserIds.length === 0}
            >
              {isLoading ? "Processing..." : "Apply Selection"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};