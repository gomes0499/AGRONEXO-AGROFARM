import { Metadata } from "next";
import { Suspense } from "react";
import { getOrganizationId, getSession } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Imports das actions financeiras
import {
  getBankDebts,
  getTradingDebts,
  getPropertyDebts,
  getSuppliers,
  getLiquidityFactors,
  getInventories,
  getCommodityInventories,
  getReceivableContracts,
  getSupplierAdvances,
  getThirdPartyLoans,
} from "@/lib/actions/financial-actions";

import { BankDebtListing } from "@/components/financial/bank-debts/bank-debt-listing";
import { TradingDebtListing } from "@/components/financial/trading-debts/trading-debt-listing";
import { PropertyDebtListing } from "@/components/financial/property-debts/property-debt-listing";
import { SupplierListing } from "@/components/financial/suppliers/supplier-listing";
import { LiquidityFactorListing } from "@/components/financial/liquidity/liquidity-factor-listing";
import { InventoryListing } from "@/components/financial/inventory/inventory-listing";
import { CommodityInventoryListing } from "@/components/financial/commodity-inventory/commodity-inventory-listing";
import { ReceivableListing } from "@/components/financial/receivables/receivable-listing";
import { AdvanceListing } from "@/components/financial/advances/advance-listing";
import { LoanListing } from "@/components/financial/loans/loan-listing";

export const metadata: Metadata = {
  title: "Financeiro | SR Consultoria",
  description: "Gestão financeira e controle de dívidas e investimentos",
};

export default async function FinancialPage() {
  await requireSuperAdmin();
  const session = await getSession();
  const organizationId = await getOrganizationId();
  if (!session?.organization || !session?.organizationId) {
    throw new Error("Organização não encontrada ou usuário não autenticado");
  }

  const organization = {
    id: session.organizationId,
    nome: session.organization.nome,
  };

  const [
    bankDebts,
    tradingDebts,
    propertyDebts,
    suppliers,
    liquidityFactors,
    inventories,
    commodityInventories,
    receivableContracts,
    supplierAdvances,
    thirdPartyLoans,
  ] = await Promise.all([
    getBankDebts(organizationId),
    getTradingDebts(organizationId),
    getPropertyDebts(organizationId),
    getSuppliers(organizationId),
    getLiquidityFactors(organizationId),
    getInventories(organizationId),
    getCommodityInventories(organizationId),
    getReceivableContracts(organizationId),
    getSupplierAdvances(organizationId),
    getThirdPartyLoans(organizationId),
  ]);

  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="bank-debts">
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 md:px-6 py-2">
            <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start">
              <TabsTrigger
                value="bank-debts"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Dívidas Bancárias
              </TabsTrigger>
              <TabsTrigger
                value="trading-debts"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Dívidas Trading
              </TabsTrigger>
              <TabsTrigger
                value="property-debts"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Dívidas Imóveis
              </TabsTrigger>
              <TabsTrigger
                value="suppliers"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Fornecedores
              </TabsTrigger>
              <TabsTrigger
                value="liquidity"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Liquidez
              </TabsTrigger>
              <TabsTrigger
                value="inventories"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Estoques
              </TabsTrigger>
              <TabsTrigger
                value="commodity-stocks"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Commodities
              </TabsTrigger>
              <TabsTrigger
                value="receivables"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Recebíveis
              </TabsTrigger>
              <TabsTrigger
                value="supplier-advances"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Adiantamentos
              </TabsTrigger>
              <TabsTrigger
                value="third-party-loans"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Empréstimos
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
            <TabsContent value="bank-debts" className="space-y-4">
              <BankDebtListing
                organization={organization}
                initialBankDebts={bankDebts}
              />
            </TabsContent>

            <TabsContent value="trading-debts" className="space-y-4">
              <TradingDebtListing
                organization={organization}
                initialTradingDebts={tradingDebts}
              />
            </TabsContent>

            <TabsContent value="property-debts" className="space-y-4">
              <PropertyDebtListing
                organization={organization}
                initialPropertyDebts={propertyDebts}
              />
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-4">
              <SupplierListing
                organization={organization}
                initialSuppliers={suppliers}
              />
            </TabsContent>

            <TabsContent value="liquidity" className="space-y-4">
              <LiquidityFactorListing
                organization={organization}
                initialLiquidityFactors={liquidityFactors}
              />
            </TabsContent>

            <TabsContent value="inventories" className="space-y-4">
              <InventoryListing
                organization={organization}
                initialInventories={inventories}
              />
            </TabsContent>

            <TabsContent value="commodity-stocks" className="space-y-4">
              <CommodityInventoryListing
                organization={organization}
                initialCommodityInventories={commodityInventories}
              />
            </TabsContent>

            <TabsContent value="receivables" className="space-y-4">
              <ReceivableListing
                organization={organization}
                initialReceivables={receivableContracts}
              />
            </TabsContent>

            <TabsContent value="supplier-advances" className="space-y-4">
              <AdvanceListing
                organization={organization}
                initialAdvances={supplierAdvances}
              />
            </TabsContent>

            <TabsContent value="third-party-loans" className="space-y-4">
              <LoanListing
                organization={organization}
                initialLoans={thirdPartyLoans}
              />
            </TabsContent>
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
}
