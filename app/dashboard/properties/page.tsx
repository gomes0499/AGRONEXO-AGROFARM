import { Metadata } from "next";
import { PropertyList } from "@/components/properties/property-list";
import { getProperties } from "@/lib/actions/property-actions";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { SiteHeader } from "@/components/dashboard/site-header";

export const metadata: Metadata = {
  title: "Propriedades Rurais | SR Consultoria",
  description:
    "Gerencie suas propriedades rurais, arrendamentos e benfeitorias.",
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams?: any;
}) {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();

  const session = await getSession();

  // Verificar se há parâmetro para inicializar preços
  if (searchParams?.init_prices === "true" && session?.organizationId) {
    // Importar a função para inicializar preços e chamá-la
    const { initializeDefaultCommodityPrices } = await import(
      "@/lib/actions/indicator-actions/commodity-price-actions"
    );

    try {
      await initializeDefaultCommodityPrices(session.organizationId);
    } catch (error) {
      console.error(`Erro ao inicializar preços: ${error}`);
    }
  }

  const properties = await getProperties(session?.organizationId);

  return (
    <>
      <SiteHeader title="Bens Imóveis" />
      <div className="flex flex-col gap-6 p-6">
        {/* Exibir alerta se os preços foram inicializados */}
        {searchParams?.init_prices === "true" && (
          <div className="bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 p-4 mb-2">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400 dark:text-green-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Preços de commodities inicializados com sucesso para seu
                  tenant!
                </p>
                <div className="mt-2 text-xs text-green-700 dark:text-green-400">
                  <p>
                    Agora você pode acessar o módulo de{" "}
                    <a
                      href="/dashboard/indicators"
                      className="font-bold underline"
                    >
                      Indicadores
                    </a>{" "}
                    para personalizar os preços ou voltar para o módulo de{" "}
                    <a
                      href="/dashboard/properties"
                      className="font-bold underline"
                    >
                      Arrendamentos
                    </a>{" "}
                    para continuar seu trabalho.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <PropertyList
          properties={properties}
          organizationId={session?.organizationId || ""}
        />
      </div>
    </>
  );
}
