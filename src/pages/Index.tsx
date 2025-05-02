
import React, { useState } from 'react';
import { UserList } from '@/components/UserList';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { Sidebar } from '@/components/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers, updateUser } from '@/lib/api';
import { Loader } from '@/components/Loader';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { User } from '@/types/user';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users', selectedPortal],
    queryFn: () => fetchUsers(selectedPortal || undefined),
  });

  const filteredUsers = (users || []).filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.manager && user.manager.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <div className="min-h-screen bg-teleport-darkgray">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} users={users || []} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        <main className="container px-4 py-8">
          <div className="mb-8 bg-teleport-gray rounded-lg p-6 shadow-lg border border-slate-800">
            <h1 className="text-2xl font-bold text-white mb-6">User Search</h1>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
          
          {isLoading ? (
            <Loader />
          ) : error ? (
            <ErrorDisplay message="Failed to load users. Please try again later." />
          ) : (
            <UserList users={filteredUsers} onUserUpdate={handleUserUpdate} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
