import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Home, Trophy, BookOpen, Settings } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GiiGames - Monster Truck Learning Adventure",
  description: "Educational monster truck game for young children ages 4-7",
};

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 p-3 min-w-[64px] min-h-[64px] rounded-2xl hover:bg-white/20 transition-colors"
    >
      <Icon className="w-8 h-8" />
      <span className="text-xs font-bold">{label}</span>
    </Link>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-b from-sky-400 to-sky-600`}
      >
        {/* Main Navigation - Top bar with large touch targets */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-blue/90 backdrop-blur-sm text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-2 flex justify-around items-center">
            <NavLink href="/" icon={Home} label="Home" />
            <NavLink href="/stadium" icon={Trophy} label="Play" />
            <NavLink href="/learn" icon={BookOpen} label="Learn" />
            <NavLink href="/settings" icon={Settings} label="Settings" />
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="pt-24 pb-8 px-4 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
