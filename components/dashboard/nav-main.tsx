"use client";

import { type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const pathname = usePathname();

  // Function to check if a menu item is active
  const isActive = (url: string) => {
    // Exact match for dashboard home
    if (url === "/dashboard" && pathname === "/dashboard") {
      return true;
    }

    // For paths like /dashboard/organization, we need to check if the pathname starts with the URL
    // But we need to make sure we don't match /dashboard/organization-something when checking /dashboard/organization
    if (url !== "/dashboard") {
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
    }

    return false;
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Organization Switcher */}
        <OrganizationSwitcher />

        {/* Navigation Items */}
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  className={active ? "bg-primary/10 dark:bg-primary/20" : ""}
                  data-active={active}
                >
                  <Link href={item.url}>
                    {item.icon && (
                      <item.icon className={active ? "text-primary" : ""} />
                    )}
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
