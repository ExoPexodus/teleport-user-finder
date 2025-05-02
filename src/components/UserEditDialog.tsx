
import React, { useState } from 'react';
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
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface UserEditDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdate: (updatedUser: User) => void;
}

export const UserEditDialog = ({ user, open, onOpenChange, onUserUpdate }: UserEditDialogProps) => {
  const [editedUser, setEditedUser] = useState<User>({ ...user });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUserUpdate(editedUser);
    toast({
      title: "User updated",
      description: `${editedUser.name}'s information has been updated.`
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-teleport-darkgray text-white border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            Edit User: {user.name}
            <Badge className="ml-2" variant="outline">{user.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              name="name"
              value={editedUser.name}
              onChange={handleInputChange}
              className="col-span-3 bg-teleport-gray border-slate-700"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="manager" className="text-right">Manager</Label>
            <Input
              id="manager"
              name="manager"
              value={editedUser.manager || ''}
              onChange={handleInputChange}
              className="col-span-3 bg-teleport-gray border-slate-700"
              placeholder="Enter manager name"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="portal" className="text-right">Portal</Label>
            <div className="col-span-3 flex gap-2">
              {(['kocharsoft', 'igzy', 'maxicus'] as const).map((portal) => (
                <Badge 
                  key={portal}
                  className={`cursor-pointer ${editedUser.portal === portal ? 
                    (portal === 'kocharsoft' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                    portal === 'igzy' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 
                    'bg-orange-500/20 text-orange-400 border-orange-500/30') : 
                    'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                  onClick={() => setEditedUser(prev => ({ ...prev, portal }))}
                  variant="outline"
                >
                  {portal}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Roles</Label>
            <div className="col-span-3 flex flex-wrap gap-2">
              {editedUser.roles.map((role, index) => (
                <div key={index} className="flex items-center bg-indigo-900/50 text-indigo-300 border border-indigo-700 rounded-md px-2 py-1">
                  <span className="text-sm">{role}</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditedUser(prev => ({
                        ...prev,
                        roles: prev.roles.filter((_, i) => i !== index)
                      }))
                    }}
                    className="ml-2 text-indigo-300 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Input
                placeholder="Add role and press Enter"
                className="bg-teleport-gray border-slate-700 max-w-40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                    e.preventDefault();
                    const newRole = (e.target as HTMLInputElement).value;
                    setEditedUser(prev => ({
                      ...prev,
                      roles: [...prev.roles, newRole]
                    }));
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Status</Label>
            <div className="col-span-3 flex gap-2">
              {(['active', 'inactive', 'pending'] as const).map((status) => (
                <Badge 
                  key={status}
                  className={`cursor-pointer ${editedUser.status === status ? 
                    (status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                    status === 'inactive' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30') : 
                    'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                  onClick={() => setEditedUser(prev => ({ ...prev, status }))}
                  variant="outline"
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Created</Label>
            <div className="col-span-3">
              {format(new Date(user.createdDate), 'MMM d, yyyy')}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Last Login</Label>
            <div className="col-span-3">
              {user.lastLogin 
                ? format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a')
                : 'Never logged in'}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
