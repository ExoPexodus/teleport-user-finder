
import React from 'react';
import { User } from '@/types/user';
import { FilterBar } from '@/components/FilterBar';
import { ViewModeToggle, ViewMode } from '@/components/ViewModeToggle';

interface UserSearchProps {
  allUsers: User[] | undefined;
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedPortal: string | null;
  setSelectedPortal: React.Dispatch<React.SetStateAction<string | null>>;
  selectedManager: string | null;
  setSelectedManager: React.Dispatch<React.SetStateAction<string | null>>;
  excludedRoles: string[];
  setExcludedRoles: React.Dispatch<React.SetStateAction<string[]>>;
  includedRoles: string[];
  setIncludedRoles: React.Dispatch<React.SetStateAction<string[]>>;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  onFilterChange: (field: 'portal' | 'manager', value: string) => void;
  onRoleExclusionChange: (role: string, excluded: boolean) => void;
  onRoleInclusionChange: (role: string, included: boolean) => void;
  onSelectAllRoles: (type: 'include' | 'exclude', selected: boolean) => void;
  filteredCount?: number;
}

export const UserSearch = ({
  allUsers,
  isLoading,
  error,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  selectedPortal,
  setSelectedPortal,
  selectedManager,
  setSelectedManager,
  excludedRoles,
  includedRoles,
  onFilterChange,
  onRoleExclusionChange,
  onRoleInclusionChange,
  onSelectAllRoles,
  filteredCount = 0
}: UserSearchProps) => {
  if (isLoading || error || !allUsers) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">Users</h1>
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
      
      <FilterBar
        users={allUsers}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedPortal={selectedPortal}
        setSelectedPortal={setSelectedPortal}
        selectedManager={selectedManager}
        setSelectedManager={setSelectedManager}
        excludedRoles={excludedRoles}
        includedRoles={includedRoles}
        onRoleInclusionChange={onRoleInclusionChange}
        onSelectAllRoles={onSelectAllRoles}
        totalCount={allUsers.length}
        filteredCount={filteredCount}
      />
    </div>
  );
};