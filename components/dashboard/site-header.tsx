import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SiteHeaderProps {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
}

export function SiteHeader({
  title,
  showBackButton = false,
  backUrl = "/dashboard",
  backLabel = "Voltar",
}: SiteHeaderProps) {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">{title}</h1>
        </div>

        {showBackButton && (
          <Button asChild variant="outline" size="sm" className="h-8 gap-1">
            <Link href={backUrl}>
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel}
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
