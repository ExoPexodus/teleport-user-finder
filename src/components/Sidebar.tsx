import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoginDialog } from '@/components/LoginDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  Download, 
  Home, 
  User, 
  Clock,
  Server
} from 'lucide-react';
import { fetchUsersFromSSH } from '@/lib/api';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { TeleportLoginDialog } from '@/components/TeleportLoginDialog';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  users: any[];
  onFetchData?: () => void;
  onExportCsv?: () => void;
  currentPage?: string;
}

export const Sidebar = ({ isOpen, setIsOpen, onFetchData, onExportCsv, users, currentPage }: SidebarProps) => {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showTeleportLoginDialog, setShowTeleportLoginDialog] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  // Get unique portals from user data
  const portals = [...new Set(users.map(user => user.portal))].filter(Boolean);
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/scheduler', label: 'Role Scheduler', icon: Database },
    { path: '/scheduled-jobs', label: 'Scheduled Jobs', icon: Clock },
  ];

  const handleFetchFromPortal = async (portal: string) => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }
    
    // Store the selected portal for use after teleport login if needed
    setSelectedPortal(portal);
    
    setIsFetching(true);
    try {
      const result = await fetchUsersFromSSH(portal);
      onFetchData && await onFetchData();
      toast({
        title: "Users fetched",
        description: result.message || `Users from ${portal} fetched successfully.`,
      });
    } catch (error) {
      console.error('Error fetching users from portal:', error);
      
      // Check if the error is due to teleport authentication
      if (error instanceof Error && error.message.includes('Teleport authentication required')) {
        setShowTeleportLoginDialog(true);
        return;
      }
      
      toast({
        title: "Fetch failed",
        description: error instanceof Error ? error.message : `Failed to fetch users from ${portal}.`,
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };
  
  const handleExportCsv = () => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }
    
    if (!onExportCsv) return;
    
    onExportCsv();
  };

  const handleTeleportLoginSuccess = async () => {
    setShowTeleportLoginDialog(false);
    // Retry fetching with the selected portal if it exists
    if (selectedPortal) {
      await handleFetchFromPortal(selectedPortal);
    }
  };

  return (
    <>
      <div className={`fixed top-0 left-0 h-full bg-teleport-gray border-r border-slate-800 shadow-lg transition-all duration-300 z-10 ${isOpen ? "w-64" : "w-16"}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex justify-between items-center border-b border-slate-800">
            {isOpen && (
              <span className="text-lg font-bold text-white">Teleport</span>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:bg-teleport-blue/20"
            >
              {isOpen ? <ChevronLeft /> : <ChevronRight />}
            </Button>
          </div>
          
          <div className="p-4 flex flex-col flex-grow">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className={`flex items-center p-2 rounded-md transition-colors ${
                      isActive 
                        ? "bg-teleport-blue text-white" 
                        : "text-gray-300 hover:bg-teleport-blue/20"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {isOpen && <span className="ml-3">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
            
            <div className="mt-auto space-y-2">
              {/* Fetch users from portal dropdown */}
              {portals.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start ${isOpen ? "" : "px-0 justify-center"}`}
                      disabled={isFetching}
                    >
                      {isFetching ? (
                        <Server className="h-5 w-5 animate-pulse" />
                      ) : (
                        <Server className="h-5 w-5" />
                      )}
                      {isOpen && <span className="ml-2 truncate">Fetch from Portal</span>}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-teleport-gray border-slate-700 text-white">
                    {portals.map(portal => (
                      <DropdownMenuItem
                        key={portal}
                        onClick={() => handleFetchFromPortal(portal)}
                        className="cursor-pointer"
                      >
                        {portal}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {onExportCsv && (
                <Button
                  variant="outline"
                  className={`w-full justify-start ${isOpen ? "" : "px-0 justify-center"}`}
                  onClick={handleExportCsv}
                >
                  <Download className="h-5 w-5" />
                  {isOpen && <span className="ml-2">Export CSV</span>}
                </Button>
              )}
            </div>
          </div>
          
          {isOpen && isAuthenticated && user && (
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center">
                <div className="bg-teleport-blue rounded-full p-2">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="ml-2 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">
                    {user.name || user.username}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Regular login dialog */}
      <LoginDialog 
        isOpen={showLoginDialog} 
        onClose={() => setShowLoginDialog(false)} 
        onSuccess={() => setShowLoginDialog(false)}
      />

      {/* Teleport login dialog */}
      <TeleportLoginDialog
        isOpen={showTeleportLoginDialog}
        onClose={() => setShowTeleportLoginDialog(false)}
        onSuccess={handleTeleportLoginSuccess}
      />
    </>
  );
};
