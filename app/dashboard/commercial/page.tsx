import { Metadata } from "next";
import { CommercialUnderConstruction } from "@/components/commercial/commercial-under-construction";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Comercial | SR Consultoria",
  description: "Gestão comercial de commodities e produtos agrícolas",
};

export default async function CommercialDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="container p-4">
          <CommercialUnderConstruction />
        </div>
      </div>
    </Suspense>
  );
}
