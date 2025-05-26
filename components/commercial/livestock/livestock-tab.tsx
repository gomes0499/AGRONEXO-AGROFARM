import { Suspense } from "react";
import { getLivestockSales } from "@/lib/actions/commercial-actions";
import { getHarvests } from "@/lib/actions/production-actions";
import { getProperties } from "@/lib/actions/property-actions";
import { LivestockSalesList } from "./livestock-sales-list";
import { Skeleton } from "@/components/ui/skeleton";

interface LivestockTabProps {
  organizationId: string;
}

async function LivestockListContent({ organizationId }: { organizationId: string }) {
  const [
    livestockSalesResponse,
    propertiesResponse,
    harvestsResponse,
  ] = await Promise.all([
    getLivestockSales(organizationId).catch((err) => {
      console.error("Erro ao buscar vendas pecuárias:", err);
      return [];
    }),
    getProperties(organizationId).catch((err) => {
      console.error("Erro ao buscar propriedades:", err);
      return [];
    }),
    getHarvests(organizationId).catch((err) => {
      console.error("Erro ao buscar safras:", err);
      return [];
    }),
  ]);

  const livestockSales = Array.isArray(livestockSalesResponse) ? livestockSalesResponse : [];
  const properties = Array.isArray(propertiesResponse) ? propertiesResponse : [];
  const harvests = Array.isArray(harvestsResponse) ? harvestsResponse : [];

  return (
    <LivestockSalesList
      initialLivestockSales={livestockSales}
      organizationId={organizationId}
      properties={properties}
      harvests={harvests}
    />
  );
}

function LivestockListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function LivestockTab({ organizationId }: LivestockTabProps) {
  return (
    <Suspense fallback={<LivestockListSkeleton />}>
      <LivestockListContent organizationId={organizationId} />
    </Suspense>
  );
}