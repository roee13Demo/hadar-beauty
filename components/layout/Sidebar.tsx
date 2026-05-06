"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Package,
  Receipt,
  RefreshCcw,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: he.nav.dashboard, icon: LayoutDashboard },
  { href: "/services", label: he.nav.services, icon: Sparkles },
  { href: "/inventory", label: he.nav.inventory, icon: Package },
  { href: "/transactions", label: he.nav.transactions, icon: Receipt },
  { href: "/recurring", label: he.nav.recurring, icon: RefreshCcw },
  { href: "/analytics", label: he.nav.analytics, icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-s border-border/60 bg-card md:flex">
      <div className="flex flex-col gap-1 px-6 py-7">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight">
              {he.app.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {he.app.tagline}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-border/60 px-6 py-4 text-xs text-muted-foreground">
        <span>מערכת מקומית</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
