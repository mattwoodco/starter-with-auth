'use client';

import { signIn } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';

export const LoginButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({ provider: 'google' });
    } catch {
      toast.error('Failed to sign in. Please try again.');
    }
  };

  return (
    <Button disabled={isLoading} onClick={handleSignIn}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        'Login with Google'
      )}
    </Button>
  );
};
