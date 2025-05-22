
import React from 'react';
import { User } from '@/types/user';
import { SearchBar } from '@/components/SearchBar';
import { UserFilter } from '@/components/UserFilter';
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
  selectedManager,
  excludedRoles,
  includedRoles,
  onFilterChange,
  onRoleExclusionChange,
  onRoleInclusionChange,
  onSelectAllRoles
}: UserSearchProps) => {
  return (
    <div className="mb-8 bg-teleport-gray rounded-lg p-6 shadow-lg border border-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">User Search</h1>
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
      
      <div className="space-y-4">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        {!isLoading && !error && allUsers && (
          <UserFilter 
            users={allUsers} 
            onFilterChange={onFilterChange}
            selectedPortal={selectedPortal}
            selectedManager={selectedManager}
            excludedRoles={excludedRoles}
            includedRoles={includedRoles}
            onRoleExclusionChange={onRoleExclusionChange}
            onRoleInclusionChange={onRoleInclusionChange}
            onSelectAllRoles={onSelectAllRoles}
          />
        )}
      </div>
    </div>
  );
};
