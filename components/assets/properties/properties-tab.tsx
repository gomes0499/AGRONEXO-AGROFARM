import { Suspense } from "react";
import { PropertiesListing } from "./properties-listing";
import { Skeleton } from "@/components/ui/skeleton";
import { getProperties } from "@/lib/actions/property-actions";

interface PropertiesTabProps {
  organizationId: string;
}

function PropertiesListingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="h-9 w-[250px]" />
          <Skeleton className="h-9 w-[120px]" />
        </div>
        <Skeleton className="h-9 w-[140px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export async function PropertiesTab({ organizationId }: PropertiesTabProps) {
  try {
    const properties = await getProperties(organizationId);

    return (
      <Suspense fallback={<PropertiesListingSkeleton />}>
        <PropertiesListing properties={properties || []} organizationId={organizationId} />
      </Suspense>
    );
  } catch (error) {
    console.error("Erro ao carregar propriedades:", error);
    
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erro ao carregar propriedades. Por favor, tente novamente.</p>
      </div>
    );
  }
}