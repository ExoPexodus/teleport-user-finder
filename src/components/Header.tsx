
import React from 'react';
import { Database } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-teleport-blue text-white py-4 px-6 shadow-md">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h2 className="text-xl font-bold">Teleport User Finder</h2>
        </div>
        <div className="text-sm text-teleport-lightblue">
          Secure SSH Access Management
        </div>
      </div>
    </header>
  );
};
