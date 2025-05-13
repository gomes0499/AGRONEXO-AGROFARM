import { Card } from "@/components/ui/card";
import { CommercialNav } from "@/components/commercial/commercial-nav";
import { SiteHeader } from "@/components/dashboard/site-header";

export default function CommercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Comercial" />
      <div className="p-4 md:p-6 pt-2 space-y-6">
        <div className="w-full">
          {/* <div className="flex items-center px-4 py-2 overflow-x-auto">
              <CommercialNav />
            </div> */}
          <div className="px-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
