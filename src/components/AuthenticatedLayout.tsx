'use client'

import { usePrivy } from "@privy-io/react-auth";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useState } from "react";

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-gray-50 ${isSidebarOpen ? 'group sidebar-open' : ''}`}>
      <Sidebar onToggle={(isOpen) => setIsSidebarOpen(isOpen)} />
      <main className="flex-1 w-full transition-all duration-300 ease-in-out">
        {children}
        <div className="h-16 md:hidden" />
        <BottomNav />
      </main>
    </div>
  );
} 