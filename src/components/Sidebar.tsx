
import React from 'react';
import { Database, Download, ArrowLeft, ArrowRight, UserSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '@/types/user';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  users: User[];
}

export const Sidebar = ({ isOpen, setIsOpen, users }: SidebarProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const handleFetchUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast({
      title: "Refreshing Data",
      description: "User data is being refreshed from the server.",
    });
  };
  
  const handleExportCSV = () => {
    if (!users.length) {
      toast({
        title: "Export Failed",
        description: "No users available to export.",
        variant: "destructive",
      });
      return;
    }
    
    const headers = ['ID', 'Name', 'Roles', 'Created Date', 'Last Login', 'Status', 'Manager'];
    const csvData = users.map((user) => [
      user.id,
      user.name,
      user.roles.join('; '),
      new Date(user.createdDate).toLocaleDateString(),
      user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
      user.status,
      user.manager || 'None'
    ]);
    
    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `teleport_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: `Exported ${users.length} users to CSV file.`,
    });
  };

  return (
    <div 
      className={`fixed top-0 left-0 h-full bg-teleport-gray border-r border-slate-800 
        transition-all duration-300 z-10 shadow-xl flex flex-col
        ${isOpen ? 'w-64' : 'w-16'}`}
    >
      <div className="flex justify-end p-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
        </Button>
      </div>
      
      <div className="flex-grow flex flex-col p-3 gap-2 overflow-y-auto">
        <Button 
          variant="ghost" 
          className={`flex items-center justify-${isOpen ? 'start' : 'center'} w-full px-3 py-2`}
          onClick={() => navigate('/')}
        >
          <UserSearch className="h-5 w-5 mr-2" />
          {isOpen && <span>User Search</span>}
        </Button>
        
        <Button 
          variant="ghost" 
          className={`flex items-center justify-${isOpen ? 'start' : 'center'} w-full px-3 py-2`}
          onClick={handleFetchUsers}
        >
          <Database className="h-5 w-5 mr-2" />
          {isOpen && <span>Fetch Users</span>}
        </Button>
        
        <Button 
          variant="ghost" 
          className={`flex items-center justify-${isOpen ? 'start' : 'center'} w-full px-3 py-2`}
          onClick={handleExportCSV}
        >
          <Download className="h-5 w-5 mr-2" />
          {isOpen && <span>Export CSV</span>}
        </Button>
      </div>
    </div>
  );
};
