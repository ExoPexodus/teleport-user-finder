
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  
  // Sample settings (these would be connected to real functionality in a full implementation)
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);
  const [sessionTimeout, setSessionTimeout] = React.useState(60);
  
  return (
    <div className="container px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-teleport-gray border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Application Settings</CardTitle>
            <CardDescription className="text-gray-300">
              Configure your application preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Dark Mode</Label>
                <p className="text-xs text-gray-400">Enable dark theme for the application</p>
              </div>
              <Switch 
                checked={darkMode} 
                onCheckedChange={setDarkMode}
                className="data-[state=checked]:bg-teleport-blue"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Email Notifications</Label>
                <p className="text-xs text-gray-400">Receive email notifications about role changes</p>
              </div>
              <Switch 
                checked={emailNotifications} 
                onCheckedChange={setEmailNotifications}
                className="data-[state=checked]:bg-teleport-blue"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Session Timeout (minutes)</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teleport-blue"
                />
                <span className="bg-teleport-blue text-white px-2 py-1 rounded-md w-12 text-center">
                  {sessionTimeout}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Your session will timeout after {sessionTimeout} minutes of inactivity
              </p>
            </div>
          </CardContent>
        </Card>
        
        {user && user.roles?.includes('admin') && (
          <Card className="bg-teleport-gray border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Admin Settings</CardTitle>
              <CardDescription className="text-gray-300">
                Additional settings for administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Debug Mode</Label>
                  <p className="text-xs text-gray-400">Show detailed error information</p>
                </div>
                <Switch className="data-[state=checked]:bg-teleport-blue" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Advanced Logging</Label>
                  <p className="text-xs text-gray-400">Enable extended logging for troubleshooting</p>
                </div>
                <Switch className="data-[state=checked]:bg-teleport-blue" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Settings;
