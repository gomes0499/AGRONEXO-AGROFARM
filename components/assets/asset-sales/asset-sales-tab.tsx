import { Suspense } from "react";
import { getAssetSales } from "@/lib/actions/asset-sales-actions";
import { AssetSaleListing } from "./asset-sale-listing";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetSalesTabProps {
  organizationId: string;
}

async function AssetSalesList({ organizationId }: { organizationId: string }) {
  const result = await getAssetSales(organizationId);

  if ("error" in result) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          Erro ao carregar vendas de ativos: {result.error}
        </p>
      </div>
    );
  }

  return (
    <AssetSaleListing
      initialAssetSales={result.data || []}
      organizationId={organizationId}
    />
  );
}

function AssetSalesListSkeleton() {
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

export function AssetSalesTab({ organizationId }: AssetSalesTabProps) {
  return (
    <Suspense fallback={<AssetSalesListSkeleton />}>
      <AssetSalesList organizationId={organizationId} />
    </Suspense>
  );
}
