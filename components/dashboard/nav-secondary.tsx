"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isThemeToggle?: boolean;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  // Function to check if a menu item is active
  const isActive = (url: string) => {
    // If pathname exactly matches url, it's active
    if (pathname === url) {
      return true;
    }

    // If pathname starts with url and the next character is a slash or nothing, it's active
    // This handles nested routes correctly
    if (
      pathname.startsWith(url) &&
      (pathname.length === url.length || pathname.charAt(url.length) === "/")
    ) {
      return true;
    }

    return false;
  };

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);

            // Special handling for theme toggle
            if (item.isThemeToggle) {
              return (
                <SidebarMenuItem key={item.title}>
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.title}</span>
                    </div>
                    <ThemeToggle />
                  </div>
                </SidebarMenuItem>
              );
            }
            
            // Standard menu item
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={active ? "bg-primary/10 dark:bg-primary/20" : ""}
                  data-active={active}
                >
                  <Link href={item.url}>
                    <item.icon className={active ? "text-primary" : ""} />
                    <span className={active ? "font-medium text-primary" : ""}>
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
