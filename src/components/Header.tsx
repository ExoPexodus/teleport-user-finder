
import React from 'react';
import { Shield } from 'lucide-react';

export const Header = () => {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm">Teleport User Management</span>
          <span className="text-border">/</span>
          <span className="text-sm text-foreground font-medium">Dashboard</span>
        </div>
      </div>
    </header>
  );
};