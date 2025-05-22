
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserActionsProps {
  selectedCount: number;
  onExportClick: () => void;
  onManagerUpdateClick: () => void;
  onDeleteClick: () => void;
}

export const UserActions = ({
  selectedCount,
  onExportClick,
  onManagerUpdateClick,
  onDeleteClick,
}: UserActionsProps) => {
  const { toast } = useToast();

  const handleExportClick = () => {
    if (selectedCount === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to export.",
        variant: "destructive"
      });
      return;
    }
    onExportClick();
  };

  const handleManagerUpdateClick = () => {
    if (selectedCount === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to update manager.",
        variant: "destructive"
      });
      return;
    }
    onManagerUpdateClick();
  };

  const handleDeleteClick = () => {
    if (selectedCount === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to delete.",
        variant: "destructive"
      });
      return;
    }
    onDeleteClick();
  };

  return (
    <div className="flex gap-2 items-center bg-teleport-gray p-3 rounded-md border border-teleport-blue">
      <span className="text-white mr-2">
        {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <Button 
        size="sm" 
        variant="outline" 
        className="text-white border-teleport-blue hover:bg-teleport-blue/20"
        onClick={handleExportClick}
      >
        <Download className="mr-1 h-4 w-4" />
        Export
      </Button>
      <Button 
        size="sm" 
        variant="outline"
        className="text-white border-teleport-blue hover:bg-teleport-blue/20"
        onClick={handleManagerUpdateClick}
      >
        <UserCog className="mr-1 h-4 w-4" />
        Update Manager
      </Button>
      <Button 
        size="sm" 
        variant="destructive"
        onClick={handleDeleteClick}
      >
        <Trash2 className="mr-1 h-4 w-4" />
        Delete
      </Button>
    </div>
  );
};
