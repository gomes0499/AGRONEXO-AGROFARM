"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Supplier } from "@/schemas/financial/suppliers";
import { SupplierForm } from "./supplier-form";
import { SupplierRowActions } from "./supplier-row-actions";
import { FinancialHeader } from "../common/financial-header";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

interface SupplierListingProps {
  organization: { id: string; nome: string };
  initialSuppliers: Supplier[];
}

export function SupplierListing({
  organization,
  initialSuppliers,
}: SupplierListingProps) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Filtrar fornecedores baseado no termo de busca
  const filteredSuppliers = suppliers.filter((supplier) => {
    return supplier.nome.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calcular valor total por fornecedor
  const getSupplierTotal = (supplier: Supplier) => {
    try {
      const values =
        typeof supplier.valores_por_ano === "string"
          ? JSON.parse(supplier.valores_por_ano)
          : supplier.valores_por_ano || {};

      return Object.values(values).reduce(
        (sum: number, value: any) => sum + (Number(value) || 0),
        0
      );
    } catch (error) {
      console.error("Erro ao calcular valor total:", error);
      return 0;
    }
  };

  // Adicionar novo fornecedor
  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers((prev) => [newSupplier, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar fornecedor existente
  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === updatedSupplier.id ? updatedSupplier : supplier
      )
    );
    setEditingSupplier(null);
  };

  // Excluir fornecedor
  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));
  };

  return (
    <div className="space-y-4">
      <FinancialHeader
        title="Fornecedores"
        description="Gerencie fornecedores e pagamentos anuais programados"
        action={
          <Button
            variant="default"
            size="default"
            className="gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Novo Fornecedor
          </Button>
        }
      />

      <FinancialFilterBar onSearch={setSearchTerm} />

      <Card>
        <CardContent className="p-0">
          {suppliers.length === 0 ? (
            <EmptyState
              title="Nenhum fornecedor cadastrado"
              description="Clique no botão abaixo para adicionar seu primeiro fornecedor."
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Fornecedor
                </Button>
              }
            />
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum fornecedor encontrado para "{searchTerm}"
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Fornecedor</TableHead>
                    <TableHead>Moeda</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>{supplier.nome}</TableCell>
                      <TableCell>{supplier.moeda}</TableCell>
                      <TableCell>
                        {formatGenericCurrency(getSupplierTotal(supplier), supplier.moeda as any)}
                      </TableCell>
                      <TableCell>
                        <SupplierRowActions
                          supplier={supplier}
                          onEdit={() => setEditingSupplier(supplier)}
                          onDelete={() => handleDeleteSupplier(supplier.id!)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Rodapé com totalização */}
              <div className="p-4 border-t bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total de Fornecedores:</span>
                  <span className="font-bold">
                    {(() => {
                      // Agrupar totais por moeda
                      const totals: { [key: string]: number } = {};
                      
                      filteredSuppliers.forEach(supplier => {
                        const moeda = supplier.moeda || 'BRL';
                        const total = getSupplierTotal(supplier);
                        
                        if (!totals[moeda]) {
                          totals[moeda] = 0;
                        }
                        
                        totals[moeda] += total;
                      });
                      
                      // Formatar e concatenar totais por moeda
                      return Object.entries(totals)
                        .map(([moeda, valor]) => formatGenericCurrency(valor, moeda as any))
                        .join(' + ');
                    })()}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar novo fornecedor */}
      <SupplierForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddSupplier}
      />

      {/* Modal para editar fornecedor existente */}
      {editingSupplier && (
        <SupplierForm
          open={!!editingSupplier}
          onOpenChange={() => setEditingSupplier(null)}
          organizationId={organization.id}
          existingSupplier={editingSupplier}
          onSubmit={handleUpdateSupplier}
        />
      )}
    </div>
  );
}
