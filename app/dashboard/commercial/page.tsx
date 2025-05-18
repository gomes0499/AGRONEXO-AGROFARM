import { Metadata } from "next";
import { getOrganizationId } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CommercialErrorBoundary from "@/components/commercial/common/commercial-error-boundary";

// Usamos o import dinâmico como variável sem o 'dynamic' do next
const CommercialClient = async () => {
  const CommercialClientPage = (await import("./commercial-client")).default;
  return CommercialClientPage;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Comercial | SR Consultoria",
  description: "Gestão comercial de commodities e produtos agrícolas",
};

export default async function CommercialDashboardPage() {
  await requireSuperAdmin();
  const organizationId = await getOrganizationId();
  const ClientComponent = await CommercialClient();

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
          <CommercialErrorBoundary>
            <ClientComponent organizationId={organizationId} />
          </CommercialErrorBoundary>
        </div>
      </div>
    </Suspense>
  );
}
