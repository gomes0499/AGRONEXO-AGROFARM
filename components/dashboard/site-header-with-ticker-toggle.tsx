"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/dashboard/site-header";
import { TickerVisibilityToggle } from "@/components/dashboard/ticker-visibility-toggle";

interface SiteHeaderWithTickerToggleProps {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
  rightContent?: React.ReactNode;
  onTickerVisibilityChange?: (visibility: { market: boolean; weather: boolean; news: boolean }) => void;
}

export function SiteHeaderWithTickerToggle({
  title,
  showBackButton = false,
  backUrl = "/dashboard",
  backLabel = "Voltar",
  rightContent,
  onTickerVisibilityChange,
}: SiteHeaderWithTickerToggleProps) {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SiteHeader title={title} />
        </div>

        <div className="flex items-center gap-2">
          <TickerVisibilityToggle onVisibilityChange={onTickerVisibilityChange} />
          {rightContent && (
            <>
              <div className="h-4 w-px bg-border" />
              {rightContent}
            </>
          )}
          {showBackButton && (
            <Button asChild variant="outline" size="sm" className="h-8 gap-1">
              <Link href={backUrl}>
                <ArrowLeft className="h-3.5 w-3.5" />
                {backLabel}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}