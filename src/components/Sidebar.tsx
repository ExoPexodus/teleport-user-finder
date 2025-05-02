
import React from 'react';
import { Database, Download, ArrowLeft, ArrowRight, UserSearch, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '@/types/user';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
  TooltipProvider 
} from '@/components/ui/tooltip';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  users: User[];
}

export const Sidebar = ({ isOpen, setIsOpen, users }: SidebarProps) => {
  const queryClient = useQueryClient();
  
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const pendingUsers = users.filter(user => user.status === 'pending').length;
  
  return (
    <div className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-width duration-300 ease-in-out overflow-hidden z-10 ${isOpen ? 'w-64' : 'w-16'}`}>
      <div className="p-4 flex justify-between items-center border-b border-gray-800">
        <h2 className={`text-xl font-bold transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Teleport</h2>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:bg-gray-700"
        >
          {isOpen ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
        </Button>
      </div>
      
      <div className="p-4">
        <TooltipProvider>
          <ul className="space-y-4">
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size={isOpen ? "default" : "icon"} 
                    className={`w-full justify-start text-white hover:bg-gray-700 ${!isOpen && 'p-2'}`}
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
                    className={`w-full justify-start text-white hover:bg-gray-700 ${!isOpen && 'p-2'}`}
                  >
                    <Database size={20} className="mr-2" />
                    <span className={`transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                      Databases
                    </span>
                  </Button>
                </TooltipTrigger>
                {!isOpen && <TooltipContent side="right">Databases</TooltipContent>}
              </Tooltip>
            </li>
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size={isOpen ? "default" : "icon"} 
                    className={`w-full justify-start text-white hover:bg-gray-700 ${!isOpen && 'p-2'}`}
                    onClick={refreshData}
                  >
                    <Download size={20} className="mr-2" />
                    <span className={`transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                      Refresh Data
                    </span>
                  </Button>
                </TooltipTrigger>
                {!isOpen && <TooltipContent side="right">Refresh Data</TooltipContent>}
              </Tooltip>
            </li>
          </ul>
        </TooltipProvider>
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
  );
};
