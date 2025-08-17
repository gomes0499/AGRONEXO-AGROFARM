import { SiteHeader } from "@/components/dashboard/site-header";
import { StoragePageClient } from "@/components/storage/storage-page-client";
import { getOrganizationId } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";

export default async function StoragePage({
  searchParams,
}: {
  searchParams: Promise<{ projection?: string }>;
}) {
  await requireSuperAdmin();
  const organizationId = await getOrganizationId();
  const params = await searchParams;
  const projectionId = params.projection;

  return (
    <div className="flex flex-col h-full">
      <SiteHeader title="Armazenagem" />
      <main className="flex-1 overflow-auto">
        <StoragePageClient 
          organizationId={organizationId} 
          projectionId={projectionId}
        />
      </main>
    </div>
  );
}