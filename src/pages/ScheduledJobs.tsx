
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Loader } from '@/components/Loader';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, ArrowDown, ArrowUp, Search, CalendarDays, 
  CheckCircle2, XCircle, Timer, RefreshCw, MoreHorizontal,
  ChevronDown, ChevronUp, User, Building2, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { fetchScheduledJobs } from '@/lib/api';
import { RoleChangeSchedule } from '@/types/schedule';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ScheduledJobs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [portalFilter, setPortalFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time-asc' | 'time-desc'>('time-desc');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  
  const { data: allJobs, isLoading, error, refetch } = useQuery({
    queryKey: ['scheduled-jobs'],
    queryFn: () => fetchScheduledJobs(),
  });

  const getFilteredAndSortedJobs = () => {
    if (!allJobs) return [];
    
    let filtered = allJobs;
    
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (portalFilter && portalFilter !== 'all') {
      filtered = filtered.filter(job => job.portal === portalFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }
    
    return filtered.sort((a, b) => {
      const timeA = new Date(a.scheduledTime).getTime();
      const timeB = new Date(b.scheduledTime).getTime();
      return sortBy === 'time-asc' ? timeA - timeB : timeB - timeA;
    });
  };
  
  const filteredJobs = getFilteredAndSortedJobs();
  
  const uniquePortals = allJobs ? [...new Set(allJobs.map(job => job.portal))] : [];
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': 
        return { 
          icon: CheckCircle2, 
          color: 'text-status-success', 
          bg: 'bg-status-success/10',
          label: 'Completed'
        };
      case 'failed': 
        return { 
          icon: XCircle, 
          color: 'text-status-error', 
          bg: 'bg-status-error/10',
          label: 'Failed'
        };
      case 'scheduled': 
        return { 
          icon: Timer, 
          color: 'text-status-warning', 
          bg: 'bg-status-warning/10',
          label: 'Pending'
        };
      default: 
        return { 
          icon: Clock, 
          color: 'text-muted-foreground', 
          bg: 'bg-muted',
          label: status
        };
    }
  };

  const stats = {
    total: allJobs?.length || 0,
    pending: allJobs?.filter(j => j.status === 'scheduled').length || 0,
    completed: allJobs?.filter(j => j.status === 'completed').length || 0,
    failed: allJobs?.filter(j => j.status === 'failed').length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        users={[]}
        currentPage="scheduled-jobs" 
        onFetchData={refetch}
      />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        <Header />
        <main className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Scheduled Jobs</h1>
                <p className="text-sm text-muted-foreground">
                  View and manage all scheduled role changes
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                    <p className="text-2xl font-semibold">{stats.total}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-semibold text-status-warning">{stats.pending}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-status-warning/10">
                    <Timer className="h-5 w-5 text-status-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-semibold text-status-success">{stats.completed}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-status-success/10">
                    <CheckCircle2 className="h-5 w-5 text-status-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-semibold text-status-error">{stats.failed}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-status-error/10">
                    <XCircle className="h-5 w-5 text-status-error" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={portalFilter} onValueChange={setPortalFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Portal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Portals</SelectItem>
                    {uniquePortals.map(portal => (
                      <SelectItem key={portal} value={portal}>{portal}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => setSortBy(sortBy === 'time-asc' ? 'time-desc' : 'time-asc')}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  {sortBy === 'time-asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Jobs List */}
          {isLoading ? (
            <div className="py-12">
              <Loader />
            </div>
          ) : error ? (
            <ErrorDisplay message="Failed to load scheduled jobs. Please try again later." />
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const statusConfig = getStatusConfig(job.status);
                const StatusIcon = statusConfig.icon;
                const isExpanded = expandedJob === job.id;

                return (
                  <Collapsible key={job.id} open={isExpanded} onOpenChange={() => setExpandedJob(isExpanded ? null : job.id)}>
                    <Card className={cn(
                      "border-border bg-card transition-all",
                      isExpanded && "ring-1 ring-primary/20"
                    )}>
                      <CollapsibleTrigger className="w-full">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* Status Icon */}
                              <div className={cn("p-2 rounded-lg", statusConfig.bg)}>
                                <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
                              </div>
                              
                              {/* User Info */}
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{job.userName}</span>
                                  <Badge variant="outline" className="text-xs">{job.portal}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                  <Badge 
                                    variant={job.action === 'add' ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {job.action === 'add' ? '+ Add' : '− Remove'}
                                  </Badge>
                                  <span>{job.roles.length} role{job.roles.length !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Time */}
                              <div className="text-right">
                                <div className="text-sm font-medium text-foreground">
                                  {format(new Date(job.scheduledTime), 'MMM d, yyyy')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(job.scheduledTime), 'h:mm a')}
                                </div>
                              </div>

                              {/* Status Badge */}
                              <Badge className={cn("min-w-20 justify-center", statusConfig.bg, statusConfig.color)}>
                                {statusConfig.label}
                              </Badge>

                              {/* Expand Icon */}
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-0 border-t border-border mt-0">
                          <div className="pt-4 space-y-4">
                            {/* Roles */}
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Roles to {job.action}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {job.roles.map(role => (
                                  <Badge key={role} variant="outline" className="text-xs">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Result (if exists) */}
                            {job.result && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">Result</p>
                                <p className="text-sm text-foreground bg-muted p-2 rounded-md font-mono">
                                  {job.result}
                                </p>
                              </div>
                            )}

                            {/* Executed At */}
                            {job.executedAt && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3" />
                                Executed at {format(new Date(job.executedAt), 'PPpp')}
                              </div>
                            )}

                            {/* Actions for pending jobs */}
                            {job.status === 'scheduled' && (
                              <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" className="text-status-error border-status-error/20 hover:bg-status-error/10">
                                  Cancel Job
                                </Button>
                              </div>
                            )}

                            {/* Actions for failed jobs */}
                            {job.status === 'failed' && (
                              <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm">
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Retry
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No scheduled jobs found matching your filters</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default ScheduledJobs;
