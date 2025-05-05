
import React, { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '@/types/user';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';

type FilterOption = {
  value: string;
  label: string;
}

interface UserFilterProps {
  users: User[];
  onFilterChange: (field: 'portal' | 'manager', value: string) => void;
  selectedPortal: string | null;
  selectedManager: string | null;
  excludedRoles: string[];
  includedRoles: string[];
  onRoleExclusionChange: (role: string, excluded: boolean) => void;
  onRoleInclusionChange: (role: string, included: boolean) => void;
}

export const UserFilter = ({ 
  users, 
  onFilterChange,
  selectedPortal,
  selectedManager,
  excludedRoles,
  includedRoles,
  onRoleExclusionChange,
  onRoleInclusionChange
}: UserFilterProps) => {
  const [excludeRolesOpen, setExcludeRolesOpen] = useState(false);
  const [includeRolesOpen, setIncludeRolesOpen] = useState(false);
  
  // Extract unique portals from all users
  const portalOptions: FilterOption[] = [
    { value: 'all', label: 'All Portals' },
    ...Array.from(new Set(users.map(user => user.portal).filter(Boolean)))
      .map(portal => ({ value: portal as string, label: portal as string }))
  ];
  
  // Extract unique managers from users
  const managerOptions: FilterOption[] = [
    { value: 'all', label: 'All Managers' },
    ...Array.from(new Set(users.map(user => user.manager).filter(Boolean)))
      .map(manager => ({ value: manager as string, label: manager as string }))
  ];

  // Extract unique roles from all users
  const allRoles = Array.from(
    new Set(users.flatMap(user => user.roles))
  ).sort();

  return (
    <div className="flex flex-col space-y-4 p-4 bg-teleport-gray rounded-lg shadow">
      <div className="flex flex-col md:flex-row md:space-x-4 md:space-y-0 space-y-4">
        <div className="flex-1 space-y-2">
          <Label className="text-white">Filter by Portal</Label>
          <Select 
            value={selectedPortal || 'all'} 
            onValueChange={(value) => onFilterChange('portal', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="bg-teleport-darkgray text-white border-slate-700">
              <SelectValue placeholder="Select Portal" />
            </SelectTrigger>
            <SelectContent>
              {portalOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 space-y-2">
          <Label className="text-white">Filter by Manager</Label>
          <Select 
            value={selectedManager || 'all'} 
            onValueChange={(value) => onFilterChange('manager', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="bg-teleport-darkgray text-white border-slate-700">
              <SelectValue placeholder="Select Manager" />
            </SelectTrigger>
            <SelectContent>
              {managerOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Collapsible open={includeRolesOpen} onOpenChange={setIncludeRolesOpen}>
        <div className="flex items-center justify-between">
          <Label className="text-white">Include Roles</Label>
          <CollapsibleTrigger className="p-1 rounded hover:bg-teleport-darkgray text-white">
            {includeRolesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2 max-h-64 overflow-y-auto border border-slate-700 rounded">
            {allRoles.map(role => (
              <div key={`include-${role}`} className="flex items-center space-x-2">
                <Checkbox 
                  id={`include-role-${role}`} 
                  checked={includedRoles.includes(role)}
                  onCheckedChange={(checked) => onRoleInclusionChange(role, Boolean(checked))}
                  className="border-slate-500"
                />
                <Label htmlFor={`include-role-${role}`} className="text-sm text-white cursor-pointer">
                  {role}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <Collapsible open={excludeRolesOpen} onOpenChange={setExcludeRolesOpen}>
        <div className="flex items-center justify-between">
          <Label className="text-white">Exclude Roles</Label>
          <CollapsibleTrigger className="p-1 rounded hover:bg-teleport-darkgray text-white">
            {excludeRolesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2 max-h-64 overflow-y-auto border border-slate-700 rounded">
            {allRoles.map(role => (
              <div key={`exclude-${role}`} className="flex items-center space-x-2">
                <Checkbox 
                  id={`role-${role}`} 
                  checked={excludedRoles.includes(role)}
                  onCheckedChange={(checked) => onRoleExclusionChange(role, Boolean(checked))}
                  className="border-slate-500"
                />
                <Label htmlFor={`role-${role}`} className="text-sm text-white cursor-pointer">
                  {role}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
