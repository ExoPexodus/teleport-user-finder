
import React, { useState } from 'react';
import { UserList } from '@/components/UserList';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/lib/api';
import { Loader } from '@/components/Loader';
import { ErrorDisplay } from '@/components/ErrorDisplay';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="min-h-screen bg-teleport-gray dark:bg-slate-900">
      <Header />
      <main className="container px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Teleport User Finder</h1>
        <div className="mb-8">
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
  );
};

export default Index;
