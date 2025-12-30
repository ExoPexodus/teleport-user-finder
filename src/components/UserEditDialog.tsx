
import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { X, User as UserIcon, Building2, Shield, Calendar, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserEditDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdate: (updatedUser: User) => void;
}

export const UserEditDialog = ({ user, open, onOpenChange, onUserUpdate }: UserEditDialogProps) => {
  const [editedUser, setEditedUser] = useState<User>({ ...user });
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    if (open) {
      setEditedUser({ ...user });
      setNewRole('');
    }
  }, [user, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUserUpdate({ ...editedUser });
    onOpenChange(false);
  };

  const handleAddRole = () => {
    if (newRole && !editedUser.roles.includes(newRole)) {
      setEditedUser(prev => ({
        ...prev,
        roles: [...prev.roles, newRole]
      }));
      setNewRole('');
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    setEditedUser(prev => ({
      ...prev,
      roles: prev.roles.filter(role => role !== roleToRemove)
    }));
  };

  const getPortalColor = (portal: string | null) => {
    switch (portal) {
      case 'kocharsoft': return 'bg-portal-kocharsoft/10 text-portal-kocharsoft border-portal-kocharsoft/30';
      case 'igzy': return 'bg-portal-igzy/10 text-portal-igzy border-portal-igzy/30';
      case 'maxicus': return 'bg-portal-maxicus/10 text-portal-maxicus border-portal-maxicus/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-status-success/10 text-status-success border-status-success/30';
      case 'inactive': return 'bg-status-error/10 text-status-error border-status-error/30';
      case 'pending': return 'bg-status-warning/10 text-status-warning border-status-warning/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const hasChanges = JSON.stringify(user) !== JSON.stringify(editedUser);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="h-5 w-5 text-primary" />
            Edit User
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Name / Email</Label>
              <Input
                id="name"
                name="name"
                value={editedUser.name}
                onChange={handleInputChange}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager" className="text-sm font-medium">Manager</Label>
              <Input
                id="manager"
                name="manager"
                value={editedUser.manager || ''}
                onChange={handleInputChange}
                className="bg-background"
                placeholder="Enter manager name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Portal</Label>
              <div className="flex gap-2">
                {(['kocharsoft', 'igzy', 'maxicus'] as const).map((portal) => (
                  <button
                    key={portal}
                    type="button"
                    onClick={() => setEditedUser(prev => ({ ...prev, portal }))}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium border transition-all",
                      editedUser.portal === portal
                        ? getPortalColor(portal)
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {portal}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="flex gap-2">
                {(['active', 'inactive', 'pending'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setEditedUser(prev => ({ ...prev, status }))}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium border transition-all capitalize",
                      editedUser.status === status
                        ? getStatusColor(status)
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Roles & Metadata */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles ({editedUser.roles.length})
              </Label>
              <div className="p-3 rounded-lg border border-border bg-background min-h-[120px]">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {editedUser.roles.map((role) => (
                    <Badge 
                      key={role} 
                      variant="outline" 
                      className="bg-primary/5 text-primary border-primary/20 pr-1"
                    >
                      {role}
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role)}
                        className="ml-1.5 p-0.5 rounded hover:bg-primary/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add role..."
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                    className="h-8 text-sm"
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline"
                    onClick={handleAddRole}
                    disabled={!newRole}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Metadata */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </span>
                <span className="text-foreground">
                  {editedUser.createdDate ? format(new Date(editedUser.createdDate), 'MMM d, yyyy') : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last Login
                </span>
                <span className="text-foreground">
                  {editedUser.lastLogin 
                    ? format(new Date(editedUser.lastLogin), 'MMM d, yyyy h:mm a')
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Changes Indicator */}
        {hasChanges && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-status-warning/10 border border-status-warning/20">
            <AlertCircle className="h-4 w-4 text-status-warning" />
            <span className="text-sm text-status-warning">You have unsaved changes</span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
