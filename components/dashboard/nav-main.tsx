"use client";

import { type LucideIcon, FileTextIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";

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

        {/* Report Generator Button */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Gerar Relatório"
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
            >
              <Link href="/dashboard/reports">
                <FileTextIcon className="text-primary-foreground" />
                <span className="font-medium text-primary-foreground">
                  Gerar Relatório
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
