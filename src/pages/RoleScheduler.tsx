
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { UserRoleScheduler } from '@/components/UserRoleScheduler';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/lib/api';
import { Loader } from '@/components/Loader';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { User } from '@/types/user';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User as UserIcon, Building2, Shield, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const RoleScheduler = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: allUsers, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
  });

  const filteredUsers = (allUsers || []).filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.portal?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  const getPortalColor = (portal: string | null) => {
    switch (portal) {
      case 'kocharsoft': return 'bg-portal-kocharsoft/10 text-portal-kocharsoft border-portal-kocharsoft/20';
      case 'igzy': return 'bg-portal-igzy/10 text-portal-igzy border-portal-igzy/20';
      case 'maxicus': return 'bg-portal-maxicus/10 text-portal-maxicus border-portal-maxicus/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        users={allUsers || []}
        currentPage="scheduler" 
      />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        <Header />
        <main className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Role Scheduler</h1>
              <p className="text-sm text-muted-foreground">
                Schedule or immediately apply role changes for users
              </p>
            </div>
          </div>

          {/* Step 1: User Selection */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  1
                </div>
                <CardTitle className="text-base">Select User</CardTitle>
              </div>
              <CardDescription>
                Search and select a user to manage their roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name or portal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-input"
                />
              </div>
              
              {isLoading ? (
                <div className="py-8">
                  <Loader />
                </div>
              ) : error ? (
                <ErrorDisplay message="Failed to load users. Please try again later." />
              ) : (
                <div className="space-y-2">
                  {filteredUsers.length > 0 ? (
                    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                      {filteredUsers.map(user => (
                        <div 
                          key={user.id}
                          className={cn(
                            "flex items-center justify-between p-3 cursor-pointer transition-colors",
                            selectedUser?.id === user.id 
                              ? 'bg-primary/10 border-l-2 border-l-primary' 
                              : 'hover:bg-muted/50'
                          )}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{user.name}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                <span>{user.portal}</span>
                                <span className="text-border">•</span>
                                <Shield className="h-3 w-3" />
                                <span>{user.roles.length} roles</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-xs", getPortalColor(user.portal))}>
                              {user.portal}
                            </Badge>
                            <ChevronRight className={cn(
                              "h-4 w-4 transition-colors",
                              selectedUser?.id === user.id ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchTerm ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found matching "{searchTerm}"
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Start typing to search for users
                    </div>
                  )}
                  {searchTerm && filteredUsers.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Showing top {filteredUsers.length} results
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Step 2: Role Scheduler */}
          {selectedUser && (
            <UserRoleScheduler user={selectedUser} />
          )}
        </main>
      </div>
    </div>
  );
};

export default RoleScheduler;
