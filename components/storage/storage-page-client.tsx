"use client";

import { StorageMetrics } from "./storage-metrics";
import { StorageListing } from "./storage-listing";

interface StoragePageClientProps {
  organizationId: string;
  projectionId?: string;
}

export function StoragePageClient({ 
  organizationId, 
  projectionId 
}: StoragePageClientProps) {
  return (
    <div className="container mx-auto p-6">
      {/* Metrics at the top */}
      <StorageMetrics organizationId={organizationId} />
      
      {/* Storage listing below */}
      <StorageListing 
        organizationId={organizationId} 
        projectionId={projectionId} 
      />
    </div>
  );
}