
import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Clock } from 'lucide-react';
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
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('12:00');
  const [roleAction, setRoleAction] = useState<'add' | 'remove'>('remove');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExecutingNow, setIsExecutingNow] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch available roles for the user's portal if action is 'add'
  const { data: availableRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['available-roles', user.portal, roleAction],
    queryFn: () => roleAction === 'add' && user.portal ? fetchAvailableRoles(user.portal) : Promise.resolve([]),
    enabled: roleAction === 'add' && !!user.portal,
  });

  // Reset selected roles when changing action type
  useEffect(() => {
    setSelectedRoles([]);
  }, [roleAction]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(current => 
      current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role]
    );
  };

  const handleLoginSuccess = () => {
    // After successful login, try scheduling again
    handleSchedule();
  };

  const handleExecuteNow = async () => {
    if (selectedRoles.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select at least one role",
        variant: "destructive"
      });
      return;
    }

    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "You need to login before executing role changes",
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
        title: "Role Change Executed",
        description: `Role changes applied successfully: ${response.message}`,
      });
    } catch (error) {
      console.error('Execution error:', error);
      
      // Check if the error is due to token expiration or authentication issues
      if (error instanceof Error && 
         (error.message.includes('Token has expired') || 
          error.message.includes('Token is invalid') || 
          error.message.includes('Token is missing'))) {
        
        toast({
          title: "Authentication Required",
          description: "Your session has expired. Please login again.",
          variant: "destructive"
        });
        setLoginDialogOpen(true);
      } else {
        toast({
          title: "Error Executing Role Change",
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

    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "You need to login before scheduling role changes",
        variant: "destructive"
      });
      setLoginDialogOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert date and time to a combined datetime
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledTime = new Date(date);
      scheduledTime.setHours(hours, minutes);

      const response = await scheduleRoleChange({
        userId: user.id,
        userName: user.name,
        portal: user.portal,
        scheduledTime: scheduledTime.toISOString(),
        action: roleAction,
        roles: selectedRoles
      });

      toast({
        title: "Schedule created",
        description: `Role changes scheduled for ${format(scheduledTime, 'PPP')} at ${format(scheduledTime, 'p')}`,
      });
    } catch (error) {
      console.error('Scheduling error:', error);
      
      // Check if the error is due to token expiration or authentication issues
      if (error instanceof Error && 
         (error.message.includes('Token has expired') || 
          error.message.includes('Token is invalid') || 
          error.message.includes('Token is missing'))) {
        
        toast({
          title: "Authentication Required",
          description: "Your session has expired. Please login again.",
          variant: "destructive"
        });
        setLoginDialogOpen(true);
      } else {
        toast({
          title: "Error Scheduling Role Change",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which roles to display based on the action
  const rolesToDisplay = roleAction === 'remove' 
    ? user.roles 
    : (availableRoles || []);

  return (
    <>
      <Card className="bg-teleport-gray border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Schedule Role Changes</CardTitle>
          <CardDescription>
            User: <span className="font-semibold">{user.name}</span>
            {user.portal && <span> • Portal: <span className="font-semibold">{user.portal}</span></span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-white">Action</Label>
                <div className="flex space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="remove-roles"
                      checked={roleAction === 'remove'} 
                      onChange={() => setRoleAction('remove')}
                    />
                    <Label htmlFor="remove-roles">Remove Roles</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="add-roles"
                      checked={roleAction === 'add'} 
                      onChange={() => setRoleAction('add')}
                    />
                    <Label htmlFor="add-roles">Add Roles</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">
                  {roleAction === 'remove' ? 'Select Roles to Remove' : 'Select Roles to Add'}
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 max-h-48 overflow-y-auto bg-slate-800 rounded-md">
                  {isLoadingRoles && roleAction === 'add' ? (
                    <div className="col-span-3 text-center p-4 text-gray-400">Loading available roles...</div>
                  ) : rolesToDisplay.length > 0 ? (
                    rolesToDisplay.map(role => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`role-${role}`} 
                          checked={selectedRoles.includes(role)}
                          onCheckedChange={() => handleRoleToggle(role)}
                        />
                        <Label 
                          htmlFor={`role-${role}`}
                          className="text-sm text-gray-300"
                        >
                          {role}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 col-span-3 text-center p-2">
                      {roleAction === 'add' 
                        ? "No additional roles available to add" 
                        : "No roles assigned to remove"}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Button
                  variant="default"
                  className="w-full"
                  disabled={isExecutingNow || selectedRoles.length === 0}
                  onClick={handleExecuteNow}
                >
                  {isExecutingNow ? "Applying Changes..." : `Apply ${roleAction === 'add' ? "New" : "Removal of"} Roles Now`}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Schedule for Later</Label>
                <div className="p-4 bg-slate-800 rounded-md space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="time" className="text-white">Time</Label>
                    <div className="flex items-center mt-2">
                      <Clock className="mr-2 h-4 w-4 text-gray-400" />
                      <Input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSchedule} 
                    className="w-full"
                    disabled={isSubmitting || !date || selectedRoles.length === 0}
                  >
                    {isSubmitting ? 'Scheduling...' : 'Schedule Role Change'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={() => setSelectedRoles([])}>
            Clear Selection
          </Button>
        </CardFooter>
      </Card>

      {/* Login Dialog */}
      <LoginDialog 
        isOpen={loginDialogOpen} 
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
