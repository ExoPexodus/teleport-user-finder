
import React, { useState } from 'react';
import { User } from '@/types/user';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Clock, 
  Download, 
  RefreshCw, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
import { fetchUsersFromSSH, manageOrphanedUsers } from '@/lib/api';
import { LoginDialog } from '@/components/LoginDialog';
import { OrphanedUsersDialog } from '@/components/OrphanedUsersDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  users: User[];
  currentPage?: string;
  onFetchData?: () => void;
  onExportCsv?: () => void;
}

const navItems = [
  { path: '/', label: 'Users', icon: Users, page: 'home' },
  { path: '/scheduler', label: 'Role Scheduler', icon: Clock, page: 'scheduler' },
  { path: '/scheduled-jobs', label: 'Scheduled Jobs', icon: Calendar, page: 'scheduled-jobs' },
];

export const Sidebar = ({ 
  isOpen, 
  setIsOpen, 
  users, 
  currentPage = 'home',
  onFetchData,
  onExportCsv 
}: SidebarProps) => {
  const { toast } = useToast();
  const { logout } = useAuth();
  const location = useLocation();
  const [fetchDialogOpen, setFetchDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [orphanedUsersDialogOpen, setOrphanedUsersDialogOpen] = useState(false);
  const [orphanedUsers, setOrphanedUsers] = useState<User[]>([]);
  const [currentPortal, setCurrentPortal] = useState<string>('');
  
  const portalOptions = ['kocharsoft', 'maxicus', 'igzy'];

  const handleFetchData = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "You need to login before fetching user data",
        variant: "destructive"
      });
      setLoginDialogOpen(true);
      return;
    }
    setFetchDialogOpen(true);
  };

  const handleLoginSuccess = () => {
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
      
      setFetchDialogOpen(false);
      
      if (result.orphaned_users && result.orphaned_users.length > 0) {
        setOrphanedUsers(result.orphaned_users);
        setCurrentPortal(selectedPortal);
        setOrphanedUsersDialogOpen(true);
      }
      
      if (onFetchData) {
        onFetchData();
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      
      if (error instanceof Error && 
         (error.message.includes('Token has expired') || 
          error.message.includes('Token is invalid') || 
          error.message.includes('Token is missing'))) {
        
        toast({
          title: "Authentication Required",
          description: "Your session has expired. Please login again.",
          variant: "destructive"
        });
        setLoginDialogOpen(true);
      } else {
        toast({
          title: "Error Fetching Users",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageOrphanedUsers = async (
    action: 'keep_all' | 'delete_all' | 'selective', 
    userIdsToKeep?: string[]
  ) => {
    try {
      const orphanedUserIds = orphanedUsers.map(user => user.id);
      const result = await manageOrphanedUsers(currentPortal, action, userIdsToKeep, orphanedUserIds);
      
      toast({
        title: "Users Managed",
        description: result.message
      });
      
      setOrphanedUsersDialogOpen(false);
      
      if (onFetchData) {
        onFetchData();
      }
    } catch (error) {
      console.error("Error managing orphaned users:", error);
      toast({
        title: "Error Managing Users",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleExportCsv = () => {
    if (onExportCsv) {
      onExportCsv();
    } else if (users && users.length > 0) {
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
  };

  const NavItem = ({ path, label, icon: Icon, page }: typeof navItems[0]) => {
    const isActive = location.pathname === path;
    
    const content = (
      <Link
        to={path}
        className={cn(
          "nav-item group",
          isActive && "nav-item-active"
        )}
      >
        <Icon size={20} className={cn(
          "shrink-0 transition-colors",
          isActive ? "text-primary" : "text-sidebar-muted group-hover:text-sidebar-accent-foreground"
        )} />
        {isOpen && <span className="truncate">{label}</span>}
      </Link>
    );

    if (!isOpen) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const ActionButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    variant = 'default' 
  }: { 
    icon: typeof Users; 
    label: string; 
    onClick: () => void;
    variant?: 'default' | 'danger';
  }) => {
    const content = (
      <button
        onClick={onClick}
        className={cn(
          "nav-item w-full",
          variant === 'danger' && "text-destructive hover:bg-destructive/10"
        )}
      >
        <Icon size={20} className={cn(
          "shrink-0",
          variant === 'danger' ? "text-destructive" : "text-sidebar-muted"
        )} />
        {isOpen && <span className="truncate">{label}</span>}
      </button>
    );

    if (!isOpen) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "fixed top-0 left-0 h-full z-20 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-out",
          isOpen ? "w-60" : "w-16"
        )}
      >
        {/* Logo / Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border px-4",
          isOpen ? "justify-between" : "justify-center"
        )}>
          {isOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield size={18} className="text-primary" />
              </div>
              <span className="font-semibold text-foreground">Teleport</span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-md text-sidebar-muted hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>

        {/* Actions */}
        <div className="p-3 space-y-1 border-t border-sidebar-border">
          <ActionButton icon={RefreshCw} label="Sync Users" onClick={handleFetchData} />
          <ActionButton icon={Download} label="Export CSV" onClick={handleExportCsv} />
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <ActionButton icon={LogOut} label="Logout" onClick={logout} variant="danger" />
        </div>
      </aside>

      {/* Portal Selection Dialog */}
      <Dialog open={fetchDialogOpen} onOpenChange={setFetchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sync Users from Portal</DialogTitle>
            <DialogDescription>
              Select a portal to synchronize user data via SSH.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={selectedPortal} onValueChange={setSelectedPortal}>
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
            <Button variant="outline" onClick={() => setFetchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFetchUsersFromSSH} disabled={isLoading || !selectedPortal}>
              {isLoading ? "Syncing..." : "Sync Users"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoginDialog 
        isOpen={loginDialogOpen} 
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      <OrphanedUsersDialog
        isOpen={orphanedUsersDialogOpen}
        onClose={() => setOrphanedUsersDialogOpen(false)}
        orphanedUsers={orphanedUsers}
        portal={currentPortal}
        onManageUsers={handleManageOrphanedUsers}
      />
    </TooltipProvider>
  );
};