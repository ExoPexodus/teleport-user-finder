
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/Loader';
import { RefreshCw, Save, User } from 'lucide-react';

const Profile = () => {
  const { user, refreshUserProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  if (!user) {
    return <Loader />;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUserProfile();
      toast({
        title: "Profile Refreshed",
        description: "Your profile information has been updated."
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh your profile information.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">User Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-teleport-gray border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">User Information</CardTitle>
            <CardDescription className="text-gray-300">
              Your user information from Keycloak
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-teleport-blue p-3 rounded-full">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-lg text-white font-medium">{user.name || 'N/A'}</p>
                <p className="text-sm text-gray-300">{user.email || 'No email provided'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Username</Label>
              <Input 
                value={user.username} 
                readOnly
                className="bg-slate-800 text-white border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Full Name</Label>
              <Input 
                value={user.name || ''} 
                readOnly
                className="bg-slate-800 text-white border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Email</Label>
              <Input 
                value={user.email || ''} 
                readOnly
                className="bg-slate-800 text-white border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Given Name</Label>
              <Input 
                value={user.givenName || ''} 
                readOnly
                className="bg-slate-800 text-white border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Family Name</Label>
              <Input 
                value={user.familyName || ''} 
                readOnly
                className="bg-slate-800 text-white border-slate-700"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="w-full"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Profile
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="bg-teleport-gray border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Roles & Permissions</CardTitle>
            <CardDescription className="text-gray-300">
              Your assigned roles in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label className="text-white">Your Roles</Label>
              <div className="flex flex-wrap gap-2">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role, index) => (
                    <Badge key={index} className="bg-teleport-blue text-white">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-300">No roles assigned</p>
                )}
              </div>
              
              <div className="mt-6 space-y-2">
                <h3 className="text-lg text-white font-medium">Access Level</h3>
                <div className="p-4 rounded-md bg-slate-800 border border-slate-700">
                  {user.roles?.includes('admin') ? (
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-green-300">Admin Access</p>
                    </div>
                  ) : user.roles?.includes('limited_user') ? (
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <p className="text-yellow-300">Limited Access</p>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <p className="text-red-300">Basic Access</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
