"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, MapPin, LogOut, Sun, Moon } from 'lucide-react';

import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { flatNavigation } from '@/lib/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';


export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  
  // Find current route name
  const currentRoute = flatNavigation.find(
    (item) => item.href === pathname || (item.href !== '/' && pathname?.startsWith(item.href))
  );
  
  const title = currentRoute?.name || "Inventory System";

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] shrink-0">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] hidden sm:block mr-6">
          {title}
        </h2>
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <Input 
            type="search" 
            placeholder="Search anywhere..." 
            className="pl-9 h-9 bg-[var(--color-subtle)] border-transparent focus:bg-[var(--color-surface)] text-sm rounded-full" 
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Branch Indicator Mockup */}
        <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-[var(--color-subtle)] border border-[var(--color-border-subtle)] text-sm">
          <MapPin className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] mr-1.5" />
          <span className="font-medium text-[var(--color-text-secondary)] mr-2">Downtown</span>
          <Badge variant="success" className="h-5 px-1.5 text-[10px]">BR-01</Badge>
        </div>

        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full" onClick={toggleTheme}>
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-[var(--color-text-secondary)]" />
          ) : (
            <Sun className="h-5 w-5 text-[var(--color-text-secondary)]" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
          <Bell className="h-5 w-5 text-[var(--color-text-secondary)]" />
          <span className="sr-only">Notifications</span>
        </Button>

        
        <div className="h-6 w-px bg-[var(--color-border-subtle)] mx-1 hidden sm:block"></div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar fallback={user ? user.full_name.charAt(0).toUpperCase() : "U"} className="h-8 w-8 text-xs bg-[var(--color-green-soft)] text-[var(--color-green-text)]" />
            <div className="hidden lg:flex flex-col text-left leading-none">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{user?.full_name || "Loading..."}</span>
              <span className="text-[11px] text-[var(--color-text-tertiary)] capitalize">{user?.role_name || ""}</span>
            </div>
          </div>
          <Button onClick={logout} variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-red-text)] hover:bg-[var(--color-red-soft)]">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
