"use client";

import { useState, useEffect } from "react";
import { LivestockSale } from "@/schemas/commercial";
import { Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import { deleteLivestockSale } from "@/lib/actions/commercial-actions";
import { toast } from "sonner";
import { LivestockSalesTable } from "@/components/commercial/livestock/livestock-sales-table";
import { NewLivestockSaleButton } from "@/components/commercial/livestock/new-livestock-sale-button";
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
import { LivestockSaleForm } from "@/components/commercial/livestock/livestock-sale-form";
import { PiggyBank } from "lucide-react";

interface LivestockSalesListProps {
  initialLivestockSales: LivestockSale[];
  organizationId: string;
  properties?: Property[];
  harvests?: Harvest[];
}

export function LivestockSalesList({
  initialLivestockSales,
  organizationId,
  properties = [],
  harvests = [],
}: LivestockSalesListProps) {
  // Gerenciar estado local das vendas
  const [livestockSales, setLivestockSales] = useState<LivestockSale[]>(initialLivestockSales);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<LivestockSale | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Atualizar o estado local sempre que os dados do servidor mudarem
  useEffect(() => {
    setLivestockSales(initialLivestockSales);
  }, [initialLivestockSales]);

  // Nenhum cálculo financeiro necessário

  // Função para adicionar nova venda à lista
  const handleAdd = (newSale: LivestockSale) => {
    setLivestockSales([...livestockSales, newSale]);
  };

  // Função para editar uma venda
  const handleEdit = (sale: LivestockSale) => {
    setSelectedSale(sale);
    setIsEditDialogOpen(true);
  };

  // Função para atualizar venda após edição
  const handleUpdate = (updatedSale: LivestockSale) => {
    setLivestockSales(livestockSales.map(sale => 
      sale.id === updatedSale.id ? updatedSale : sale
    ));
    setIsEditDialogOpen(false);
    setSelectedSale(null);
  };

  // Função para iniciar exclusão
  const handleDelete = (sale: LivestockSale) => {
    setSelectedSale(sale);
    setIsDeleteDialogOpen(true);
  };

  // Função para confirmar exclusão
  const confirmDelete = async () => {
    if (!selectedSale?.id) return;

    try {
      setDeletingId(selectedSale.id);
      await deleteLivestockSale(selectedSale.id);
      setLivestockSales(livestockSales.filter(sale => sale.id !== selectedSale.id));
      toast.success("Venda pecuária excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir venda pecuária:", error);
      toast.error("Ocorreu um erro ao excluir a venda pecuária.");
    } finally {
      setDeletingId(null);
      setIsDeleteDialogOpen(false);
      setSelectedSale(null);
    }
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<PiggyBank className="h-5 w-5" />}
        title="Vendas Pecuárias"
        description="Gestão das receitas e despesas com vendas de animais"
        action={
          <NewLivestockSaleButton
            organizationId={organizationId}
            properties={properties}
            harvests={harvests}
            onSaleCreated={handleAdd}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
          />
        }
        className="mb-4"
      />
      <CardContent className="space-y-4">
        {/* Tabela de Vendas */}
        <LivestockSalesTable
          sales={livestockSales}
          onEdit={handleEdit}
          onDelete={handleDelete}
          properties={properties}
          harvests={harvests}
        />
      </CardContent>

      {/* Diálogo de Edição */}
      {selectedSale && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Editar Venda Pecuária</DialogTitle>
              <DialogDescription>
                Atualize os dados financeiros da venda pecuária
              </DialogDescription>
            </DialogHeader>
            <LivestockSaleForm
              organizationId={organizationId}
              livestockSale={selectedSale}
              properties={properties}
              harvests={harvests}
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
              Tem certeza que deseja excluir este registro de venda pecuária?
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
