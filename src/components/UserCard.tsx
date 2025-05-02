
import React from 'react';
import { User } from '@/types/user';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { UserCheck, Clock, Shield, UserCog } from 'lucide-react';

interface UserCardProps {
  user: User;
  onClick: () => void;
}

export const UserCard = ({ user, onClick }: UserCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card 
      className="overflow-hidden transition-all duration-200 cursor-pointer border-2 border-transparent 
        hover:scale-105 hover:shadow-xl hover:border-teleport-blue/50 hover:bg-teleport-gray/30
        active:scale-100 active:shadow-md active:border-teleport-blue/70"
      onClick={onClick}
    >
      <CardHeader className="bg-teleport-gray pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-white">{user.name}</CardTitle>
          <Badge className={`${getStatusColor(user.status)}`}>
            {user.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-teleport-blue" />
            <span className="font-semibold">Roles:</span>
            <div className="flex flex-wrap gap-1">
              {user.roles.map(role => (
                <Badge key={role} variant="outline" className="text-xs bg-indigo-900/50 text-indigo-300 border-indigo-700">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-teleport-blue" />
            <span className="font-semibold">Created:</span>
            <span>{format(new Date(user.createdDate), 'MMM d, yyyy')}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-teleport-blue" />
            <span className="font-semibold">Last Login:</span>
            <span>
              {user.lastLogin 
                ? format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a')
                : 'Never logged in'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <UserCog className="h-4 w-4 text-teleport-blue" />
            <span className="font-semibold">Manager:</span>
            <span>{user.manager || 'None assigned'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
