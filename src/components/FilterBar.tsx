
import React, { useState, useMemo } from 'react';
import { User } from '@/types/user';
import { Search, X, Filter, ChevronDown, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  users: User[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedPortal: string | null;
  setSelectedPortal: (portal: string | null) => void;
  selectedManager: string | null;
  setSelectedManager: (manager: string | null) => void;
  excludedRoles: string[];
  includedRoles: string[];
  onRoleInclusionChange: (role: string, included: boolean) => void;
  onSelectAllRoles: (type: 'include' | 'exclude', selected: boolean) => void;
  totalCount: number;
  filteredCount: number;
}

export const FilterBar = ({
  users,
  searchTerm,
  setSearchTerm,
  selectedPortal,
  setSelectedPortal,
  selectedManager,
  setSelectedManager,
  excludedRoles,
  includedRoles,
  onRoleInclusionChange,
  onSelectAllRoles,
  totalCount,
  filteredCount,
}: FilterBarProps) => {
  const [portalOpen, setPortalOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);

  // Extract unique values
  const portals = useMemo(() => 
    [...new Set(users.map(u => u.portal).filter(Boolean))] as string[],
    [users]
  );

  const managers = useMemo(() => 
    [...new Set(users.map(u => u.manager).filter(Boolean))] as string[],
    [users]
  );

  const allRoles = useMemo(() => 
    [...new Set(users.flatMap(u => u.roles))].sort(),
    [users]
  );

  const activeFilters = [
    selectedPortal && { type: 'portal', value: selectedPortal, label: `Portal: ${selectedPortal}` },
    selectedManager && { type: 'manager', value: selectedManager, label: `Manager: ${selectedManager}` },
    (allRoles.length - includedRoles.length > 0) && { 
      type: 'roles', 
      value: 'roles', 
      label: `${includedRoles.length} of ${allRoles.length} roles` 
    },
  ].filter(Boolean) as { type: string; value: string; label: string }[];

  const clearFilter = (type: string) => {
    switch (type) {
      case 'portal':
        setSelectedPortal(null);
        break;
      case 'manager':
        setSelectedManager(null);
        break;
      case 'roles':
        onSelectAllRoles('include', true);
        break;
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedPortal(null);
    setSelectedManager(null);
    onSelectAllRoles('include', true);
  };

  const hasActiveFilters = searchTerm || activeFilters.length > 0;

  return (
    <div className="space-y-3">
      {/* Search and filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, role, or manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex gap-2">
          {/* Portal filter */}
          <Popover open={portalOpen} onOpenChange={setPortalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(
                "min-w-[120px] justify-between",
                selectedPortal && "border-primary/50 bg-primary/5"
              )}>
                <span className="truncate">{selectedPortal || 'Portal'}</span>
                <ChevronDown size={16} className="ml-2 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search portals..." />
                <CommandList>
                  <CommandEmpty>No portal found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => { setSelectedPortal(null); setPortalOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", !selectedPortal ? "opacity-100" : "opacity-0")} />
                      All Portals
                    </CommandItem>
                    {portals.map((portal) => (
                      <CommandItem
                        key={portal}
                        onSelect={() => { setSelectedPortal(portal); setPortalOpen(false); }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedPortal === portal ? "opacity-100" : "opacity-0")} />
                        {portal}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Manager filter */}
          <Popover open={managerOpen} onOpenChange={setManagerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(
                "min-w-[120px] justify-between",
                selectedManager && "border-primary/50 bg-primary/5"
              )}>
                <span className="truncate">{selectedManager ? selectedManager.split('@')[0] : 'Manager'}</span>
                <ChevronDown size={16} className="ml-2 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search managers..." />
                <CommandList>
                  <CommandEmpty>No manager found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => { setSelectedManager(null); setManagerOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", !selectedManager ? "opacity-100" : "opacity-0")} />
                      All Managers
                    </CommandItem>
                    {managers.map((manager) => (
                      <CommandItem
                        key={manager}
                        onSelect={() => { setSelectedManager(manager); setManagerOpen(false); }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedManager === manager ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">{manager}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Roles filter */}
          <Popover open={rolesOpen} onOpenChange={setRolesOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(
                "min-w-[100px] justify-between",
                includedRoles.length !== allRoles.length && "border-primary/50 bg-primary/5"
              )}>
                <span>Roles</span>
                {includedRoles.length !== allRoles.length && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {includedRoles.length}
                  </Badge>
                )}
                <ChevronDown size={16} className="ml-1 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <div className="p-2 border-b border-border flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 h-8"
                  onClick={() => onSelectAllRoles('include', true)}
                >
                  Select All
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 h-8"
                  onClick={() => onSelectAllRoles('include', false)}
                >
                  Clear All
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {allRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => onRoleInclusionChange(role, !includedRoles.includes(role))}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                      includedRoles.includes(role) 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Check className={cn(
                      "h-4 w-4",
                      includedRoles.includes(role) ? "opacity-100" : "opacity-0"
                    )} />
                    {role}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active filters chips + count */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.map((filter) => (
            <Badge 
              key={filter.type}
              variant="secondary" 
              className="filter-chip-active gap-1.5 pr-1"
            >
              {filter.label}
              <button
                onClick={() => clearFilter(filter.type)}
                className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="text-sm text-muted-foreground shrink-0">
          {filteredCount === totalCount ? (
            <span>{totalCount} users</span>
          ) : (
            <span>{filteredCount} of {totalCount} users</span>
          )}
        </div>
      </div>
    </div>
  );
};