"use client";

import { useState } from "react";
import { Price } from "@/schemas/commercial";
import { Harvest } from "@/schemas/production";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FormDrawer } from "@/components/production/common/form-drawer";
import { PriceForm } from "./price-form";
import { PriceOverviewCard } from "@/components/commercial/price-overview-card";
import { toast } from "sonner";
import { deletePrice } from "@/lib/actions/commercial-actions";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

// Extended price interface that includes the joined safra data
interface PriceWithSafra extends Price {
  safra?: {
    id?: string;
    nome?: string;
    ano_inicio?: number;
    ano_fim?: number;
    organizacao_id?: string;
  };
}

interface PriceListProps {
  initialPrices: PriceWithSafra[];
  harvests: Harvest[];
  organizationId: string;
}

export function PriceList({ initialPrices, harvests, organizationId }: PriceListProps) {
  const [prices, setPrices] = useState<PriceWithSafra[]>(initialPrices);
  const [selectedHarvest, setSelectedHarvest] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [detailPrice, setDetailPrice] = useState<PriceWithSafra | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceWithSafra | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Filtrar por safra e termo de busca
  const filteredPrices = prices.filter(price => {
    const matchesSafra = selectedHarvest === "all" ? true : price.safra_id === selectedHarvest;
    const formattedDate = price.data_referencia 
      ? format(new Date(price.data_referencia), "dd/MM/yyyy")
      : "";
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = searchTerm 
      ? (price.safra?.nome && price.safra.nome.toLowerCase().includes(searchLower)) ||
        formattedDate.includes(searchLower)
      : true;
    
    return matchesSafra && matchesSearch;
  });
  
  // Função para visualizar detalhes
  const handleViewDetails = (price: PriceWithSafra) => {
    setDetailPrice(price);
    setIsDetailOpen(true);
  };
  
  // Função para editar
  const handleEdit = (price: PriceWithSafra) => {
    setEditingPrice(price);
    setIsEditOpen(true);
  };
  
  // Função para atualizar a lista após edição
  const handleUpdate = (updatedPrice: PriceWithSafra) => {
    setPrices(
      prices.map(price => price.id === updatedPrice.id ? updatedPrice : price)
    );
    setIsEditOpen(false);
    setEditingPrice(null);
    toast.success("Registro de preço atualizado com sucesso!");
  };
  
  // Função para excluir
  const handleDelete = async (id: string) => {
    try {
      await deletePrice(id);
      setPrices(prices.filter(price => price.id !== id));
      toast.success("Registro de preço excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir preço:", error);
      toast.error("Erro ao excluir preço");
    }
  };
  
  // Formatar preços para exibição
  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "-";
    return formatCurrency(price);
  };
  
  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="md:w-1/3">
          <Select
            value={selectedHarvest}
            onValueChange={setSelectedHarvest}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por safra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as safras</SelectItem>
              {harvests.map((harvest) => (
                <SelectItem key={harvest.id} value={harvest.id || ""}>
                  {harvest.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:w-2/3">
          <Input
            placeholder="Pesquisar por data ou safra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredPrices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum registro de preço encontrado. 
          {searchTerm || selectedHarvest 
            ? " Tente ajustar os filtros." 
            : " Clique em 'Novo Preço' para adicionar um registro."}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Safra</TableHead>
                <TableHead>Soja (R$/sc)</TableHead>
                <TableHead>Milho (R$/sc)</TableHead>
                <TableHead>Algodão (R$/@)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrices.map((price) => (
                <TableRow key={price.id}>
                  <TableCell>
                    {price.data_referencia 
                      ? format(new Date(price.data_referencia), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>{price.safra?.nome || "-"}</TableCell>
                  <TableCell>{formatPrice(price.preco_soja_brl)}</TableCell>
                  <TableCell>{formatPrice(price.preco_milho)}</TableCell>
                  <TableCell>{formatPrice(price.preco_algodao_bruto)}</TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(price)}
                          >
                            <Info className="h-4 w-4" />
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
                            onClick={() => handleEdit(price)}
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
                          <AlertDialogTitle>Excluir Registro de Preço</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este registro de preço? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground"
                            onClick={() => price.id && handleDelete(price.id)}
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro de Preço</DialogTitle>
            <DialogDescription>
              {detailPrice?.data_referencia && 
                format(new Date(detailPrice.data_referencia), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          {detailPrice && <PriceOverviewCard price={detailPrice} />}
        </DialogContent>
      </Dialog>
      
      {/* Formulário de Edição */}
      {isMobile ? (
        <FormDrawer
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Editar Registro de Preço"
          description="Atualize as informações do registro de preço"
        >
          {editingPrice && (
            <PriceForm
              harvests={harvests}
              organizationId={organizationId}
              price={editingPrice}
              onSuccess={handleUpdate}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </FormDrawer>
      ) : (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Registro de Preço</DialogTitle>
              <DialogDescription>
                Atualize as informações do registro de preço
              </DialogDescription>
            </DialogHeader>
            {editingPrice && (
              <PriceForm
                harvests={harvests}
                organizationId={organizationId}
                price={editingPrice}
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