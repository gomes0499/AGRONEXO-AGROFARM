import { Suspense } from "react";
import { getLandAcquisitions } from "@/lib/actions/land-acquisition-actions";
import { LandPlanListing } from "./land-plan-listing";
import { Skeleton } from "@/components/ui/skeleton";

interface LandPlansTabProps {
  organizationId: string;
}

async function LandPlansList({ organizationId }: { organizationId: string }) {
  const result = await getLandAcquisitions(organizationId);

  if ('error' in result) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          Erro ao carregar planos de aquisição: {result.error}
        </p>
      </div>
    );
  }

  return (
    <LandPlanListing
      initialLandPlans={result.data || []}
      organizationId={organizationId}
    />
  );
}

function LandPlansListSkeleton() {
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

export function LandPlansTab({ organizationId }: LandPlansTabProps) {
  return (
    <Suspense fallback={<LandPlansListSkeleton />}>
      <LandPlansList organizationId={organizationId} />
    </Suspense>
  );
}
