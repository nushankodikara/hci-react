import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Recommended font for shadcn/ui
// import { Geist_Sans } from "geist/font/sans";
// import { Geist_Mono } from "geist/font/mono";
import "./globals.css";
import { DesignProvider } from "@/context/DesignContext";
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider

// Setup font
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" }); // Define font variable

export const metadata: Metadata = {
  title: "Room Designer Pro", // Updated Title
  description: "Visualize and design your room layouts", // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Add suppressHydrationWarning for next-themes
    <html lang="en" suppressHydrationWarning> 
      <head>
         {/* Removed Tailwind CDN script */}
      </head>
      {/* Apply font variable to body */}
      <body className={inter.className}> 
        {/* Wrap everything in ThemeProvider */}
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          {/* DesignProvider wraps the main application content */}
          <DesignProvider>
            {children}
          </DesignProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
