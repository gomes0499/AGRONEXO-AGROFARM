import { Suspense } from "react";
import { getSeedSales } from "@/lib/actions/commercial-actions";
import { getSafras, getCultures } from "@/lib/actions/production-actions";
import { getProperties } from "@/lib/actions/property-actions";
import { SeedSalesList } from "./seed-sales-list";
import { Skeleton } from "@/components/ui/skeleton";

interface SeedsTabProps {
  organizationId: string;
}

async function SeedsListContent({ organizationId }: { organizationId: string }) {
  const [
    seedSalesResponse,
    propertiesResponse,
    harvestsResponse,
    culturesResponse,
  ] = await Promise.all([
    getSeedSales(organizationId).catch((err) => {
      console.error("Erro ao buscar vendas de sementes:", err);
      return [];
    }),
    getProperties(organizationId).catch((err) => {
      console.error("Erro ao buscar propriedades:", err);
      return [];
    }),
    getSafras(organizationId).catch((err) => {
      console.error("Erro ao buscar safras:", err);
      return [];
    }),
    getCultures(organizationId).catch((err) => {
      console.error("Erro ao buscar culturas:", err);
      return [];
    }),
  ]);

  const seedSales = Array.isArray(seedSalesResponse) ? seedSalesResponse : [];
  const properties = Array.isArray(propertiesResponse) ? propertiesResponse : [];
  const harvests = Array.isArray(harvestsResponse) ? harvestsResponse : [];
  const cultures = Array.isArray(culturesResponse) ? culturesResponse : [];

  return (
    <SeedSalesList
      initialSeedSales={seedSales}
      cultures={cultures}
      properties={properties}
      organizationId={organizationId}
      harvests={harvests}
    />
  );
}

function SeedsListSkeleton() {
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

export function SeedsTab({ organizationId }: SeedsTabProps) {
  return (
    <Suspense fallback={<SeedsListSkeleton />}>
      <SeedsListContent organizationId={organizationId} />
    </Suspense>
  );
}