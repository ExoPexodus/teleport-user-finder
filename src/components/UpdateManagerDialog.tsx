
import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { User } from "@/types/user";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpdateManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  managers: string[];
  onUpdate: (userId: string, manager: string | null) => void;
}

export const UpdateManagerDialog = ({
  open,
  onOpenChange,
  user,
  managers,
  onUpdate
}: UpdateManagerDialogProps) => {
  const [inputValue, setInputValue] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // Reset input value when dialog opens with a user
  useEffect(() => {
    if (user && open) {
      setInputValue(user.manager || '');
    }
  }, [user, open]);

  const handleSubmit = () => {
    if (!user) return;
    
    // If input is empty, set manager to null
    const newManager = inputValue.trim() === '' ? null : inputValue.trim();
    onUpdate(user.id, newManager);
    onOpenChange(false);
  };

  // Unique managers list
  const uniqueManagers = Array.from(new Set(managers)).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-teleport-gray text-white border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            Update Manager for Selected User{user && user.name ? `(s)` : 's'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="manager" className="text-white">
              Manager
            </Label>
            
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between bg-teleport-darkgray text-white border-slate-700"
                >
                  {inputValue || "Select or enter manager name..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 bg-teleport-darkgray border-slate-700">
                <Command className="bg-teleport-darkgray">
                  <CommandInput 
                    placeholder="Search manager..." 
                    value={inputValue}
                    onValueChange={setInputValue}
                    className="text-white"
                  />
                  <CommandList>
                    <CommandEmpty className="text-white">No manager found.</CommandEmpty>
                    <CommandGroup>
                      {uniqueManagers.map((manager) => (
                        <CommandItem
                          key={manager}
                          value={manager}
                          onSelect={(currentValue) => {
                            setInputValue(currentValue);
                            setPopoverOpen(false);
                          }}
                          className="text-white hover:bg-slate-700"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              inputValue === manager ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {manager}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                <div className="p-2 border-t border-slate-700">
                  <p className="text-xs text-gray-400">
                    Enter new manager name or select from existing managers
                  </p>
                </div>
              </PopoverContent>
            </Popover>
            
            <Input
              id="managerInput"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter manager name..."
              className="bg-teleport-darkgray text-white border-slate-700"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-transparent text-white border-slate-700 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Update Manager
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
