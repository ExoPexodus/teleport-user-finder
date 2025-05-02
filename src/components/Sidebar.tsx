
import React from 'react';
import { Database, Download, ArrowLeft, ArrowRight, UserSearch, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { User } from '@/types/user';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  users: User[];
}

export const Sidebar = ({ isOpen, setIsOpen, users }: SidebarProps) => {
  const queryClient = useQueryClient();

  const refreshData = async () => {
    toast.loading('Fetching users from Teleport...');
    try {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User data refreshed successfully');
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const exportToCSV = () => {
    if (!users || users.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Format user data for CSV
    const headers = ['ID', 'Name', 'Roles', 'Status', 'Created Date', 'Last Login'];
    const csvData = [
      headers.join(','),
      ...users.map(user => [
        user.id,
        user.name,
        `"${user.roles.join(', ')}"`,
        user.status,
        new Date(user.createdDate).toLocaleDateString(),
        user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
      ].join(','))
    ].join('\n');

    // Create a blob and download it
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `teleport-users-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV file downloaded successfully');
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 border-r border-slate-800 shadow-xl transition-all duration-300 ease-in-out ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className={`flex items-center gap-3 ${!isOpen && 'hidden'}`}>
          <div className="bg-indigo-600 p-2 rounded-md">
            <Database className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white truncate">Teleport Tools</h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-slate-300 hover:text-white hover:bg-slate-800"
        >
          {isOpen ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* Navigation Links */}
        <Button
          variant="outline"
          className={`flex items-center gap-3 bg-slate-800 text-white hover:bg-slate-700 border-slate-700 ${
            !isOpen ? 'justify-center px-0' : ''
          }`}
          asChild
        >
          <Link to="/">
            <UserSearch className="h-5 w-5 text-indigo-400" />
            {isOpen && <span>User Search</span>}
          </Link>
        </Button>

        <Button
          variant="outline"
          className={`flex items-center gap-3 bg-slate-800 text-white hover:bg-slate-700 border-slate-700 ${
            !isOpen ? 'justify-center px-0' : ''
          }`}
          onClick={refreshData}
        >
          <Database className="h-5 w-5 text-indigo-400" />
          {isOpen && <span>Fetch Users</span>}
        </Button>

        <Button
          variant="outline"
          className={`flex items-center gap-3 bg-slate-800 text-white hover:bg-slate-700 border-slate-700 ${
            !isOpen ? 'justify-center px-0' : ''
          }`}
          onClick={exportToCSV}
        >
          <Download className="h-5 w-5 text-indigo-400" />
          {isOpen && <span>Export CSV</span>}
        </Button>
      </div>

      <div className="mt-auto p-4 border-t border-slate-800">
        <Button
          variant="outline"
          className={`flex items-center gap-3 bg-slate-800 text-white hover:bg-indigo-600 border-slate-700 w-full ${
            !isOpen ? 'justify-center px-0' : ''
          }`}
          asChild
        >
          <Link to="/dino-game">
            <Gamepad2 className="h-5 w-5 text-indigo-400" />
            {isOpen && <span>Dino Game</span>}
          </Link>
        </Button>
        
        {isOpen && (
          <div className="mt-4 text-xs text-slate-500">
            <p>Teleport User Finder</p>
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );
};
