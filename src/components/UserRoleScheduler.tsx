
import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Plus, Minus, Zap, CalendarDays, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { scheduleRoleChange, executeRoleChange, fetchAvailableRoles } from '@/lib/api';
import { LoginDialog } from '@/components/LoginDialog';
import { useQuery } from '@tanstack/react-query';

interface UserRoleSchedulerProps {
  user: User;
}

export function UserRoleScheduler({ user }: UserRoleSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('09:00');
  const [roleAction, setRoleAction] = useState<'add' | 'remove'>('remove');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExecutingNow, setIsExecutingNow] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: availableRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['available-roles', user.portal, roleAction],
    queryFn: () => roleAction === 'add' && user.portal ? fetchAvailableRoles(user.portal) : Promise.resolve([]),
    enabled: roleAction === 'add' && !!user.portal,
  });

  useEffect(() => {
    setSelectedRoles([]);
  }, [roleAction, user.id]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(current => 
      current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role]
    );
  };

  const handleLoginSuccess = () => {
    handleSchedule();
  };

  const handleExecuteNow = async () => {
    if (selectedRoles.length === 0) {
      toast({
        title: "No roles selected",
        description: "Please select at least one role to continue",
        variant: "destructive"
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please login to execute role changes",
        variant: "destructive"
      });
      setLoginDialogOpen(true);
      return;
    }

    setIsExecutingNow(true);

    try {
      const response = await executeRoleChange(
        user.id,
        user.name,
        user.portal,
        roleAction,
        selectedRoles
      );

      toast({
        title: "Success",
        description: response.message,
      });
      setSelectedRoles([]);
    } catch (error) {
      console.error('Execution error:', error);
      
      if (error instanceof Error && 
         (error.message.includes('Token has expired') || 
          error.message.includes('Token is invalid') || 
          error.message.includes('Token is missing'))) {
        setLoginDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setIsExecutingNow(false);
    }
  };

  const handleSchedule = async () => {
    if (!date || selectedRoles.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select date, time, and at least one role",
        variant: "destructive"
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please login to schedule role changes",
        variant: "destructive"
      });
      setLoginDialogOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledTime = new Date(date);
      scheduledTime.setHours(hours, minutes);

      await scheduleRoleChange({
        userId: user.id,
        userName: user.name,
        portal: user.portal,
        scheduledTime: scheduledTime.toISOString(),
        action: roleAction,
        roles: selectedRoles
      });

      toast({
        title: "Scheduled successfully",
        description: `Role changes scheduled for ${format(scheduledTime, 'PPP')} at ${format(scheduledTime, 'p')}`,
      });
      setSelectedRoles([]);
      setDate(undefined);
    } catch (error) {
      console.error('Scheduling error:', error);
      
      if (error instanceof Error && 
         (error.message.includes('Token has expired') || 
          error.message.includes('Token is invalid') || 
          error.message.includes('Token is missing'))) {
        setLoginDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const rolesToDisplay = roleAction === 'remove' ? user.roles : (availableRoles || []);
  const canProceed = selectedRoles.length > 0;

  // Generate human-readable summary
  const getSummary = () => {
    if (selectedRoles.length === 0) return null;
    const action = roleAction === 'add' ? 'Add' : 'Remove';
    const roles = selectedRoles.join(', ');
    return `${action} roles: ${roles} ${roleAction === 'add' ? 'to' : 'from'} ${user.name} on ${user.portal}`;
  };

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              2
            </div>
            <CardTitle className="text-base">Configure Role Change</CardTitle>
          </div>
          <CardDescription className="flex items-center gap-2">
            <span>Managing:</span>
            <Badge variant="outline" className="font-medium">{user.name}</Badge>
            <span className="text-muted-foreground">on</span>
            <Badge variant="outline">{user.portal}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Action Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRoleAction('remove')}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                  roleAction === 'remove'
                    ? "border-status-error bg-status-error/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  roleAction === 'remove' ? "bg-status-error/10" : "bg-muted"
                )}>
                  <Minus className={cn("h-4 w-4", roleAction === 'remove' ? "text-status-error" : "text-muted-foreground")} />
                </div>
                <div>
                  <div className={cn("font-medium", roleAction === 'remove' ? "text-status-error" : "text-foreground")}>
                    Remove Roles
                  </div>
                  <div className="text-xs text-muted-foreground">Revoke access from user</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRoleAction('add')}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                  roleAction === 'add'
                    ? "border-status-success bg-status-success/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  roleAction === 'add' ? "bg-status-success/10" : "bg-muted"
                )}>
                  <Plus className={cn("h-4 w-4", roleAction === 'add' ? "text-status-success" : "text-muted-foreground")} />
                </div>
                <div>
                  <div className={cn("font-medium", roleAction === 'add' ? "text-status-success" : "text-foreground")}>
                    Add Roles
                  </div>
                  <div className="text-xs text-muted-foreground">Grant new permissions</div>
                </div>
              </button>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Select Roles to {roleAction === 'remove' ? 'Remove' : 'Add'}
            </Label>
            <div className="p-4 rounded-lg border border-border bg-background">
              {isLoadingRoles && roleAction === 'add' ? (
                <div className="text-center py-4 text-muted-foreground">Loading available roles...</div>
              ) : rolesToDisplay.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {rolesToDisplay.map(role => (
                    <label
                      key={role}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-all",
                        selectedRoles.includes(role)
                          ? roleAction === 'remove'
                            ? "border-status-error bg-status-error/5"
                            : "border-status-success bg-status-success/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <Checkbox 
                        checked={selectedRoles.includes(role)}
                        onCheckedChange={() => handleRoleToggle(role)}
                      />
                      <span className="text-sm">{role}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {roleAction === 'add' ? "No additional roles available" : "No roles assigned"}
                </div>
              )}
            </div>
            {selectedRoles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Summary Preview */}
          {canProceed && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Ready to apply</p>
                  <p className="text-sm text-muted-foreground mt-1">{getSummary()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Execute Now */}
            <div className="space-y-3 p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-status-warning" />
                <span className="font-medium text-sm">Execute Immediately</span>
              </div>
              <Button
                className="w-full"
                variant={roleAction === 'remove' ? 'destructive' : 'default'}
                disabled={isExecutingNow || !canProceed}
                onClick={handleExecuteNow}
              >
                {isExecutingNow ? (
                  "Applying..."
                ) : (
                  <>
                    Apply Now
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Schedule */}
            <div className="space-y-3 p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Schedule for Later</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'MMM d') : 'Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(d) => d < new Date()}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSchedule} 
                className="w-full"
                variant="outline"
                disabled={isSubmitting || !date || !canProceed}
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <LoginDialog 
        isOpen={loginDialogOpen} 
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
