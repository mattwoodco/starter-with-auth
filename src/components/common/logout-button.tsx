'use client';

import { signOut } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';

export const LogoutButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      window.location.reload();
    } catch {
      toast.error('Failed to sign out. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Button disabled={isLoading} onClick={handleSignOut}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Logout'}
    </Button>
  );
};
