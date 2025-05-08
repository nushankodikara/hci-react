'use client'; // Needed for potential client-side interactions or hooks later

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DraftingCompass } from 'lucide-react'; // Changed icon

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-50 p-8 selection:bg-orange-500 selection:text-white">
      <div className="absolute inset-0 -z-10 h-full w-full bg-slate-900 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="text-center max-w-3xl z-10">
        {/* Icon */}
        <DraftingCompass className="mx-auto h-20 w-20 text-orange-400 mb-8 animate-pulse" />

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-50 via-orange-300 to-orange-500 mb-6 pb-2">
          Craft Your Space: Precision Interior Design
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed">
          Experience the future of interior design. Our platform offers intuitive tools to bring your vision to life with unparalleled accuracy and stunning realism. From initial concept to final render, design without limits.
        </p>

        {/* Call to Action */}
        <div className="flex justify-center">
          <Button
            asChild
            size="lg"
            className="px-10 py-4 text-lg font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75"
          >
            <Link href="/dashboard">Begin Designing</Link>
          </Button>
        </div>
      </div>

      {/* Optional Footer */}
       <footer className="absolute bottom-6 text-center text-xs text-slate-500 z-10">
         © {new Date().getFullYear()} Precision Interiors. All rights reserved.
       </footer>
    </div>
  );
}
