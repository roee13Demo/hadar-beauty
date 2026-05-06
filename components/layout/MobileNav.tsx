"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Package,
  Receipt,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

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
  { href: "/analytics", label: he.nav.analytics, icon: BarChart3 },
];

/**
 * Fixed bottom navigation bar shown only on mobile (hidden on md+).
 * Five tabs mirroring the desktop sidebar, icons + short labels.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border/60 bg-card md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        // Shorten labels for the narrow mobile bar
        const shortLabel = shortLabelMap[item.href] ?? item.label;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1.5 py-4 text-[10px] font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span>{shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const shortLabelMap: Record<string, string> = {
  "/": "סקירה",
  "/services": "טיפולים",
  "/inventory": "מלאי",
  "/transactions": "עסקאות",
  "/analytics": "דוחות",
};
