
import React, { useState } from 'react';
import { User } from '@/types/user';
import { Link } from 'react-router-dom';
import { Clock, Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  currentPage?: string;
  onFetchData?: () => void;
  onExportCsv?: () => void;
}

export const Sidebar = ({ 
  isOpen, 
  setIsOpen, 
  users, 
  currentPage = 'home',
  onFetchData,
  onExportCsv 
}: SidebarProps) => {
  const { toast } = useToast();
  const [fetchDialogOpen, setFetchDialogOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const portalOptions = ['kocharsoft', 'maxicus', 'igzy'];
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleFetchData = () => {
    setFetchDialogOpen(true);
  };

  const handleFetchUsersFromSSH = async () => {
    if (!selectedPortal) {
      toast({
        title: "Portal Required",
        description: "Please select a portal to fetch users from",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchUsersFromSSH(selectedPortal);
      toast({
        title: "Users Fetched",
        description: result.message || "Users fetched successfully"
      });
      // Close dialog and refresh data
      setFetchDialogOpen(false);
      if (onFetchData) {
        onFetchData();
      }
    } catch (error) {
      toast({
        title: "Error Fetching Users",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (onExportCsv) {
      onExportCsv();
    } else {
      // Create CSV content from all users if no callback is provided
      if (users && users.length > 0) {
        const headers = ["ID", "Name", "Roles", "Status", "Created Date", "Last Login", "Manager", "Portal"];
        const userRows = users.map(user => [
          user.id,
          `"${user.name}"`,
          `"${user.roles.join("; ")}"`,
          user.status,
          new Date(user.createdDate).toLocaleDateString(),
          user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never",
          user.manager ? `"${user.manager}"` : "None",
          user.portal ? `"${user.portal}"` : "None"
        ]);
        
        const csvContent = [
          headers.join(","),
          ...userRows.map(row => row.join(","))
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `all_users_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "CSV Downloaded",
          description: `${users.length} users exported to CSV successfully.`
        });
      } else {
        toast({
          title: "No Data Available",
          description: "There are no users to export.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <>
      <aside 
        className={`fixed top-0 left-0 h-full z-20 bg-teleport-gray transition-all duration-300 ease-in-out border-r border-slate-800 shadow-xl 
                  ${isOpen ? 'w-64' : 'w-16'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          {isOpen && <span className="text-white font-bold">Teleport Admin</span>}
          <button 
            onClick={toggleSidebar} 
            className="text-white hover:text-gray-300 rounded-full p-2 hover:bg-slate-700"
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex flex-col p-4">
          <Link 
            to="/" 
            className={`flex items-center space-x-2 p-2 rounded mb-2 hover:bg-slate-700 transition-colors
                        ${currentPage === 'home' ? 'bg-slate-700' : ''}`}
          >
            <Users size={20} className="text-white" />
            {isOpen && <span className="text-white">User Management</span>}
          </Link>
          
          <Link 
            to="/scheduler" 
            className={`flex items-center space-x-2 p-2 rounded mb-2 hover:bg-slate-700 transition-colors
                        ${currentPage === 'scheduler' ? 'bg-slate-700' : ''}`}
          >
            <Clock size={20} className="text-white" />
            {isOpen && <span className="text-white">Role Scheduler</span>}
          </Link>

          <div className="mt-4 border-t border-slate-700 pt-4 space-y-2">
            <Button 
              variant="outline" 
              size="sm"
              className={`w-full justify-start text-white border-slate-700 hover:bg-slate-700 hover:text-white ${!isOpen && 'px-2'}`}
              onClick={handleFetchData}
            >
              <Users size={16} className={`${isOpen ? 'mr-2' : 'mx-auto'}`} />
              {isOpen && <span>Fetch Users</span>}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className={`w-full justify-start text-white border-slate-700 hover:bg-slate-700 hover:text-white ${!isOpen && 'px-2'}`}
              onClick={handleExportCsv}
            >
              <Download size={16} className={`${isOpen ? 'mr-2' : 'mx-auto'}`} />
              {isOpen && <span>Export CSV</span>}
            </Button>
          </div>
        </nav>
      </aside>

      {/* Portal Selection Dialog */}
      <Dialog open={fetchDialogOpen} onOpenChange={setFetchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fetch Users from Portal</DialogTitle>
            <DialogDescription>
              Select a portal to fetch users from via SSH.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select 
              value={selectedPortal} 
              onValueChange={setSelectedPortal}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a portal" />
              </SelectTrigger>
              <SelectContent>
                {portalOptions.map(portal => (
                  <SelectItem key={portal} value={portal}>
                    {portal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFetchDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFetchUsersFromSSH}
              disabled={isLoading || !selectedPortal}
            >
              {isLoading ? "Fetching..." : "Fetch Users"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
