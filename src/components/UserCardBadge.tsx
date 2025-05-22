
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface UserCardBadgeProps {
  type: 'status' | 'portal';
  value: string | null;
}

export const UserCardBadge = ({ type, value }: UserCardBadgeProps) => {
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
  
  if (!value) {
    return <Badge variant="outline" className="text-xs bg-gray-500/20 text-gray-400 border-gray-500/30">None</Badge>;
  }
  
  if (type === 'status') {
    return <Badge className={`${getStatusColor(value)}`}>{value}</Badge>;
  } else {
    return (
      <Badge variant="outline" className={`text-xs ${getPortalColor(value)}`}>
        {value}
      </Badge>
    );
  }
};
