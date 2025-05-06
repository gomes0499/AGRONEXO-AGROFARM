"use client";

import { useState } from "react";
import { SeedSale } from "@/schemas/commercial";
import { Culture } from "@/schemas/production";
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
import { SeedSaleForm } from "./seed-sale-form";
import { toast } from "sonner";
import { deleteSeedSale } from "@/lib/actions/commercial-actions";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SeedSaleListProps {
  initialSeedSales: SeedSale[];
  cultures: Culture[];
  organizationId: string;
}

export function SeedSaleList({ initialSeedSales, cultures, organizationId }: SeedSaleListProps) {
  const [seedSales, setSeedSales] = useState<SeedSale[]>(initialSeedSales);
  const [selectedCulture, setSelectedCulture] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [detailSale, setDetailSale] = useState<SeedSale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SeedSale | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Extrair anos disponíveis
  const availableYears = Array.from(
    new Set(seedSales.map(sale => sale.ano))
  ).sort((a, b) => b - a); // Ordenar decrescente
  
  // Filtrar por cultura, ano e termo de busca
  const filteredSales = seedSales.filter(sale => {
    const matchesCulture = selectedCulture === "all" ? true : sale.cultura_id === selectedCulture;
    const matchesYear = selectedYear === "all" ? true : sale.ano === parseInt(selectedYear);
    
    const culture = cultures.find(c => c.id === sale.cultura_id);
    const cultureName = culture?.nome || '';
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm 
      ? cultureName.toLowerCase().includes(searchLower) ||
        sale.ano.toString().includes(searchLower)
      : true;
    
    return matchesCulture && matchesYear && matchesSearch;
  });
  
  // Função para visualizar detalhes
  const handleViewDetails = (sale: SeedSale) => {
    setDetailSale(sale);
    setIsDetailOpen(true);
  };
  
  // Função para editar
  const handleEdit = (sale: SeedSale) => {
    setEditingSale(sale);
    setIsEditOpen(true);
  };
  
  // Função para atualizar a lista após edição
  const handleUpdate = (updatedSale: SeedSale) => {
    setSeedSales(
      seedSales.map(sale => sale.id === updatedSale.id ? updatedSale : sale)
    );
    setIsEditOpen(false);
    setEditingSale(null);
    toast.success("Registro de venda atualizado com sucesso!");
  };
  
  // Função para excluir
  const handleDelete = async (id: string) => {
    try {
      await deleteSeedSale(id);
      setSeedSales(seedSales.filter(sale => sale.id !== id));
      toast.success("Registro de venda excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir venda:", error);
      toast.error("Erro ao excluir venda");
    }
  };
  
  // Função para calcular o resultado
  const calculateResult = (sale: SeedSale): number => {
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
  
  // Função para encontrar o nome da cultura
  const getCultureName = (cultureId: string): string => {
    const culture = cultures.find(c => c.id === cultureId);
    return culture?.nome || 'Desconhecida';
  };
  
  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="md:w-1/4">
          <Select
            value={selectedCulture}
            onValueChange={setSelectedCulture}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por cultura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as culturas</SelectItem>
              {cultures.map((culture) => (
                <SelectItem key={culture.id} value={culture.id || ""}>
                  {culture.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:w-1/4">
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
        
        <div className="md:w-2/4">
          <Input
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredSales.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum registro de venda encontrado. 
          {searchTerm || selectedCulture || selectedYear 
            ? " Tente ajustar os filtros." 
            : " Clique em 'Nova Venda' para adicionar um registro."}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ano</TableHead>
                <TableHead>Cultura</TableHead>
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
                    <TableCell>{getCultureName(sale.cultura_id)}</TableCell>
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
                              Tem certeza que deseja excluir este registro de venda? Esta ação não pode ser desfeita.
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
            <DialogTitle>Detalhes da Venda de Sementes</DialogTitle>
            <DialogDescription>
              {detailSale && (
                <>
                  Cultura: {getCultureName(detailSale.cultura_id)} | Ano: {detailSale.ano}
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
                    <span>Custo das Mercadorias Vendidas:</span>
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
          title="Editar Venda de Sementes"
          description="Atualize as informações da venda"
        >
          {editingSale && (
            <SeedSaleForm
              cultures={cultures}
              organizationId={organizationId}
              seedSale={editingSale}
              onSuccess={handleUpdate}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </FormDrawer>
      ) : (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Venda de Sementes</DialogTitle>
              <DialogDescription>
                Atualize as informações da venda
              </DialogDescription>
            </DialogHeader>
            {editingSale && (
              <SeedSaleForm
                cultures={cultures}
                organizationId={organizationId}
                seedSale={editingSale}
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