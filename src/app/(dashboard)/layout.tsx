"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { PantryProvider } from "@/contexts/PantryContext";
import { Sidebar } from "@/components/shared/Sidebar";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
    setMounted(true);

    const handleToggle = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setCollapsed(detail.collapsed);
    };
    window.addEventListener("sidebar-toggle", handleToggle);
    return () => window.removeEventListener("sidebar-toggle", handleToggle);
  }, []);

  return (
    <ProtectedRoute>
      <PantryProvider>
        <div className="min-h-screen bg-background bg-texture">
          <Sidebar />
          <main
            className={cn(
              "transition-all duration-300",
              mounted && collapsed ? "lg:pl-[68px]" : "lg:pl-64"
            )}
          >
            <div className="p-6 lg:p-8 max-w-7xl">{children}</div>
          </main>
        </div>
      </PantryProvider>
    </ProtectedRoute>
  );
}
