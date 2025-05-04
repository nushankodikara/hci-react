'use client'; // Required for event handlers

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation'; // Use navigation hook
import Link from 'next/link'; // Ensure Link is imported
import { Loader2 } from 'lucide-react'; // For loading spinner

// Import shadcn/ui components
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

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        console.log('Login successful');
        router.push('/'); // Redirect to workspace
        router.refresh(); // Refresh page to potentially pick up new auth state
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login request failed:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      {/* Use Card component for the form container */}
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Designer Login</CardTitle>
          <CardDescription>Enter your username and password to access your designs</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="designer"
                  required
                  disabled={isLoading}
                  value={username}
                  onChange={handleUsernameChange}
                  autoComplete="username" // Add autocomplete attribute
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="password123"
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password" // Add autocomplete attribute
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 text-center font-medium">{error}</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4"> {/* Use flex-col and gap */}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Log in'
                )}
              </Button>
              <p className="text-center text-sm text-slate-600">
                Don't have an account?{' '}
                 <Button variant="link" asChild className="p-0 h-auto font-medium text-indigo-600 hover:text-indigo-500">
                    <Link href="/signup">Sign up here</Link>
                 </Button>
              </p>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
} 