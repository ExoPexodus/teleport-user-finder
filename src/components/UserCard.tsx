
import React from 'react';
import { User } from '@/types/user';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { UserCheck, Clock, Shield } from 'lucide-react';

interface UserCardProps {
  user: User;
}

export const UserCard = ({ user }: UserCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="bg-teleport-gray pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-teleport-darkblue">{user.name}</CardTitle>
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
                <Badge key={role} variant="outline" className="text-xs bg-blue-50">
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
        </div>
      </CardContent>
    </Card>
  );
};
