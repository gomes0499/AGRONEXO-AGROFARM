"use client";

import { useState } from "react";
import { CommodityStock } from "@/schemas/commercial";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FormDrawer } from "@/components/production/common/form-drawer";
import { StockForm } from "./stock-form";
import { toast } from "sonner";
import { deleteCommodityStock } from "@/lib/actions/commercial-actions";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StockListProps {
  initialStocks: CommodityStock[];
  organizationId: string;
}

export function StockList({ initialStocks, organizationId }: StockListProps) {
  const [stocks, setStocks] = useState<CommodityStock[]>(initialStocks);
  const [selectedCommodity, setSelectedCommodity] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [detailStock, setDetailStock] = useState<CommodityStock | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<CommodityStock | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Filtrar por commodity e termo de busca
  const filteredStocks = stocks.filter(stock => {
    const matchesCommodity = selectedCommodity === "all" ? true : stock.commodity === selectedCommodity;
    
    const commodityName = getCommodityLabel(stock.commodity);
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm 
      ? commodityName.toLowerCase().includes(searchLower) ||
        formatDate(new Date(stock.data_referencia)).includes(searchLower)
      : true;
    
    return matchesCommodity && matchesSearch;
  });
  
  // Função para visualizar detalhes
  const handleViewDetails = (stock: CommodityStock) => {
    setDetailStock(stock);
    setIsDetailOpen(true);
  };
  
  // Função para editar
  const handleEdit = (stock: CommodityStock) => {
    setEditingStock(stock);
    setIsEditOpen(true);
  };
  
  // Função para atualizar a lista após edição
  const handleUpdate = (updatedStock: CommodityStock) => {
    setStocks(
      stocks.map(stock => stock.id === updatedStock.id ? updatedStock : stock)
    );
    setIsEditOpen(false);
    setEditingStock(null);
    toast.success("Registro de estoque atualizado com sucesso!");
  };
  
  // Função para excluir
  const handleDelete = async (id: string) => {
    try {
      await deleteCommodityStock(id);
      setStocks(stocks.filter(stock => stock.id !== id));
      toast.success("Registro de estoque excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir estoque:", error);
      toast.error("Erro ao excluir estoque");
    }
  };
  
  // Função para obter o nome da commodity
  const getCommodityLabel = (commodity: string): string => {
    switch (commodity) {
      case 'SOJA':
        return 'Soja';
      case 'MILHO':
        return 'Milho';
      case 'ALGODAO':
        return 'Algodão';
      case 'ARROZ':
        return 'Arroz';
      case 'SORGO':
        return 'Sorgo';
      case 'CAFE':
        return 'Café';
      case 'CACAU':
        return 'Cacau';
      default:
        return commodity;
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="md:w-1/3">
          <Select
            value={selectedCommodity}
            onValueChange={setSelectedCommodity}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por commodity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as commodities</SelectItem>
              <SelectItem value="SOJA">Soja</SelectItem>
              <SelectItem value="MILHO">Milho</SelectItem>
              <SelectItem value="ALGODAO">Algodão</SelectItem>
              <SelectItem value="ARROZ">Arroz</SelectItem>
              <SelectItem value="SORGO">Sorgo</SelectItem>
              <SelectItem value="CAFE">Café</SelectItem>
              <SelectItem value="CACAU">Cacau</SelectItem>
              <SelectItem value="OUTROS">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:w-2/3">
          <Input
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredStocks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum registro de estoque encontrado. 
          {searchTerm || selectedCommodity !== "all" 
            ? " Tente ajustar os filtros." 
            : " Clique em 'Novo Estoque' para adicionar um registro."}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commodity</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Quantidade (kg)</TableHead>
                <TableHead>Valor Unitário</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell>{getCommodityLabel(stock.commodity)}</TableCell>
                  <TableCell>{formatDate(new Date(stock.data_referencia))}</TableCell>
                  <TableCell>{formatNumber(stock.quantidade)}</TableCell>
                  <TableCell>{formatCurrency(stock.valor_unitario)} /kg</TableCell>
                  <TableCell>{formatCurrency(stock.valor_total)}</TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(stock)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalhes</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(stock)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <AlertDialog>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Estoque</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este registro de estoque? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground"
                            onClick={() => stock.id && handleDelete(stock.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Modal de Detalhes */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Estoque</DialogTitle>
            <DialogDescription>
              {detailStock && (
                <>
                  {getCommodityLabel(detailStock.commodity)} - {formatDate(new Date(detailStock.data_referencia))}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {detailStock && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Quantidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatNumber(detailStock.quantidade)} kg
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Valor Unitário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatCurrency(detailStock.valor_unitario)} /kg
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Valor Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatCurrency(detailStock.valor_total)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(detailStock.quantidade)} kg × {formatCurrency(detailStock.valor_unitario)} /kg
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Formulário de Edição */}
      {isMobile ? (
        <FormDrawer
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Editar Estoque"
          description="Atualize as informações do estoque"
        >
          {editingStock && (
            <StockForm
              organizationId={organizationId}
              stock={editingStock}
              onSuccess={handleUpdate}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </FormDrawer>
      ) : (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Estoque</DialogTitle>
              <DialogDescription>
                Atualize as informações do estoque
              </DialogDescription>
            </DialogHeader>
            {editingStock && (
              <StockForm
                organizationId={organizationId}
                stock={editingStock}
                onSuccess={handleUpdate}
                onCancel={() => setIsEditOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}