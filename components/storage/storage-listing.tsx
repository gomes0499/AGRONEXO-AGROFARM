"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, Warehouse, Package, Wheat } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { Badge } from "@/components/ui/badge";
import { StorageForm } from "./storage-form";
import { StorageRowActions } from "./storage-row-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { getStorages, deleteStorage } from "@/lib/actions/storage-actions";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/formatters";

interface StorageItem {
  id: string;
  propriedade_id: string;
  propriedade_nome?: string;
  tipo_armazenagem: 'graos' | 'algodao';
  capacidade_sacas?: number;
  capacidade_fardos?: number;
  possui_beneficiamento: boolean;
  observacoes?: string;
}

interface StorageListingProps {
  organizationId: string;
  projectionId?: string;
}

export function StorageListing({ 
  organizationId,
  projectionId 
}: StorageListingProps) {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StorageItem | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadStorages();
  }, [organizationId]);

  const loadStorages = async () => {
    startTransition(async () => {
      try {
        const data = await getStorages(organizationId);
        setItems(data);
      } catch (error) {
        console.error("Erro ao carregar armazéns:", error);
        toast.error("Erro ao carregar armazéns");
      }
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStorage(id);
      toast.success("Armazém removido com sucesso");
      loadStorages();
    } catch (error) {
      console.error("Erro ao deletar armazém:", error);
      toast.error("Erro ao remover armazém");
    }
  };

  const handleEdit = (item: StorageItem) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
    loadStorages();
  };

  const handleFormCancel = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeaderPrimary
          icon={<Warehouse className="h-4 w-4" />}
          title="Capacidade de Armazenagem"
          description="Gerencie os armazéns e silos das propriedades"
          action={
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white hover:bg-gray-100 text-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Armazém
            </Button>
          }
        />
        <CardContent className="p-6">
          {items.length === 0 ? (
            <EmptyState
              icon={<Warehouse className="h-10 w-10 text-muted-foreground" />}
              title="Nenhum armazém cadastrado"
              description="Cadastre o primeiro armazém para controlar a capacidade de armazenagem"
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Cadastrar Armazém
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Propriedade</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Capacidade</TableHead>
                      <TableHead className="text-center">Beneficiamento</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.propriedade_nome || 'Propriedade'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.tipo_armazenagem === 'graos' ? 'default' : 'secondary'}>
                            {item.tipo_armazenagem === 'graos' ? (
                              <>
                                <Wheat className="h-3 w-3 mr-1" />
                                Grãos
                              </>
                            ) : (
                              <>
                                <Package className="h-3 w-3 mr-1" />
                                Algodão
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.tipo_armazenagem === 'graos' 
                            ? `${formatNumber(item.capacidade_sacas || 0, 0)} sacas`
                            : `${formatNumber(item.capacidade_fardos || 0, 0)} fardos`
                          }
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.possui_beneficiamento ? 'success' : 'outline'}>
                            {item.possui_beneficiamento ? 'Sim' : 'Não'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {item.observacoes || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StorageRowActions
                            item={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de formulário */}
      {isAddModalOpen && (
        <StorageForm
          organizationId={organizationId}
          editingItem={editingItem}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}