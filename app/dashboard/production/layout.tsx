import { Metadata } from "next";
import { SiteHeader } from "@/components/dashboard/site-header";
import { Card } from "@/components/ui/card";
import { ProductionNav } from "@/components/production/production-nav";

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
      <div className="p-4 md:p-6 pt-2 space-y-6">
        <Card>
          <div className="w-full">
            <div className="flex items-center px-4 py-2 overflow-x-auto">
              <ProductionNav />
            </div>
            <div className="px-0">
              {children}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
