import { Suspense } from "react";
import { getEquipments } from "@/lib/actions/patrimonio-actions";
import { NewEquipmentButton } from "./new-equipment-button";
import { EquipmentListing } from "./equipment-listing";
import { Skeleton } from "@/components/ui/skeleton";

interface EquipmentsTabProps {
  organizationId: string;
}

async function EquipmentsList({ organizationId }: { organizationId: string }) {
  const result = await getEquipments(organizationId);

  if ("error" in result) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          Erro ao carregar equipamentos: {result.error}
        </p>
      </div>
    );
  }

  return (
    <EquipmentListing
      initialEquipments={result.data || []}
      organizationId={organizationId}
    />
  );
}

function EquipmentsListSkeleton() {
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

export function EquipmentsTab({ organizationId }: EquipmentsTabProps) {
  return (
    <Suspense fallback={<EquipmentsListSkeleton />}>
      <EquipmentsList organizationId={organizationId} />
    </Suspense>
  );
}
