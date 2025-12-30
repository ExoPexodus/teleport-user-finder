
import React from 'react';
import { User } from '@/types/user';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserTableRowProps {
  user: User;
  isSelected: boolean;
  onSelectUser: (userId: string, isChecked: boolean) => void;
  onClick: (user: User) => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'active':
      return { label: 'Active', className: 'bg-success/15 text-success border-success/30' };
    case 'inactive':
      return { label: 'Inactive', className: 'bg-destructive/15 text-destructive border-destructive/30' };
    case 'pending':
      return { label: 'Pending', className: 'bg-warning/15 text-warning border-warning/30' };
    default:
      return { label: status, className: 'bg-muted text-muted-foreground' };
  }
};

const getPortalConfig = (portal: string | null) => {
  switch (portal) {
    case 'kocharsoft':
      return { className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
    case 'igzy':
      return { className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
    case 'maxicus':
      return { className: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
    default:
      return { className: 'bg-muted text-muted-foreground' };
  }
};

export const UserTableRow = ({
  user,
  isSelected,
  onSelectUser,
  onClick,
}: UserTableRowProps) => {
  const statusConfig = getStatusConfig(user.status);
  const portalConfig = getPortalConfig(user.portal);

  return (
    <tr 
      className={cn(
        "border-b border-border/50 transition-colors cursor-pointer",
        isSelected ? "bg-primary/5" : "hover:bg-muted/30"
      )}
      onClick={() => onClick(user)}
    >
      <td 
        className="py-3 px-4 w-12"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox 
          checked={isSelected}
          onCheckedChange={(checked) => onSelectUser(user.id, Boolean(checked))}
        />
      </td>
      <td className="py-3 px-4">
        <span className="font-medium text-foreground">{user.name}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1">
          {user.roles.slice(0, 3).map(role => (
            <Badge 
              key={role} 
              variant="outline" 
              className="text-xs bg-primary/10 text-primary border-primary/20 font-normal"
            >
              {role}
            </Badge>
          ))}
          {user.roles.length > 3 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{user.roles.length - 3}
            </Badge>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className={cn(
            "status-dot",
            user.status === 'active' && "status-dot-active",
            user.status === 'inactive' && "status-dot-inactive",
            user.status === 'pending' && "status-dot-pending"
          )} />
          <span className="text-sm text-muted-foreground capitalize">{user.status}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        {user.portal ? (
          <Badge variant="outline" className={cn("text-xs", portalConfig.className)}>
            {user.portal}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-muted-foreground">
          {user.manager || '—'}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-muted-foreground">
          {format(new Date(user.createdDate), 'MMM d, yyyy')}
        </span>
      </td>
    </tr>
  );
};