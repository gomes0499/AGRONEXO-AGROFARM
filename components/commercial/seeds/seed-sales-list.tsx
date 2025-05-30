"use client";

import { useState, useEffect } from "react";
import { SeedSale, LivestockSale } from "@/schemas/commercial";
import { Culture, Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import { deleteSeedSale } from "@/lib/actions/commercial-actions";
import { toast } from "sonner";
import { SeedSalesTable } from "@/components/commercial/seeds/seed-sales-table";
import { NewSeedSaleButton } from "@/components/commercial/seeds/new-seed-sale-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { SeedSaleForm } from "@/components/commercial/seeds/seed-sale-form";
import { Sprout } from "lucide-react";

interface SeedSalesListProps {
  initialSeedSales: SeedSale[];
  cultures: Culture[];
  organizationId: string;
  harvests: Harvest[];
  properties: Property[];
}

export function SeedSalesList({
  initialSeedSales,
  cultures,
  organizationId,
  harvests,
  properties,
}: SeedSalesListProps) {
  // Gerenciar estado local das vendas
  const [seedSales, setSeedSales] = useState<SeedSale[]>(initialSeedSales);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSeedSale, setSelectedSeedSale] = useState<SeedSale | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Atualizar o estado local sempre que os dados do servidor mudarem
  useEffect(() => {
    setSeedSales(initialSeedSales);
  }, [initialSeedSales]);

  // Nenhum cálculo financeiro necessário

  // Função para adicionar nova venda à lista
  const handleAdd = (newSale: SeedSale) => {
    setSeedSales([...seedSales, newSale]);
  };

  // Função para editar uma venda
  const handleEdit = (sale: SeedSale | LivestockSale) => {
    if ("cultura_id" in sale) {
      setSelectedSeedSale(sale as SeedSale);
      setIsEditDialogOpen(true);
    }
  };

  // Função para atualizar venda após edição
  const handleUpdate = (updatedSale: SeedSale) => {
    setSeedSales(seedSales.map(sale => 
      sale.id === updatedSale.id ? updatedSale : sale
    ));
    setIsEditDialogOpen(false);
    setSelectedSeedSale(null);
  };

  // Função para iniciar exclusão
  const handleDelete = (sale: SeedSale | LivestockSale) => {
    if ("cultura_id" in sale) {
      setSelectedSeedSale(sale as SeedSale);
      setIsDeleteDialogOpen(true);
    }
  };

  // Função para confirmar exclusão
  const confirmDelete = async () => {
    if (!selectedSeedSale?.id) return;

    try {
      setDeletingId(selectedSeedSale.id);
      await deleteSeedSale(selectedSeedSale.id);
      setSeedSales(seedSales.filter(sale => sale.id !== selectedSeedSale.id));
      toast.success("Venda de semente excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir venda de semente:", error);
      toast.error("Ocorreu um erro ao excluir a venda de semente.");
    } finally {
      setDeletingId(null);
      setIsDeleteDialogOpen(false);
      setSelectedSeedSale(null);
    }
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<Sprout className="h-5 w-5" />}
        title="Vendas de Sementes"
        description="Gestão das receitas e despesas com vendas de sementes"
        action={
          <NewSeedSaleButton
            cultures={cultures}
            properties={properties}
            organizationId={organizationId}
            harvests={harvests}
            onSeedSaleCreated={handleAdd}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
          />
        }
        className="mb-4"
      />
      <CardContent className="space-y-4">
        {/* Tabela de Vendas */}
        <SeedSalesTable
          sales={seedSales}
          onEdit={handleEdit}
          onDelete={handleDelete}
          cultures={cultures}
          properties={properties}
          harvests={harvests}
        />
      </CardContent>

      {/* Diálogo de Edição */}
      {selectedSeedSale && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Editar Venda de Sementes</DialogTitle>
              <DialogDescription>
                Atualize os dados financeiros da venda de sementes
              </DialogDescription>
            </DialogHeader>
            <SeedSaleForm
              harvests={harvests}
              cultures={cultures}
              properties={properties}
              organizationId={organizationId}
              seedSale={selectedSeedSale}
              onSuccess={handleUpdate}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Exclusão */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de venda de sementes?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete()}
              className="bg-destructive text-white hover:bg-destructive/80"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
