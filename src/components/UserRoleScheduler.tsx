
import React, { useState } from 'react';
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
import { scheduleRoleChange } from '@/lib/api';

type PortalRolesMap = {
  [portal: string]: string[];
};

interface UserRoleSchedulerProps {
  user: User;
}

export function UserRoleScheduler({ user }: UserRoleSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('12:00');
  const [roleAction, setRoleAction] = useState<'add' | 'remove'>('remove');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPortal, setSelectedPortal] = useState<string | null>(user.portal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Get all unique portals where this user exists
  const userPortals = [user.portal].filter(Boolean) as string[];

  // Get all roles for this user by portal
  const userRolesByPortal: PortalRolesMap = {
    [user.portal as string]: user.roles,
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(current => 
      current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role]
    );
  };

  const handleSchedule = async () => {
    if (!date || !selectedPortal || selectedRoles.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select date, time, portal, and at least one role",
        variant: "destructive"
      });
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
        portal: selectedPortal,
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
      toast({
        title: "Schedule failed",
        description: "Failed to schedule role changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-teleport-gray border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Schedule Role Changes</CardTitle>
        <CardDescription>
          User: <span className="font-semibold">{user.name}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="portal" className="text-white">Portal</Label>
              <select 
                id="portal"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedPortal || ''}
                onChange={(e) => setSelectedPortal(e.target.value)}
              >
                <option value="">Select Portal</option>
                {userPortals.map(portal => (
                  <option key={portal} value={portal}>{portal}</option>
                ))}
              </select>
            </div>

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
              <Label className="text-white mb-2 block">Select Roles</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 max-h-48 overflow-y-auto bg-slate-800 rounded-md">
                {selectedPortal && userRolesByPortal[selectedPortal]?.map(role => (
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
                ))}
                {(!selectedPortal || !userRolesByPortal[selectedPortal]) && (
                  <div className="text-gray-400 col-span-3 text-center p-2">
                    Select a portal to view available roles
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-white mb-2 block">Schedule Date</Label>
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
              <Label htmlFor="time" className="text-white">Schedule Time</Label>
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
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="secondary" onClick={() => setSelectedRoles([])}>
          Clear Selection
        </Button>
        <Button 
          onClick={handleSchedule} 
          disabled={isSubmitting || !date || !selectedPortal || selectedRoles.length === 0}
        >
          {isSubmitting ? 'Scheduling...' : 'Schedule Role Change'}
        </Button>
      </CardFooter>
    </Card>
  );
}
