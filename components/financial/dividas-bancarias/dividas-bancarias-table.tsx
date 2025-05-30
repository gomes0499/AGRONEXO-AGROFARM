"use client";

import { DividasBancariasListItem } from "@/schemas/financial/dividas_bancarias";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditIcon, TrashIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";

interface DividasBancariasTableProps {
  items: DividasBancariasListItem[];
  isLoading: boolean;
  onEdit: (item: DividasBancariasListItem) => void;
  onDelete: (id: string) => void;
}

export function DividasBancariasTable({
  items,
  isLoading,
  onEdit,
  onDelete,
}: DividasBancariasTableProps) {
  // Função para gerar o estilo do badge com base na categoria
  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "CUSTEIO":
        return "default";
      case "INVESTIMENTO":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.nome}</TableCell>
              <TableCell>
                <Badge variant={getCategoryBadgeVariant(item.categoria)}>
                  {item.categoria}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.total || 0)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(item)}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}