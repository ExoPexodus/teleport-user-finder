
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { UserRoleScheduler } from '@/components/UserRoleScheduler';
import { SearchBar } from '@/components/SearchBar';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/lib/api';
import { Loader } from '@/components/Loader';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { User } from '@/types/user';

const RoleScheduler = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch all users
  const { data: allUsers, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
  });

  // Function to export users as CSV
  const handleExportCsv = () => {
    if (!allUsers || allUsers.length === 0) return;
    
    // Create CSV content
    const headers = ['Name', 'Portal', 'Roles'];
    const rows = allUsers.map(user => [
      user.name,
      user.portal,
      user.roles.join(', ')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter users by search term
  const filteredUsers = (allUsers || []).filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-teleport-darkgray">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        users={allUsers || []}
        currentPage="scheduler"
        onFetchData={refetch}
        onExportCsv={handleExportCsv}
      />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        <main className="container px-4 py-8">
          <div className="mb-8 bg-teleport-gray rounded-lg p-6 shadow-lg border border-slate-800">
            <h1 className="text-2xl font-bold text-white mb-6">Role Scheduling</h1>
            <p className="text-gray-300 mb-4">
              Search for a user, select them, and schedule role changes across their portals.
            </p>
            
            <div className="space-y-4">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              
              {isLoading ? (
                <Loader />
              ) : error ? (
                <ErrorDisplay message="Failed to load users. Please try again later." />
              ) : (
                <div className="mt-4">
                  <h2 className="text-lg font-semibold text-white mb-2">Search Results</h2>
                  {filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto bg-slate-800 rounded-md p-2">
                      {filteredUsers.map(user => (
                        <div 
                          key={user.id}
                          className={`p-2 rounded-md cursor-pointer transition-colors ${selectedUser?.id === user.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-slate-700 hover:bg-slate-600'}`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs opacity-80">
                            {user.portal} • {user.roles.join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchTerm ? (
                    <div className="text-gray-400">No users found matching "{searchTerm}"</div>
                  ) : (
                    <div className="text-gray-400">Type to search for users</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {selectedUser && (
            <UserRoleScheduler user={selectedUser} />
          )}
        </main>
      </div>
    </div>
  );
};

export default RoleScheduler;
