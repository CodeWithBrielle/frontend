"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store } from 'lucide-react';
import { navigationGroups } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex flex-col h-screen sticky top-0 shrink-0">
      <div className="flex h-16 items-center px-6 border-b border-[var(--color-border-subtle)] shrink-0">
        <Store className="h-6 w-6 text-[var(--color-accent)] mr-2" />
        <span className="font-semibold text-lg tracking-tight">Fresh<span className="text-[var(--color-accent)]">Stock</span></span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-thin">
        <div className="space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                {group.title}
              </h3>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors group",
                        isActive 
                          ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]" 
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                      )}
                    >
                      <Icon className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors", isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]")} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
