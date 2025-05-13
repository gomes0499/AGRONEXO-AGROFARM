import { Metadata } from "next";
import { SiteHeader } from "@/components/dashboard/site-header";
import { ProductionNavClient } from "@/components/production/production-nav-client";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Produção | SR Consultoria",
  description: "Gerenciamento de produção agrícola e pecuária",
};

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Produção" />
      <div className="p-4 md:p-6 pt-2 space-y-4">
        <div className="w-full">
          <div className="mb-2">
            <ProductionNavClient>
              {children}
            </ProductionNavClient>
          </div>
        </div>
      </div>
    </div>
  );
}
