"use client";

import { Suspense } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTriggerPrimary,
} from "@/components/ui/tabs";
import { Loader2, Building2, Landmark, Users, Wallet, TrendingUp, Receipt, DollarSign } from "lucide-react";
import { DebtMetrics } from "./debt-metrics";
import { DividasBancariasListing } from "./dividas-bancarias/dividas-bancarias-listing";
import { DividasTerrasListing } from "./dividas-terras/dividas-terras-listing";
import { DividasFornecedoresListing } from "./dividas-fornecedores/dividas-fornecedores-listing";
import { CaixaDisponibilidadesListing } from "./caixa-disponibilidades/caixa-disponibilidades-listing";
import { FinanceirasListing } from "./financeiras/financeiras-listing";
import { OutrasDespesasListing } from "./outras-despesas/outras-despesas-listing";
import { ReceitasFinanceirasListing } from "./receitas-financeiras/receitas-financeiras-listing";
import { MobileTabs } from "@/components/ui/mobile-tabs";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const tabs = [
    {
      value: "dividas-bancarias",
      label: isMobile ? "Bancárias" : "Dívidas Bancárias",
      icon: Building2,
      content: (
        <DividasBancariasListing
          organization={organization}
          initialDividasBancarias={dividasBancarias}
          safras={safras}
        />
      ),
    },
    {
      value: "dividas-terras",
      label: isMobile ? "Terras" : "Dívidas Terras",
      icon: Landmark,
      content: (
        <DividasTerrasListing
          organization={organization}
          initialDividas={dividasTerras}
          safras={safras}
        />
      ),
    },
    {
      value: "dividas-fornecedores",
      label: isMobile ? "Fornecedores" : "Dívidas Fornecedores",
      icon: Users,
      content: (
        <DividasFornecedoresListing
          organization={organization}
          initialDividasFornecedores={dividasFornecedores}
        />
      ),
    },
    {
      value: "caixa-disponibilidades",
      label: isMobile ? "Caixa" : "Caixa e Disponibilidades",
      icon: Wallet,
      content: (
        <CaixaDisponibilidadesListing
          organization={organization}
          initialItems={caixaDisponibilidades}
          safras={safras}
        />
      ),
    },
    {
      value: "financeiras",
      label: isMobile ? "Operações" : "Operações Financeiras",
      icon: TrendingUp,
      content: (
        <FinanceirasListing
          organization={organization}
          initialFinanceiras={financeiras}
          safras={safras}
        />
      ),
    },
    {
      value: "outras-despesas",
      label: isMobile ? "Despesas" : "Outras Despesas",
      icon: Receipt,
      content: (
        <OutrasDespesasListing
          organization={organization}
          initialOutrasDespesas={outrasDespesasWithTotal}
          safras={safras}
        />
      ),
    },
    {
      value: "outras-receitas",
      label: isMobile ? "Receitas" : "Outras Receitas",
      icon: DollarSign,
      content: (
        <ReceitasFinanceirasListing
          organizationId={organization.id}
          receitas={receitasFinanceiras}
          safras={safras}
        />
      ),
    },
  ];

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Métricas de Dívida Consolidada - Sempre visível */}
        <DebtMetrics
          dividasBancarias={dividasBancarias}
          dividasTerras={dividasTerras}
          dividasFornecedores={dividasFornecedores}
        />

        <MobileTabs
          tabs={tabs}
          defaultValue="dividas-bancarias"
        />
      </div>
    );
  }

  // Desktop view - manter o layout original mas com melhorias
  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="dividas-bancarias">
        <div className="bg-card border-b overflow-x-auto">
          <div className="container max-w-full px-4 md:px-6 py-2">
            <TabsList className="w-max">
              <TabsTriggerPrimary value="dividas-bancarias">
                Dívidas Bancárias
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="dividas-terras">
                Dívidas Terras
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="dividas-fornecedores">
                Dívidas Fornecedores
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="caixa-disponibilidades">
                Caixa e Disponibilidades
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="financeiras">
                Operações Financeiras
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="outras-despesas">
                Outras Despesas
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="outras-receitas">
                Outras Receitas
              </TabsTriggerPrimary>
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
                initialDividas={dividasTerras}
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
                initialFinanceiras={financeiras}
              />
            </TabsContent>

            <TabsContent value="outras-despesas" className="space-y-4">
              <OutrasDespesasListing
                organization={organization}
                initialOutrasDespesas={outrasDespesasWithTotal}
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
