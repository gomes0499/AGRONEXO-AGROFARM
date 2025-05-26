import { Suspense } from "react";
import { getInvestments } from "@/lib/actions/patrimonio-actions";
import { NewInvestmentButton } from "./new-investment-button";
import { InvestmentListing } from "./investment-listing";
import { Skeleton } from "@/components/ui/skeleton";

interface InvestmentsTabProps {
  organizationId: string;
}

async function InvestmentsList({ organizationId }: { organizationId: string }) {
  const result = await getInvestments(organizationId);

  if ("error" in result) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          Erro ao carregar investimentos: {result.error}
        </p>
      </div>
    );
  }

  return (
    <InvestmentListing
      initialInvestments={result.data || []}
      organizationId={organizationId}
    />
  );
}

function InvestmentsListSkeleton() {
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

export function InvestmentsTab({ organizationId }: InvestmentsTabProps) {
  return (
    <Suspense fallback={<InvestmentsListSkeleton />}>
      <InvestmentsList organizationId={organizationId} />
    </Suspense>
  );
}
