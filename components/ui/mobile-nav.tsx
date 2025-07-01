"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, DollarSign, Building2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Início",
    icon: Home,
  },
  {
    href: "/dashboard/production",
    label: "Produção",
    icon: TrendingUp,
  },
  {
    href: "/dashboard/financial",
    label: "Financeiro",
    icon: DollarSign,
  },
  {
    href: "/dashboard/assets",
    label: "Patrimônio",
    icon: Building2,
  },
  {
    href: "/dashboard/indicators",
    label: "Indicadores",
    icon: BarChart3,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-2 px-1",
                "transition-colors",
                "hover:bg-muted/50",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                "relative"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 mb-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Helper component to add padding to content when mobile nav is present
export function MobileNavPadding({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className={cn(isMobile && "pb-16")}>
      {children}
    </div>
  );
}