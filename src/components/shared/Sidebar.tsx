"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Package,
  ChefHat,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
  Leaf,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { PantrySelector } from "./PantrySelector";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

const navigation = [
  { name: "Inventario", href: "/inventory", icon: Package },
  { name: "Recetas", href: "/recipes", icon: ChefHat },
  { name: "Planificador", href: "/planner", icon: CalendarDays },
  { name: "Configuracion", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load persisted preference after mount to avoid hydration mismatch
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      // Dispatch event so layout can react
      window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: { collapsed: next } }));
      return next;
    });
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const userInitials =
    user?.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="bg-white/90 backdrop-blur-sm shadow-md border-border/50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-sidebar transform transition-all duration-300 ease-out lg:translate-x-0 overflow-hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          // Mobile: always full width drawer
          "max-lg:w-64"
        )}
        style={{
          // Desktop width controlled by collapsed state
          width: undefined,
        }}
      >
        <div
          className="flex flex-col h-full transition-all duration-300"
          style={{
            width: mounted && collapsed ? 68 : 256,
          }}
        >
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-white/10">
            <Link
              href="/inventory"
              className={cn(
                "flex items-center gap-3 group",
                collapsed && mounted && "justify-center"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/90 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              {(!collapsed || !mounted) && (
                <span className="font-display text-xl text-white tracking-wide">
                  Despensa
                </span>
              )}
            </Link>
          </div>

          {/* Pantry selector — hidden when collapsed */}
          {(!collapsed || !mounted) && <PantrySelector />}

          {/* Navigation */}
          <nav className="flex-1 px-2 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  title={collapsed && mounted ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-sidebar-foreground hover:bg-white/8 hover:text-white",
                    collapsed && mounted && "justify-center px-0"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-primary-foreground" : ""
                    )}
                  />
                  {(!collapsed || !mounted) && item.name}
                </Link>
              );
            })}
          </nav>

          {/* Decorative divider */}
          <div className="px-4 py-2">
            <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </div>

          {/* Toggle collapse button — desktop only */}
          <div className="hidden lg:block px-2 pb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              title={collapsed ? "Expandir menu" : "Colapsar menu"}
              className={cn(
                "text-sidebar-foreground hover:bg-white/8 hover:text-white rounded-lg h-9",
                collapsed && mounted ? "w-full" : "w-9"
              )}
            >
              {collapsed && mounted ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* User menu */}
          <div className="p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  title={collapsed && mounted ? (user?.displayName || "Usuario") : undefined}
                  className={cn(
                    "w-full gap-3 text-sidebar-foreground hover:bg-white/8 hover:text-white rounded-lg",
                    collapsed && mounted
                      ? "justify-center px-0 py-3"
                      : "justify-start px-3 py-6"
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {(!collapsed || !mounted) && (
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium text-white">
                        {user?.displayName || "Usuario"}
                      </span>
                      <span className="text-xs text-sidebar-muted truncate max-w-[140px]">
                        {user?.email}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuracion
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}
