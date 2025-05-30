"use client";

import { useState, useMemo } from "react";
import { BankDebt } from "@/schemas/financial";
import { formatGenericCurrency, formatCurrency, CurrencyType } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { PlusIcon, Building2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BankDebtForm } from "./bank-debt-form";
import { deleteBankDebt } from "@/lib/actions/financial-actions";
import { BankDebtRowActions } from "./bank-debt-row-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { Harvest } from "@/schemas/production";
import { BankDebtDetailRow } from "./bank-debt-detail-row";

interface BankDebtHarvestListingProps {
  organization: { id: string; nome: string };
  initialBankDebts: BankDebt[];
  harvests: Harvest[];
}

export function BankDebtHarvestListing({
  organization,
  initialBankDebts,
  harvests,
}: BankDebtHarvestListingProps) {
  const [bankDebts, setBankDebts] = useState<BankDebt[]>(() => {
    // Garantir que o fluxo_pagamento_anual esteja corretamente formatado
    return initialBankDebts.map(debt => {
      let fluxo_pagamento_anual = debt.fluxo_pagamento_anual;
      
      // Se for string, converter para objeto
      if (typeof fluxo_pagamento_anual === 'string' && fluxo_pagamento_anual) {
        try {
          fluxo_pagamento_anual = JSON.parse(fluxo_pagamento_anual);
        } catch (e) {
          console.error("Erro ao fazer parse do fluxo_pagamento_anual:", e);
          fluxo_pagamento_anual = {};
        }
      } else if (!fluxo_pagamento_anual) {
        fluxo_pagamento_anual = {};
      }
      
      return {
        ...debt,
        fluxo_pagamento_anual
      };
    });
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<BankDebt | null>(null);

  // Group debts by harvest
  const debtsByHarvest = useMemo(() => {
    const grouped = new Map<string, BankDebt[]>();
    
    // First add a "Todos" category
    grouped.set("all", [...bankDebts]);
    
    // Group by specific harvest
    bankDebts.forEach(debt => {
      if (debt.safra_id) {
        const safraId = debt.safra_id;
        if (!grouped.has(safraId)) {
          grouped.set(safraId, []);
        }
        grouped.get(safraId)?.push(debt);
      } else {
        // Create a "Sem safra" category for debts without a harvest
        if (!grouped.has("no-harvest")) {
          grouped.set("no-harvest", []);
        }
        grouped.get("no-harvest")?.push(debt);
      }
    });
    
    return grouped;
  }, [bankDebts]);

  // Calculate totals per harvest
  const harvestTotals = useMemo(() => {
    const totals = new Map<string, Record<string, number>>();
    
    debtsByHarvest.forEach((debts, harvestId) => {
      const currencies = new Set<string>();
      const harvestTotal: Record<string, number> = {};
      
      // Find all currencies used
      debts.forEach(debt => {
        const moeda = debt.moeda || "BRL";
        currencies.add(moeda);
      });
      
      // Calculate total for each currency
      currencies.forEach(currency => {
        const total = debts.reduce((sum, debt) => {
          if ((debt.moeda || "BRL") === currency) {
            // Calculate total from fluxo_pagamento_anual
            let debtTotal = 0;
            const flowData = debt.fluxo_pagamento_anual;
            
            if (typeof flowData === 'object' && flowData !== null) {
              debtTotal = Object.values(flowData as Record<string, number>)
                .reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
            }
            
            return sum + debtTotal;
          }
          return sum;
        }, 0);
        
        harvestTotal[currency] = total;
      });
      
      totals.set(harvestId, harvestTotal);
    });
    
    return totals;
  }, [debtsByHarvest]);

  // Adicionar nova dívida
  const handleAddDebt = (newDebt: BankDebt) => {
    // Garantir que fluxo_pagamento_anual é um objeto
    let fluxo_pagamento_anual = newDebt.fluxo_pagamento_anual;
    if (typeof fluxo_pagamento_anual === 'string' && fluxo_pagamento_anual) {
      try {
        fluxo_pagamento_anual = JSON.parse(fluxo_pagamento_anual);
      } catch (e) {
        console.error("Erro ao fazer parse de fluxo_pagamento_anual:", e);
        fluxo_pagamento_anual = {};
      }
    }
    
    const processedDebt = {
      ...newDebt,
      fluxo_pagamento_anual
    };
    
    setBankDebts([processedDebt, ...bankDebts]);
    setIsAddModalOpen(false);
  };

  // Atualizar dívida existente
  const handleUpdateDebt = (updatedDebt: BankDebt) => {
    // Garantir que fluxo_pagamento_anual é um objeto
    let fluxo_pagamento_anual = updatedDebt.fluxo_pagamento_anual;
    if (typeof fluxo_pagamento_anual === 'string' && fluxo_pagamento_anual) {
      try {
        fluxo_pagamento_anual = JSON.parse(fluxo_pagamento_anual);
      } catch (e) {
        console.error("Erro ao fazer parse de fluxo_pagamento_anual:", e);
        fluxo_pagamento_anual = {};
      }
    }
    
    const processedDebt = {
      ...updatedDebt,
      fluxo_pagamento_anual
    };
    
    setBankDebts(
      bankDebts.map((debt) =>
        debt.id === processedDebt.id ? processedDebt : debt
      )
    );
    setEditingDebt(null);
  };

  // Excluir dívida
  const handleDeleteDebt = async (id: string) => {
    try {
      await deleteBankDebt(id);
      setBankDebts(bankDebts.filter((debt) => debt.id !== id));
      toast.success("Dívida bancária excluída com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir dívida bancária");
    }
  };
  
  // Function to calculate total from fluxo_pagamento_anual for a specific debt
  const calculateTotal = (debt: BankDebt) => {
    let total = 0;
    
    if (debt.fluxo_pagamento_anual) {
      // Se for uma string, tentar fazer parse para objeto
      let flowData = debt.fluxo_pagamento_anual;
      if (typeof flowData === 'string') {
        try {
          flowData = JSON.parse(flowData);
        } catch (e) {
          console.error("Erro ao fazer parse do JSON:", e);
        }
      }
      
      // Agora calcular o total
      if (typeof flowData === 'object' && flowData !== null) {
        total = Object.values(flowData as Record<string, number>)
          .reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
      }
    }
    
    return total;
  };

  // Function to get harvest name by id
  const getHarvestName = (harvestId: string) => {
    if (harvestId === "all") return "Todas as Safras";
    if (harvestId === "no-harvest") return "Sem Safra";
    
    const harvest = harvests.find(h => h.id === harvestId);
    return harvest?.nome || "Safra Desconhecida";
  };

  // Function to render the harvest tab content
  const renderHarvestContent = (harvestId: string) => {
    const debts = debtsByHarvest.get(harvestId) || [];
    const totals = harvestTotals.get(harvestId) || {};
    
    return (
      <div className="space-y-4">
        {/* Currency totals */}
        <div className="flex flex-wrap gap-3 mb-4">
          {Object.entries(totals).map(([currency, value]) => (
            <Card key={currency} className="w-auto">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="px-2 py-1 text-xs">
                    {currency}
                  </Badge>
                  <span className="font-semibold text-lg">
                    {formatGenericCurrency(value, currency as CurrencyType)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {debts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhuma dívida bancária cadastrada para esta safra.</div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar Primeira Dívida
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Nome</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Tipo</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Modalidade</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Indexador</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Taxa</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Moeda</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Valor</TableHead>
                  {harvestId === "all" && (
                    <TableHead className="font-semibold text-primary-foreground">Safra</TableHead>
                  )}
                  <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((debt) => (
                  <BankDebtDetailRow
                    key={debt.id}
                    debt={debt}
                    harvests={harvests}
                    onEdit={setEditingDebt}
                    onDelete={handleDeleteDebt}
                    showSafraColumn={harvestId === "all"}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  // Render the main component
  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Dívidas Bancárias por Safra</CardTitle>
            <CardDescription className="text-white/80">
              Controle das dívidas contraídas junto a instituições bancárias organizadas por safra
            </CardDescription>
          </div>
        </div>
        <Button
          variant="secondary"
          size="default"
          className="gap-1"
          onClick={() => setIsAddModalOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Nova Dívida
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full mt-4">
          <TabsList className="mb-4 flex flex-wrap h-auto">
            <TabsTrigger value="all" className="rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Todas
            </TabsTrigger>
            {harvests.map(harvest => (
              <TabsTrigger 
                key={harvest.id} 
                value={harvest.id || ""} 
                className="rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                disabled={!debtsByHarvest.has(harvest.id || "") || (debtsByHarvest.get(harvest.id || "") || []).length === 0}
              >
                {harvest.nome}
              </TabsTrigger>
            ))}
            {debtsByHarvest.has("no-harvest") && (
              <TabsTrigger 
                value="no-harvest" 
                className="rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Sem Safra
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="all">
            {renderHarvestContent("all")}
          </TabsContent>
          
          {harvests.map(harvest => (
            <TabsContent key={harvest.id} value={harvest.id || ""}>
              {renderHarvestContent(harvest.id || "")}
            </TabsContent>
          ))}
          
          {debtsByHarvest.has("no-harvest") && (
            <TabsContent value="no-harvest">
              {renderHarvestContent("no-harvest")}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>

      {/* Modal para adicionar nova dívida */}
      <BankDebtForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddDebt}
        harvests={harvests}
      />

      {/* Modal para editar dívida existente */}
      {editingDebt && (
        <BankDebtForm
          open={!!editingDebt}
          onOpenChange={() => setEditingDebt(null)}
          organizationId={organization.id}
          existingDebt={editingDebt}
          onSubmit={handleUpdateDebt}
          harvests={harvests}
        />
      )}
    </Card>
  );
}