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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="w-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-gray-50 ${isSidebarOpen ? 'md:ml-64' : ''}`}>
      {authenticated && <Sidebar onToggle={(isOpen) => setIsSidebarOpen(isOpen)} />}
      <main className="flex-1 w-full transition-all duration-300 ease-in-out">
        <div className="h-[calc(100vh-4rem)] bg-gray-50">
          {children}
        </div>
        <BottomNav />
      </main>
    </div>
  );
}