
import React, { useState, useEffect } from 'react';
import { UserList } from '@/components/UserList';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers, updateUser, deleteUsers } from '@/lib/api';
import { Loader } from '@/components/Loader';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { User } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { ViewMode } from '@/components/ViewModeToggle';
import { UserSearch } from '@/components/UserSearch';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [excludedRoles, setExcludedRoles] = useState<string[]>([]);
  const [includedRoles, setIncludedRoles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table'); // Default to table
  const { toast } = useToast();
  
  const { data: allUsers, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
  });

  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      const allAvailableRoles = Array.from(
        new Set(allUsers.flatMap(user => user.roles))
      );
      setIncludedRoles(allAvailableRoles);
    }
  }, [allUsers]);

  const filteredUsers = (allUsers || []).filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.manager && user.manager.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPortal = !selectedPortal || user.portal === selectedPortal;
    const matchesManager = !selectedManager || user.manager === selectedManager;
    const hasExcludedRole = user.roles.some(role => excludedRoles.includes(role));
    const hasIncludedRole = includedRoles.length === 0 || user.roles.some(role => includedRoles.includes(role));
    
    return matchesSearch && matchesPortal && matchesManager && !hasExcludedRole && hasIncludedRole;
  });

  const handleUserUpdate = async (updatedUser: User) => {
    try {
      await updateUser(updatedUser);
      refetch();
      toast({
        title: "User updated",
        description: `${updatedUser.name}'s information has been updated.`
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update user information.",
        variant: "destructive"
      });
    }
  };

  const handleFilterChange = (field: 'portal' | 'manager', value: string) => {
    if (field === 'portal') setSelectedPortal(value || null);
    else if (field === 'manager') setSelectedManager(value || null);
  };

  const handleRoleExclusionChange = (role: string, excluded: boolean) => {
    setExcludedRoles(prev => excluded ? [...prev, role] : prev.filter(r => r !== role));
  };

  const handleRoleInclusionChange = (role: string, included: boolean) => {
    setIncludedRoles(prev => included ? [...prev, role] : prev.filter(r => r !== role));
  };

  const handleSelectAllRoles = (type: 'include' | 'exclude', selected: boolean) => {
    if (!allUsers) return;
    const allAvailableRoles = Array.from(new Set(allUsers.flatMap(user => user.roles)));
    if (type === 'include') setIncludedRoles(selected ? allAvailableRoles : []);
    else setExcludedRoles(selected ? allAvailableRoles : []);
  };

  const handleDeleteUsers = async (userIds: string[]) => {
    try {
      await deleteUsers(userIds);
      refetch();
      toast({
        title: "Users deleted",
        description: `${userIds.length} user${userIds.length !== 1 ? 's' : ''} deleted.`
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete users.",
        variant: "destructive"
      });
    }
  };

  const handleExportAllUsers = () => {
    if (!allUsers || allUsers.length === 0) {
      toast({ title: "No Data", description: "No users to export.", variant: "destructive" });
      return;
    }
    
    const headers = ["ID", "Name", "Roles", "Status", "Created Date", "Last Login", "Manager", "Portal"];
    const userRows = allUsers.map(user => [
      user.id, `"${user.name}"`, `"${user.roles.join("; ")}"`, user.status,
      new Date(user.createdDate).toLocaleDateString(),
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never",
      user.manager ? `"${user.manager}"` : "None",
      user.portal ? `"${user.portal}"` : "None"
    ]);
    
    const csvContent = [headers.join(","), ...userRows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `all_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Exported", description: `${allUsers.length} users exported.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        users={allUsers || []} 
        onFetchData={refetch}
        onExportCsv={handleExportAllUsers}
      />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        <Header />
        <main className="p-6">
          <UserSearch
            allUsers={allUsers}
            isLoading={isLoading}
            error={error as Error | null}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedPortal={selectedPortal}
            setSelectedPortal={setSelectedPortal}
            selectedManager={selectedManager}
            setSelectedManager={setSelectedManager}
            excludedRoles={excludedRoles}
            setExcludedRoles={setExcludedRoles}
            includedRoles={includedRoles}
            setIncludedRoles={setIncludedRoles}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onFilterChange={handleFilterChange}
            onRoleExclusionChange={handleRoleExclusionChange}
            onRoleInclusionChange={handleRoleInclusionChange}
            onSelectAllRoles={handleSelectAllRoles}
            filteredCount={filteredUsers.length}
          />
          
          {isLoading ? (
            <Loader />
          ) : error ? (
            <ErrorDisplay message="Failed to load users." />
          ) : (
            <UserList 
              users={filteredUsers} 
              onUserUpdate={handleUserUpdate} 
              viewMode={viewMode}
              onDeleteSelected={handleDeleteUsers}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;