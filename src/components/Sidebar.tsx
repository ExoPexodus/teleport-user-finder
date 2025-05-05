import React, { useState } from 'react';
import { Database, Download, ArrowLeft, ArrowRight, UserSearch, RefreshCw } from 'lucide-react';
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { fetchUsersFromSSH } from '@/lib/api';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  users: User[];
}

export const Sidebar = ({ isOpen, setIsOpen, users }: SidebarProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  
  const refreshData = () => {
    // Pass the selected portal to invalidate query
    queryClient.invalidateQueries({ 
      queryKey: ['users', selectedPortal || null] 
    });
    
    toast({
      title: "Data refreshed",
      description: `User data has been successfully refreshed${selectedPortal ? ` from ${selectedPortal}` : ''}.`
    });
    setPortalDialogOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const openPortalDialog = () => {
    setSelectedPortal(null);
    setPortalDialogOpen(true);
  };

  const fetchUserDataFromSSH = async () => {
    if (!selectedPortal) {
      toast({
        title: "Portal required",
        description: "Please select a portal to fetch data from.",
        variant: "destructive"
      });
      return;
    }

    setIsFetching(true);
    try {
      const result = await fetchUsersFromSSH(selectedPortal);
      
      // Refetch user data to display the updated information
      queryClient.invalidateQueries({ 
        queryKey: ['users', selectedPortal] 
      });
      
      toast({
        title: "SSH fetch successful",
        description: result.message || `User data has been successfully fetched from ${selectedPortal}.`
      });
      setPortalDialogOpen(false);
    } catch (error) {
      console.error('SSH fetch error:', error);
      toast({
        title: "SSH fetch failed",
        description: error instanceof Error ? error.message : "Failed to fetch users from SSH server.",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const downloadCSV = () => {
    // Create CSV content
    const headers = ["ID", "Name", "Roles", "Status", "Created Date", "Last Login", "Manager", "Portal"];
    const userRows = users.map(user => [
      user.id,
      user.name,
      user.roles.join(", "),
      user.status,
      new Date(user.createdDate).toLocaleDateString(),
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never",
      user.manager || "None",
      user.portal || "None"
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
          <div className={`transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}></div>
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
                    onClick={openPortalDialog}
                  >
                    <Database size={20} className="mr-2" />
                    <span className={`transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                      Fetch User Data
                    </span>
                  </Button>
                </TooltipTrigger>
                {!isOpen && <TooltipContent side="right">Fetch User Data</TooltipContent>}
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
                      Download User Data
                    </span>
                  </Button>
                </TooltipTrigger>
                {!isOpen && <TooltipContent side="right">Download User Data</TooltipContent>}
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

      {/* Portal Selection Dialog */}
      <Dialog open={portalDialogOpen} onOpenChange={setPortalDialogOpen}>
        <DialogContent className="bg-teleport-gray border-teleport-blue">
          <DialogHeader>
            <DialogTitle className="text-white">Select Portal</DialogTitle>
            <DialogDescription className="text-gray-300">
              Choose which portal to fetch user data from
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select onValueChange={setSelectedPortal} value={selectedPortal || ""}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a portal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kocharsoft">Kocharsoft</SelectItem>
                <SelectItem value="igzy">Igzy</SelectItem>
                <SelectItem value="maxicus">Maxicus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPortalDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={fetchUserDataFromSSH}
              className="bg-teleport-blue hover:bg-teleport-blue/80 flex items-center gap-2"
              disabled={isFetching || !selectedPortal}
            >
              {isFetching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  <span>Fetch SSH Users</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
