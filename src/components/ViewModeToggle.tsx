
import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'card' | 'table';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  return (
    <div className="inline-flex items-center bg-secondary rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('table')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
          viewMode === 'table' 
            ? "bg-card text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List size={16} />
        <span>Table</span>
      </button>
      <button
        onClick={() => onViewModeChange('card')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
          viewMode === 'card' 
            ? "bg-card text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid size={16} />
        <span>Cards</span>
      </button>
    </div>
  );
};