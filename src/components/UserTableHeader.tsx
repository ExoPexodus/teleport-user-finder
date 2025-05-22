
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableCell } from '@/components/ui/table';

interface UserTableHeaderProps {
  onSelectAll: (checked: boolean) => void;
  allSelected: boolean;
  userCount: number;
}

export const UserTableHeader = ({ onSelectAll, allSelected, userCount }: UserTableHeaderProps) => {
  return (
    <TableHeader className="bg-teleport-darkgray">
      <TableRow className="hover:bg-slate-800/50 border-slate-700">
        <TableCell className="w-12">
          <Checkbox 
            checked={allSelected && userCount > 0}
            onCheckedChange={onSelectAll}
            className="border-slate-600"
          />
        </TableCell>
        <TableHead className="text-white">Name</TableHead>
        <TableHead className="text-white">Roles</TableHead>
        <TableHead className="text-white">Status</TableHead>
        <TableHead className="text-white">Portal</TableHead>
        <TableHead className="text-white">Manager</TableHead>
        <TableHead className="text-white">Created Date</TableHead>
      </TableRow>
    </TableHeader>
  );
};
