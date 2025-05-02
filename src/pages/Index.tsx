
import React, { useState } from 'react';
import { UserList } from '@/components/UserList';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { Sidebar } from '@/components/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/lib/api';
import { Loader } from '@/components/Loader';
import { ErrorDisplay } from '@/components/ErrorDisplay';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

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
            <UserList users={filteredUsers} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
