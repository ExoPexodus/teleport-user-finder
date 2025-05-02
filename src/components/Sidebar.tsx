
import React from 'react';
import { Database, Download, ArrowLeft, ArrowRight, UserSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '@/types/user';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
  TooltipProvider 
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  users: User[];
}

export const Sidebar = ({ isOpen, setIsOpen, users }: SidebarProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast({
      title: "Data refreshed",
      description: "User data has been successfully refreshed from the server."
    });
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const downloadCSV = () => {
    // Create CSV content
    const headers = ["ID", "Name", "Roles", "Status", "Created Date", "Last Login", "Manager"];
    const userRows = users.map(user => [
      user.id,
      user.name,
      user.roles.join(", "),
      user.status,
      new Date(user.createdDate).toLocaleDateString(),
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never",
      user.manager || "None"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...userRows.map(row => row.join(","))
    ].join("\n");
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `teleport_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Downloaded",
      description: "User data has been exported to CSV successfully."
    });
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const pendingUsers = users.filter(user => user.status === 'pending').length;
  
  return (
    <TooltipProvider>
      <div className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-width duration-300 ease-in-out overflow-hidden z-10 ${isOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4 flex justify-between items-center border-b border-gray-800">
          <h2 className={`text-xl font-bold transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Teleport</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleToggle}
            className="text-white hover:bg-gray-700 cursor-pointer"
          >
            {isOpen ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
          </Button>
        </div>
        
        <div className="p-4">
          <ul className="space-y-4">
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size={isOpen ? "default" : "icon"} 
                    className={`w-full justify-start text-white hover:bg-gray-700 ${!isOpen && 'p-2'} cursor-pointer`}
                  >
                    <UserSearch size={20} className="mr-2" />
                    <span className={`transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                      Users
                    </span>
                  </Button>
                </TooltipTrigger>
                {!isOpen && <TooltipContent side="right">Users</TooltipContent>}
              </Tooltip>
            </li>
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size={isOpen ? "default" : "icon"} 
                    className={`w-full justify-start text-white hover:bg-gray-700 ${!isOpen && 'p-2'} cursor-pointer`}
                    onClick={refreshData}
                  >
                    <Database size={20} className="mr-2" />
                    <span className={`transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                      Database
                    </span>
                  </Button>
                </TooltipTrigger>
                {!isOpen && <TooltipContent side="right">Database</TooltipContent>}
              </Tooltip>
            </li>
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size={isOpen ? "default" : "icon"} 
                    className={`w-full justify-start text-white hover:bg-gray-700 ${!isOpen && 'p-2'} cursor-pointer`}
                    onClick={downloadCSV}
                  >
                    <Download size={20} className="mr-2" />
                    <span className={`transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                      Export Data
                    </span>
                  </Button>
                </TooltipTrigger>
                {!isOpen && <TooltipContent side="right">Export Data</TooltipContent>}
              </Tooltip>
            </li>
          </ul>
        </div>
        
        {isOpen && (
          <div className="absolute bottom-0 left-0 w-full p-4 bg-gray-800">
            <div className="text-sm text-gray-400">
              <div className="flex justify-between mb-1">
                <span>Total Users:</span>
                <span>{totalUsers}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Active:</span>
                <span>{activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending:</span>
                <span>{pendingUsers}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
