
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-1 h-3.5 w-3.5 text-primary" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5 text-primary" />;
  };

  const HeaderCell = ({ 
    field, 
    children, 
    className 
  }: { 
    field?: SortField; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <th 
      className={cn(
        "text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 bg-muted/30 first:rounded-tl-lg last:rounded-tr-lg",
        field && "cursor-pointer hover:text-foreground transition-colors select-none",
        className
      )}
      onClick={field ? () => onSort(field) : undefined}
    >
      <div className="flex items-center">
        {children}
        {field && getSortIcon(field)}
      </div>
    </th>
  );

  return (
    <thead className="sticky top-0 z-10">
      <tr>
        <th className="w-12 py-3 px-4 bg-muted/30 rounded-tl-lg">
          <Checkbox 
            checked={allSelected && userCount > 0}
            onCheckedChange={(checked) => onSelectAll(Boolean(checked))}
          />
        </th>
        <HeaderCell field="name">Name</HeaderCell>
        <HeaderCell>Roles</HeaderCell>
        <HeaderCell field="status" className="w-24">Status</HeaderCell>
        <HeaderCell field="portal" className="w-28">Portal</HeaderCell>
        <HeaderCell field="manager">Manager</HeaderCell>
        <HeaderCell field="createdDate" className="w-32">Created</HeaderCell>
      </tr>
    </thead>
  );
};