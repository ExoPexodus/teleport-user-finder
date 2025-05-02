
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchBar = ({ searchTerm, setSearchTerm }: SearchBarProps) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-teleport-lightblue" />
      </div>
      <Input
        type="text"
        placeholder="Search users by name or role..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 py-2 bg-teleport-gray border border-slate-700 rounded-md w-full focus:ring-teleport-blue focus:border-teleport-blue text-white"
      />
    </div>
  );
};
