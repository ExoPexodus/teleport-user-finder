
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableCell } from '@/components/ui/table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

type SortField = 'name' | 'status' | 'portal' | 'manager' | 'createdDate';
type SortDirection = 'asc' | 'desc';

interface UserTableHeaderProps {
  onSelectAll: (checked: boolean) => void;
  allSelected: boolean;
  userCount: number;
  onSort: (field: SortField) => void;
  sortField: SortField;
  sortDirection: SortDirection;
}

export const UserTableHeader = ({ 
  onSelectAll, 
  allSelected, 
  userCount, 
  onSort, 
  sortField, 
  sortDirection 
}: UserTableHeaderProps) => {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4 text-blue-400" />
      : <ChevronDown className="ml-1 h-4 w-4 text-blue-400" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="text-white cursor-pointer hover:bg-slate-700/50 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center">
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <TableHeader className="bg-teleport-darkgray sticky top-0 z-10">
      <TableRow className="hover:bg-slate-800/50 border-slate-700">
        <TableCell className="w-12 sticky top-0 bg-teleport-darkgray">
          <Checkbox 
            checked={allSelected && userCount > 0}
            onCheckedChange={onSelectAll}
            className="border-slate-600"
          />
        </TableCell>
        <SortableHeader field="name">Name</SortableHeader>
        <TableHead className="text-white">Roles</TableHead>
        <SortableHeader field="status">Status</SortableHeader>
        <SortableHeader field="portal">Portal</SortableHeader>
        <SortableHeader field="manager">Manager</SortableHeader>
        <SortableHeader field="createdDate">Created Date</SortableHeader>
      </TableRow>
    </TableHeader>
  );
};
