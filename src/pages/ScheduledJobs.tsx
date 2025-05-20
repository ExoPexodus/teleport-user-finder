
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { Loader } from '@/components/Loader';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock, ArrowDown, ArrowUp, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fetchScheduledJobs } from '@/lib/api';
import { RoleChangeSchedule } from '@/types/schedule';
import { Badge } from '@/components/ui/badge';

const ScheduledJobs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [portalFilter, setPortalFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'time-asc' | 'time-desc'>('time-asc');
  
  // Fetch all scheduled jobs
  const { data: allJobs, isLoading, error, refetch } = useQuery({
    queryKey: ['scheduled-jobs'],
    queryFn: () => fetchScheduledJobs(),
  });

  // Function to export CSV data
  const handleExportCsv = () => {
    if (!allJobs || allJobs.length === 0) return;
    
    // Create CSV content
    const headers = ['User', 'Portal', 'Action', 'Roles', 'Scheduled Time', 'Status'];
    const rows = allJobs.map(job => [
      job.userName,
      job.portal,
      job.action,
      job.roles.join(', '),
      new Date(job.scheduledTime).toLocaleString(),
      job.status
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
    link.setAttribute('download', `scheduled-jobs-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to filter and sort jobs
  const getFilteredAndSortedJobs = () => {
    if (!allJobs) return [];
    
    let filtered = allJobs;
    
    // Filter by search term (user name)
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by portal
    if (portalFilter) {
      filtered = filtered.filter(job => job.portal === portalFilter);
    }
    
    // Sort by time
    return filtered.sort((a, b) => {
      const timeA = new Date(a.scheduledTime).getTime();
      const timeB = new Date(b.scheduledTime).getTime();
      return sortBy === 'time-asc' ? timeA - timeB : timeB - timeA;
    });
  };
  
  const filteredJobs = getFilteredAndSortedJobs();
  
  // Get unique portals for filter dropdown
  const uniquePortals = allJobs 
    ? [...new Set(allJobs.map(job => job.portal))]
    : [];
  
  // Function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'scheduled': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Function to toggle sort direction
  const toggleSort = () => {
    setSortBy(sortBy === 'time-asc' ? 'time-desc' : 'time-asc');
  };

  return (
    <div className="min-h-screen bg-teleport-darkgray">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        users={[]}
        currentPage="scheduled-jobs" 
        onFetchData={refetch}
        onExportCsv={handleExportCsv}
      />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        <main className="container px-4 py-8">
          <Card className="mb-8 bg-teleport-gray border border-slate-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Scheduled Role Changes</CardTitle>
              <CardDescription>View and manage all scheduled role changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <SearchBar 
                    searchTerm={searchTerm} 
                    setSearchTerm={setSearchTerm} 
                    placeholder="Search by user name..."
                  />
                </div>
                <div className="w-full md:w-64">
                  <Select value={portalFilter || ""} onValueChange={value => setPortalFilter(value || null)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Filter size={16} />
                        <SelectValue placeholder="Filter by portal" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-portals">All Portals</SelectItem>
                      {uniquePortals.map(portal => (
                        <SelectItem key={portal} value={portal}>{portal}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  className="h-10 px-4 border-slate-700" 
                  onClick={toggleSort}
                >
                  <Clock size={16} className="mr-2" />
                  Sort by Time
                  {sortBy === 'time-asc' 
                    ? <ArrowUp size={16} className="ml-2" /> 
                    : <ArrowDown size={16} className="ml-2" />
                  }
                </Button>
              </div>

              {isLoading ? (
                <Loader />
              ) : error ? (
                <ErrorDisplay message="Failed to load scheduled jobs. Please try again later." />
              ) : filteredJobs.length > 0 ? (
                <div className="border rounded-md border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-800">
                      <TableRow>
                        <TableHead className="text-white">User</TableHead>
                        <TableHead className="text-white">Portal</TableHead>
                        <TableHead className="text-white">Action</TableHead>
                        <TableHead className="text-white">Roles</TableHead>
                        <TableHead className="text-white">Scheduled Time</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job) => (
                        <TableRow key={job.id} className="bg-teleport-gray border-slate-700">
                          <TableCell className="text-white">{job.userName}</TableCell>
                          <TableCell className="text-white">{job.portal}</TableCell>
                          <TableCell className="text-white">
                            <Badge variant={job.action === 'add' ? 'default' : 'destructive'}>
                              {job.action === 'add' ? 'Add' : 'Remove'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="flex flex-wrap gap-1">
                              {job.roles.map(role => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            {format(new Date(job.scheduledTime), 'MMM dd, yyyy - HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(job.status)}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-400">
                  No scheduled jobs found matching your filters
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ScheduledJobs;
