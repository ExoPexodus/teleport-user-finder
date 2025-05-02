
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { List, Grid } from 'lucide-react';

export type ViewMode = 'card' | 'list';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-white text-sm mr-2">View:</span>
      <ToggleGroup type="single" value={viewMode} onValueChange={(value: ViewMode) => value && onViewModeChange(value)}>
        <ToggleGroupItem value="card" aria-label="Card View" className="data-[state=on]:bg-teleport-blue">
          <Grid className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="List View" className="data-[state=on]:bg-teleport-blue">
          <List className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
