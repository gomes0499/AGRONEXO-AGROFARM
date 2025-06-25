"use client";

import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { DebtMetrics } from "./debt-metrics";
import { DividasBancariasListing } from "./dividas-bancarias/dividas-bancarias-listing";
import { DividasTerrasListing } from "./dividas-terras/dividas-terras-listing";
import { DividasFornecedoresListing } from "./dividas-fornecedores/dividas-fornecedores-listing";
import { CaixaDisponibilidadesListing } from "./caixa-disponibilidades/caixa-disponibilidades-listing";
import { FinanceirasListing } from "./financeiras/financeiras-listing";
import { OutrasDespesasListing } from "./outras-despesas/outras-despesas-listing";
import { ReceitasFinanceirasListing } from "./receitas-financeiras/receitas-financeiras-listing";

interface FinancialPageContentProps {
  organization: {
    id: string;
    nome: string;
  };
  dividasBancarias: any[];
  dividasTerras: any[];
  dividasFornecedores: any[];
  caixaDisponibilidades: any[];
  financeiras: any[];
  outrasDespesasWithTotal: any[];
  receitasFinanceiras: any[];
  safras: any[];
  organizationId: string;
}

export function FinancialPageContent({
  organization,
  dividasBancarias,
  dividasTerras,
  dividasFornecedores,
  caixaDisponibilidades,
  financeiras,
  outrasDespesasWithTotal,
  receitasFinanceiras,
  safras,
  organizationId,
}: FinancialPageContentProps) {
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
              <TabsTrigger
                value="outras-receitas"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Outras Receitas
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-4">
          {/* Métricas de Dívida Consolidada - Sempre visível */}
          <DebtMetrics 
            dividasBancarias={dividasBancarias}
            dividasTerras={dividasTerras}
            dividasFornecedores={dividasFornecedores}
          />
          
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
                safras={safras}
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

            <TabsContent value="outras-receitas" className="space-y-4">
              <ReceitasFinanceirasListing
                organizationId={organizationId}
                receitas={receitasFinanceiras}
                safras={safras}
              />
            </TabsContent>
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
}