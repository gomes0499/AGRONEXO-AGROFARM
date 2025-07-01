import { getSession, getOrganizationId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchAssetsPageData } from "@/lib/actions/assets/unified-assets-actions";
import { getProperties, getImprovements } from "@/lib/actions/property-actions";
import { getEquipments } from "@/lib/actions/patrimonio-actions";
import { AssetsPageClient } from "@/components/assets/assets-page-client";

export default async function AssetsPage() {
  const session = await getSession();
  const organizationId = await getOrganizationId();

  if (!session?.organization || !session?.organizationId) {
    redirect("/auth/login");
  }

  // Fetch all assets data with the unified action
  const assetsData = await fetchAssetsPageData(organizationId);

  // Fetch additional data that's not in the unified action yet
  const [properties, improvements, equipmentResult] = await Promise.all([
    getProperties(organizationId).catch((err) => {
      console.error("Erro ao buscar propriedades:", err);
      return [];
    }),
    getImprovements(organizationId).catch((err) => {
      console.error("Erro ao buscar benfeitorias:", err);
      return [];
    }),
    getEquipments(organizationId).catch((err) => {
      console.error("Erro ao buscar lista de equipamentos:", err);
      return { data: [] };
    }),
  ]);

  // Extract equipment data
  const equipmentList = Array.isArray(equipmentResult)
    ? equipmentResult
    : "data" in equipmentResult
      ? equipmentResult.data
      : [];

  return (
    <AssetsPageClient
      organizationId={organizationId}
      properties={properties}
      improvements={improvements}
      equipmentList={equipmentList}
      initialData={assetsData}
    />
  );
}
