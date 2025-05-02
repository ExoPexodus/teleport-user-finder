
import React, { useState } from 'react';
import { UserList } from '@/components/UserList';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { Sidebar } from '@/components/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers, updateUser, deleteUsers } from '@/lib/api';
import { Loader } from '@/components/Loader';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { User } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { UserFilter } from '@/components/UserFilter';
import { ViewModeToggle, ViewMode } from '@/components/ViewModeToggle';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const { toast } = useToast();
  
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users', selectedPortal],
    queryFn: () => fetchUsers(selectedPortal || undefined),
  });

  // Filter users by search term, portal, and manager
  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.manager && user.manager.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPortal = !selectedManager || user.manager === selectedManager;
    const matchesManager = !selectedManager || user.manager === selectedManager;
    
    return matchesSearch && matchesPortal && matchesManager;
  });

  const handleUserUpdate = async (updatedUser: User) => {
    try {
      // Log the user we're trying to update for debugging
      console.log('Updating user:', updatedUser);
      
      await updateUser(updatedUser);
      refetch(); // Refresh data after update
      
      toast({
        title: "User updated",
        description: `${updatedUser.name}'s information has been updated successfully.`
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: "Failed to update user information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFilterChange = (field: 'portal' | 'manager', value: string) => {
    if (field === 'portal') {
      setSelectedPortal(value || null);
    } else if (field === 'manager') {
      setSelectedManager(value || null);
    }
  };

  const handleDeleteUsers = async (userIds: string[]) => {
    try {
      await deleteUsers(userIds);
      refetch(); // Refresh data after deletion
      
      toast({
        title: "Users deleted",
        description: `${userIds.length} user${userIds.length !== 1 ? 's' : ''} deleted successfully.`
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete users. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-teleport-darkgray">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} users={users || []} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        <main className="container px-4 py-8">
          <div className="mb-8 bg-teleport-gray rounded-lg p-6 shadow-lg border border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-white">User Search</h1>
              <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>
            
            <div className="space-y-4">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              
              {!isLoading && !error && users && (
                <UserFilter 
                  users={users} 
                  onFilterChange={handleFilterChange}
                  selectedPortal={selectedPortal}
                  selectedManager={selectedManager}
                />
              )}
            </div>
          </div>
          
          {isLoading ? (
            <Loader />
          ) : error ? (
            <ErrorDisplay message="Failed to load users. Please try again later." />
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
