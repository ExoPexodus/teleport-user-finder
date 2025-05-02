
import React from 'react';
import { Database } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-teleport-gray border-b border-slate-800 text-white py-4 px-6 shadow-md">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-teleport-blue p-2 rounded-md">
            <Database className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-white">Teleport User Finder</h2>
        </div>
        <div className="text-sm text-teleport-lightblue">
          Secure SSH Access Management
        </div>
      </div>
    </header>
  );
};
