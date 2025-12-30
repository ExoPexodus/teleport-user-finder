
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
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, Users, Calendar, Shield, Trash2, 
  UserMinus, CheckCircle2, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [showUserList, setShowUserList] = useState(false);

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === orphanedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(orphanedUsers.map(user => user.id));
    }
  };

  const handleAction = async (action: 'keep_all' | 'delete_all' | 'selective') => {
    setIsLoading(true);
    try {
      if (action === 'selective' && selectedUserIds.length === 0) {
        toast({
          title: "No Users Selected",
          description: "Please select users to keep, or choose another action.",
          variant: "destructive"
        });
        setIsLoading(false);
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

  const toDelete = orphanedUsers.length - selectedUserIds.length;
  const toKeep = selectedUserIds.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-card border-border">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-status-warning/10">
              <AlertTriangle className="h-5 w-5 text-status-warning" />
            </div>
            <div>
              <DialogTitle className="text-lg">Orphaned Users Detected</DialogTitle>
              <DialogDescription className="mt-1">
                {orphanedUsers.length} user{orphanedUsers.length !== 1 ? 's' : ''} found in database but not in <strong>{portal}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Risk Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-status-error/5 border border-status-error/20">
              <div className="flex items-center gap-2 text-status-error">
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-medium">Will be deleted</span>
              </div>
              <p className="text-2xl font-semibold text-status-error mt-1">{toDelete}</p>
            </div>
            <div className="p-3 rounded-lg bg-status-success/5 border border-status-success/20">
              <div className="flex items-center gap-2 text-status-success">
                <UserMinus className="h-4 w-4" />
                <span className="text-sm font-medium">Will be kept (inactive)</span>
              </div>
              <p className="text-2xl font-semibold text-status-success mt-1">{toKeep}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('keep_all')}
              disabled={isLoading}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2 text-status-success" />
              Keep All Inactive
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('delete_all')}
              disabled={isLoading}
              className="flex-1 text-status-error border-status-error/20 hover:bg-status-error/10"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          </div>

          <Separator />

          {/* Expandable User List */}
          <Collapsible open={showUserList} onOpenChange={setShowUserList}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-3">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Review individual users</span>
                </span>
                {showUserList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              {/* Select Controls */}
              <div className="flex items-center justify-between">
                <button 
                  onClick={handleSelectAll}
                  className="text-sm text-primary hover:underline"
                >
                  {selectedUserIds.length === orphanedUsers.length ? 'Deselect all' : 'Select all to keep'}
                </button>
                <span className="text-xs text-muted-foreground">
                  {selectedUserIds.length} of {orphanedUsers.length} selected
                </span>
              </div>

              {/* User List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {orphanedUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                        isSelected 
                          ? "bg-status-success/5 border-status-success/30" 
                          : "bg-status-error/5 border-status-error/20 hover:border-status-error/40"
                      )}
                      onClick={() => handleSelectUser(user.id, !isSelected)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{user.name}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {user.roles.length} roles
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last: {formatDate(user.lastLogin)}
                          </span>
                          {user.manager && (
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {user.manager}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isSelected ? (
                          <Badge className="bg-status-success/10 text-status-success border-status-success/20 text-xs">
                            Keep
                          </Badge>
                        ) : (
                          <Badge className="bg-status-error/10 text-status-error border-status-error/20 text-xs">
                            Delete
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => handleAction('selective')}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Apply Selection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
