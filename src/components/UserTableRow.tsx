
import React from 'react';
import { User } from '@/types/user';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface UserTableRowProps {
  user: User;
  isSelected: boolean;
  onSelectUser: (userId: string, isChecked: boolean) => void;
  onClick: (user: User) => void;
  getStatusColor: (status: string) => string;
  getPortalColor: (portal: string | null) => string;
}

export const UserTableRow = ({
  user,
  isSelected,
  onSelectUser,
  onClick,
  getStatusColor,
  getPortalColor,
}: UserTableRowProps) => {
  return (
    <TableRow 
      key={user.id} 
      className="hover:bg-teleport-darkgray/50 border-slate-700 cursor-pointer text-white"
      onClick={() => onClick(user)}
    >
      <TableCell 
        onClick={(e) => e.stopPropagation()}
        className="w-12"
      >
        <Checkbox 
          checked={isSelected}
          onCheckedChange={(checked) => onSelectUser(user.id, Boolean(checked))}
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
    </TableRow>
  );
};
