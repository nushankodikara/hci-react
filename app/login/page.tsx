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
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 selection:bg-orange-500 selection:text-white">
      {/* Background Grid */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-slate-900 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      {/* Use Card component for the form container */}
      <Card className="w-full max-w-md shadow-2xl bg-slate-800 border-slate-700 z-10">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-slate-50">Designer Login</CardTitle>
          <CardDescription className="text-slate-400">Enter your username and password to access your designs</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-400">Username</Label>
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
                  className="bg-slate-700 border-slate-600 text-slate-50 placeholder:text-slate-500 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-400">Password</Label>
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
                  className="bg-slate-700 border-slate-600 text-slate-50 placeholder:text-slate-500 focus:ring-orange-500"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 text-center font-medium">{error}</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4"> {/* Use flex-col and gap */}
              <Button type="submit" disabled={isLoading} className="w-full mt-8 bg-orange-600 hover:bg-orange-500 text-white focus:ring-orange-500">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Log in'
                )}
              </Button>
              <p className="text-center text-sm text-slate-400">
                Don't have an account?{' '}
                 <Button variant="link" asChild className="p-0 h-auto font-medium text-orange-500 hover:text-orange-400">
                    <Link href="/signup">Sign up here</Link>
                 </Button>
              </p>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
} 