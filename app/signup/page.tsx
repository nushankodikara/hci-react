'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
    }
    
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Account created successfully! Redirecting to login...');
        setTimeout(() => {
             router.push('/login');
        }, 2000); 
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup request failed:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value);
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);
  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 selection:bg-orange-500 selection:text-white">
      <div className="absolute inset-0 -z-10 h-full w-full bg-slate-900 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]\"></div>
      
      <Card className="w-full max-w-md shadow-2xl bg-slate-800 border-slate-700 z-10">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-slate-50">Create Designer Account</CardTitle>
          <CardDescription className="text-slate-400">Join our platform to start designing.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-400">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                disabled={isLoading || !!successMessage}
                value={username}
                onChange={handleUsernameChange}
                placeholder="Choose a username"
                className="bg-slate-700 border-slate-600 text-slate-50 placeholder:text-slate-500 focus:ring-orange-500"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-400">Password (min 8 chars)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                disabled={isLoading || !!successMessage}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter password"
                className="bg-slate-700 border-slate-600 text-slate-50 placeholder:text-slate-500 focus:ring-orange-500"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-400">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                disabled={isLoading || !!successMessage}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm password"
                className="bg-slate-700 border-slate-600 text-slate-50 placeholder:text-slate-500 focus:ring-orange-500"
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 text-center font-medium">{error}</p>
            )}
            {successMessage && (
              <p className="text-sm text-green-500 text-center font-medium">{successMessage}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-8">
            <Button
              type="submit"
              disabled={isLoading || !!successMessage}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white focus:ring-orange-500 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Sign Up'
              )}
            </Button>
            <p className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Button variant="link" asChild className="p-0 h-auto font-medium text-orange-500 hover:text-orange-400">
                <Link href="/login">Log in here</Link>
              </Button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 