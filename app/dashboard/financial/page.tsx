import { Metadata } from "next";
import { Suspense } from "react";
import { getOrganizationId, getSession } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Import our new financial module components
import { DividasBancariasListing } from "@/components/financial/dividas-bancarias/dividas-bancarias-listing";
import { DividasTerrasListing } from "@/components/financial/dividas-terras/dividas-terras-listing";
import { DividasFornecedoresListing } from "@/components/financial/dividas-fornecedores/dividas-fornecedores-listing";
import { CaixaDisponibilidadesListing } from "@/components/financial/caixa-disponibilidades/caixa-disponibilidades-listing";
import { FinanceirasListing } from "@/components/financial/financeiras/financeiras-listing";
import { OutrasDespesasListing } from "@/components/financial/outras-despesas/outras-despesas-listing";

// Import our new actions
import { getDividasBancarias } from "@/lib/actions/financial-actions/dividas-bancarias";
import { getDividasTerras } from "@/lib/actions/financial-actions/dividas-terras";
import { getDividasFornecedores } from "@/lib/actions/financial-actions/dividas-fornecedores";
import { getCaixaDisponibilidades } from "@/lib/actions/financial-actions/caixa-disponibilidades";
import { getFinanceiras } from "@/lib/actions/financial-actions/financeiras";
import { getOutrasDespesas } from "@/lib/actions/financial-actions/outras-despesas";

export const metadata: Metadata = {
  title: "Financeiro | SR Consultoria",
  description: "Gestão financeira e controle de dívidas e disponibilidades",
};

export default async function FinancialPage() {
  const session = await getSession();
  const organizationId = await getOrganizationId();

  if (!session?.organization || !session?.organizationId) {
    throw new Error("Organização não encontrada ou usuário não autenticado");
  }

  const organization = {
    id: session.organizationId,
    nome: session.organization.nome,
  };

  // Fetch data from our new tables with error handling
  const [
    dividasBancarias,
    dividasTerras,
    dividasFornecedores,
    caixaDisponibilidades,
    financeiras,
    outrasDespesas,
  ] = await Promise.all([
    getDividasBancarias(organizationId).catch((err) => {
      console.error("Erro ao buscar dívidas bancárias:", err);
      return [];
    }),
    getDividasTerras(organizationId).catch((err) => {
      console.error("Erro ao buscar dívidas de terras:", err);
      return [];
    }),
    getDividasFornecedores(organizationId).catch((err) => {
      console.error("Erro ao buscar dívidas de fornecedores:", err);
      return [];
    }),
    getCaixaDisponibilidades(organizationId).catch((err) => {
      console.error("Erro ao buscar caixa e disponibilidades:", err);
      return [];
    }),
    getFinanceiras(organizationId).catch((err) => {
      console.error("Erro ao buscar operações financeiras:", err);
      return [];
    }),
    getOutrasDespesas(organizationId).catch((err) => {
      console.error("Erro ao buscar outras despesas:", err);
      return [];
    }),
  ]);

  // Calculate totals for outras_despesas
  const outrasDespesasWithTotal = outrasDespesas.map((item) => {
    const valores = item.valores_por_safra || {};
    let total = 0;

    if (typeof valores === "string") {
      try {
        const parsedValues = JSON.parse(valores);
        total = Object.values(parsedValues).reduce<number>(
          (sum, value) => sum + (Number(value) || 0),
          0
        );
      } catch (e) {
        console.error("Erro ao processar valores_por_safra:", e);
      }
    } else {
      total = Object.values(valores).reduce<number>(
        (sum, value) => sum + (Number(value) || 0),
        0
      );
    }

    return {
      ...item,
      total,
    };
  });

  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="dividas-bancarias">
        <div className="bg-muted/50 border-b">
          <div className="container max-w-full px-4 md:px-6 py-2">
            <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start w-full">
              <TabsTrigger
                value="dividas-bancarias"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Dívidas Bancárias
              </TabsTrigger>
              <TabsTrigger
                value="dividas-terras"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Dívidas Terras
              </TabsTrigger>
              <TabsTrigger
                value="dividas-fornecedores"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Dívidas Fornecedores
              </TabsTrigger>
              <TabsTrigger
                value="caixa-disponibilidades"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Caixa e Disponibilidades
              </TabsTrigger>
              <TabsTrigger
                value="financeiras"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Operações Financeiras
              </TabsTrigger>
              <TabsTrigger
                value="outras-despesas"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Outras Despesas
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <TabsContent value="dividas-bancarias" className="space-y-4">
              <DividasBancariasListing
                organization={organization}
                initialDividasBancarias={dividasBancarias}
              />
            </TabsContent>

            <TabsContent value="dividas-terras" className="space-y-4">
              <DividasTerrasListing
                organization={organization}
                initialDividasTerras={dividasTerras}
              />
            </TabsContent>

            <TabsContent value="dividas-fornecedores" className="space-y-4">
              <DividasFornecedoresListing
                organization={organization}
                initialDividasFornecedores={dividasFornecedores}
              />
            </TabsContent>

            <TabsContent value="caixa-disponibilidades" className="space-y-4">
              <CaixaDisponibilidadesListing
                organization={organization}
                initialItems={caixaDisponibilidades}
              />
            </TabsContent>

            <TabsContent value="financeiras" className="space-y-4">
              <FinanceirasListing
                organization={organization}
                initialItems={financeiras}
              />
            </TabsContent>

            <TabsContent value="outras-despesas" className="space-y-4">
              <OutrasDespesasListing
                organization={organization}
                initialItems={outrasDespesasWithTotal}
              />
            </TabsContent>
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
}
