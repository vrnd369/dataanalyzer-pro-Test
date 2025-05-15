import React from 'react';
//import { useAuth } from '@/hooks/useAuth';

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {

  return (
    <main
      className="
        w-full
        min-h-screen
        bg-white
        flex-1
        overflow-auto
        relative
        transition-all
        duration-300
      "
    >
      {children}
    </main>
  );
}