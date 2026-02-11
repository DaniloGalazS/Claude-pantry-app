"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { PantryProvider } from "@/contexts/PantryContext";
import { Sidebar } from "@/components/shared/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <PantryProvider>
        <div className="min-h-screen bg-background bg-texture">
          <Sidebar />
          <main className="lg:pl-64">
            <div className="p-6 lg:p-8 max-w-7xl">{children}</div>
          </main>
        </div>
      </PantryProvider>
    </ProtectedRoute>
  );
}
