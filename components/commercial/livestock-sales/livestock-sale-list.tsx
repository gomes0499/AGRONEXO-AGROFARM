"use client";

import { useState } from "react";
import { LivestockSale } from "@/schemas/commercial";
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
import { formatCurrency } from "@/lib/utils/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FormDrawer } from "@/components/production/common/form-drawer";
import { LivestockSaleForm } from "./livestock-sale-form";
import { toast } from "sonner";
import { deleteLivestockSale } from "@/lib/actions/commercial-actions";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LivestockSaleListProps {
  initialLivestockSales: LivestockSale[];
  organizationId: string;
}

export function LivestockSaleList({ initialLivestockSales, organizationId }: LivestockSaleListProps) {
  const [livestockSales, setLivestockSales] = useState<LivestockSale[]>(initialLivestockSales);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [detailSale, setDetailSale] = useState<LivestockSale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<LivestockSale | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Extrair anos disponíveis
  const availableYears = Array.from(
    new Set(livestockSales.map(sale => sale.ano))
  ).sort((a, b) => b - a); // Ordenar decrescente
  
  // Filtrar por ano e termo de busca
  const filteredSales = livestockSales.filter(sale => {
    const matchesYear = selectedYear === "all" ? true : sale.ano === parseInt(selectedYear);
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm 
      ? sale.ano.toString().includes(searchLower)
      : true;
    
    return matchesYear && matchesSearch;
  });
  
  // Função para visualizar detalhes
  const handleViewDetails = (sale: LivestockSale) => {
    setDetailSale(sale);
    setIsDetailOpen(true);
  };
  
  // Função para editar
  const handleEdit = (sale: LivestockSale) => {
    setEditingSale(sale);
    setIsEditOpen(true);
  };
  
  // Função para atualizar a lista após edição
  const handleUpdate = (updatedSale: LivestockSale) => {
    setLivestockSales(
      livestockSales.map(sale => sale.id === updatedSale.id ? updatedSale : sale)
    );
    setIsEditOpen(false);
    setEditingSale(null);
    toast.success("Registro de venda pecuária atualizado com sucesso!");
  };
  
  // Função para excluir
  const handleDelete = async (id: string) => {
    try {
      await deleteLivestockSale(id);
      setLivestockSales(livestockSales.filter(sale => sale.id !== id));
      toast.success("Registro de venda pecuária excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir venda pecuária:", error);
      toast.error("Erro ao excluir venda pecuária");
    }
  };
  
  // Função para calcular o resultado
  const calculateResult = (sale: LivestockSale): number => {
    return (
      sale.receita_operacional_bruta -
      sale.impostos_vendas -
      sale.comissao_vendas -
      sale.logistica_entregas -
      sale.custo_mercadorias_vendidas -
      sale.despesas_gerais -
      sale.imposto_renda
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="md:w-1/3">
          <Select
            value={selectedYear}
            onValueChange={setSelectedYear}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anos</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
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
      
      {filteredSales.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum registro de venda pecuária encontrado. 
          {searchTerm || selectedYear 
            ? " Tente ajustar os filtros." 
            : " Clique em 'Nova Venda' para adicionar um registro."}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ano</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>Custos</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => {
                const resultado = calculateResult(sale);
                const custoTotal = 
                  sale.impostos_vendas +
                  sale.comissao_vendas +
                  sale.logistica_entregas +
                  sale.custo_mercadorias_vendidas +
                  sale.despesas_gerais +
                  sale.imposto_renda;
                
                return (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.ano}</TableCell>
                    <TableCell>{formatCurrency(sale.receita_operacional_bruta)}</TableCell>
                    <TableCell>{formatCurrency(custoTotal)}</TableCell>
                    <TableCell>
                      <span className={resultado >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(resultado)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(sale)}
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
                              onClick={() => handleEdit(sale)}
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
                            <AlertDialogTitle>Excluir Venda</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este registro de venda pecuária? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground"
                              onClick={() => sale.id && handleDelete(sale.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Modal de Detalhes */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda Pecuária</DialogTitle>
            <DialogDescription>
              {detailSale && (
                <>
                  Ano: {detailSale.ano}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {detailSale && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <span>Receita Operacional Bruta:</span>
                    <span className="font-medium">{formatCurrency(detailSale.receita_operacional_bruta)}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Deduções e Custos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Impostos sobre Vendas:</span>
                    <span>{formatCurrency(detailSale.impostos_vendas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comissão de Vendas:</span>
                    <span>{formatCurrency(detailSale.comissao_vendas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Logística e Entregas:</span>
                    <span>{formatCurrency(detailSale.logistica_entregas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo dos Animais Vendidos:</span>
                    <span>{formatCurrency(detailSale.custo_mercadorias_vendidas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Despesas Gerais:</span>
                    <span>{formatCurrency(detailSale.despesas_gerais)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Imposto de Renda:</span>
                    <span>{formatCurrency(detailSale.imposto_renda)}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resultado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Resultado Operacional:</span>
                    <span className={`font-bold ${calculateResult(detailSale) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculateResult(detailSale))}
                    </span>
                  </div>
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
          title="Editar Venda Pecuária"
          description="Atualize as informações da venda"
        >
          {editingSale && (
            <LivestockSaleForm
              organizationId={organizationId}
              livestockSale={editingSale}
              onSuccess={handleUpdate}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </FormDrawer>
      ) : (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Venda Pecuária</DialogTitle>
              <DialogDescription>
                Atualize as informações da venda
              </DialogDescription>
            </DialogHeader>
            {editingSale && (
              <LivestockSaleForm
                organizationId={organizationId}
                livestockSale={editingSale}
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