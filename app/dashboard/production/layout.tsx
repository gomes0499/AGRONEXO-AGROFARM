import { Metadata } from "next";
import { SiteHeader } from "@/components/dashboard/site-header";

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
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
