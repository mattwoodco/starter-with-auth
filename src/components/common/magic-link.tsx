'use client';

import { signIn } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const MagicLink = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      await signIn.magicLink({
        email,
        callbackURL: '/',
      });
      toast.success('Magic link sent! Check your email');
      setEmail('');
    } catch {
      toast.error('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={handleMagicLink}>
      <div className="flex gap-2">
        <Input
          className="w-full"
          disabled={isLoading}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          value={email}
        />
        <Button disabled={isLoading} type="submit">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Send Link'
          )}
        </Button>
      </div>
    </form>
  );
};
