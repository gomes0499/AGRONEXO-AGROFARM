import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye } from "lucide-react";

interface StatsGroupProps {
  title: string;
  children: ReactNode;
  viewMoreUrl?: string;
  className?: string;
}

export function StatsGroup({ title, children, viewMoreUrl, className = "" }: StatsGroupProps) {
  return (
    <div className={`mt-8 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        {viewMoreUrl && (
          <Button asChild variant="outline" size="sm">
            <Link href={viewMoreUrl}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </Link>
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}