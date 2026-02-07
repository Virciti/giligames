'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Trophy, BookOpen, Settings } from 'lucide-react';

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      {!isHome && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-blue/90 backdrop-blur-sm text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-2 flex justify-around items-center">
            <NavLink href="/" icon={Home} label="Home" />
            <NavLink href="/stadium" icon={Trophy} label="Play" />
            <NavLink href="/learn" icon={BookOpen} label="Learn" />
            <NavLink href="/settings" icon={Settings} label="Settings" />
          </div>
        </nav>
      )}
      <main className={`${isHome ? '' : 'pt-24 pb-8 px-4'} min-h-screen`}>
        {children}
      </main>
    </>
  );
}
