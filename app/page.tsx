'use client'; // Needed for potential client-side interactions or hooks later

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Construction } from 'lucide-react'; // Or another relevant icon

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-8">
      <div className="text-center max-w-2xl">
        {/* Icon */}
        <Construction className="mx-auto h-16 w-16 text-indigo-600 mb-6" />

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
          Welcome to Room Designer Pro
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-slate-600 mb-8">
          Visualize, design, and perfect your room layouts with ease. Upload models, arrange furniture, and see your ideas come to life in 2D and 3D.
        </p>

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="px-8 py-3 text-lg">
            <Link href="/dashboard">Get Started</Link>
          </Button>
           {/* Optional: Add a secondary button, e.g., Learn More */}
          {/* 
          <Button asChild variant="outline" size="lg" className="px-8 py-3 text-lg">
             <Link href="/features">Learn More</Link> 
          </Button>
          */}
        </div>
      </div>

      {/* Optional Footer */}
       <footer className="absolute bottom-4 text-center text-sm text-slate-500">
         © {new Date().getFullYear()} Room Designer Pro. All rights reserved.
       </footer>
    </div>
  );
}
