"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Popover,
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Loader2, Save, Table } from "lucide-react";
import { toast } from "sonner";
import { getSafras } from "@/lib/actions/production-actions";
import { updateDividaFornecedor } from "@/lib/actions/financial-actions/dividas-fornecedores";
import { formatGenericCurrency, parseFormattedNumber } from "@/lib/utils/formatters";

interface DividasFornecedoresPopoverEditorProps {
  divida: any;
  organizationId: string;
  onUpdate: (updatedDivida: any) => void;
}

export function DividasFornecedoresPopoverEditor({
  divida,
  organizationId,
  onUpdate,
}: DividasFornecedoresPopoverEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [safras, setSafras] = useState<any[]>([]);
  const [isLoadingSafras, setIsLoadingSafras] = useState(false);
  const [editingValues, setEditingValues] = useState<Record<string, number>>({});
  
  // Carregar safras quando o popover abrir
  useEffect(() => {
    if (isOpen && safras.length === 0 && !isLoadingSafras) {
      loadSafras();
    }
    
    // Inicializar valores de edição quando o popover abrir
    if (isOpen) {
      const initialValues = getInitialValues();
      setEditingValues(initialValues);
    }
  }, [isOpen]);
  
  const loadSafras = async () => {
    try {
      setIsLoadingSafras(true);
      const safrasData = await getSafras(organizationId);
      // Ordenar safras da mais antiga para a mais recente
      const sortedSafras = [...safrasData].sort((a, b) => {
        if (a.ano_inicio !== b.ano_inicio) {
          return a.ano_inicio - b.ano_inicio;
        }
        return a.ano_fim - b.ano_fim;
      });
      
      // Filtrar 2030/31 e 2031/32
      const filteredSafras = sortedSafras.filter(s => 
        s.nome !== "2030/31" && s.nome !== "2031/32"
      );
      
      setSafras(filteredSafras);
    } catch (error) {
      console.error("Erro ao carregar safras:", error);
      toast.error("Erro ao carregar safras");
    } finally {
      setIsLoadingSafras(false);
    }
  };
  
  // Obter valores iniciais de edição
  const getInitialValues = (): Record<string, number> => {
    const valores = divida.valores_por_safra || {};
    
    if (typeof valores === 'string') {
      try {
        return JSON.parse(valores);
      } catch (e) {
        return {};
      }
    }
    
    return valores;
  };
  
  // Função para atualizar valor na edição
  const handleEditValueChange = (safraId: string, value: string) => {
    // Converte para número, usando 0 para valores inválidos
    let numValue = 0;
    if (value) {
      numValue = parseFormattedNumber(value) || 0;
    }
    
    // Atualiza o estado com o novo valor para esta safra
    setEditingValues(prev => ({
      ...prev,
      [safraId]: numValue
    }));
  };
  
  // Função para salvar alterações
  const handleSaveChanges = async () => {
    try {
      setIsUpdating(true);
      
      // Filtra apenas valores maiores que zero
      const validValues = Object.fromEntries(
        Object.entries(editingValues)
          .filter(([_, value]) => value > 0)
      );
      
      // Chama a API para atualizar a dívida
      const updatedDivida = await updateDividaFornecedor(
        divida.id,
        {
          nome: divida.nome,
          categoria: divida.categoria,
          moeda: divida.moeda,
          valores_por_safra: validValues,
        },
        organizationId
      );
      
      onUpdate(updatedDivida);
      setIsOpen(false);
      
      toast.success("Valores por safra atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar valores por safra:", error);
      toast.error("Ocorreu um erro ao atualizar os valores");
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
          title="Editar Valores por Safra"
        >
          <Table className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-4">
        <div className="grid gap-4 w-[600px] max-h-[400px] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-sm">Editar Valores por Safra</h4>
            <Badge variant="outline" className="ml-auto">
              {divida.nome} • {divida.categoria} • {divida.moeda || "BRL"}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {safras.map(safra => {
              const currentValue = editingValues[safra.id] || 0;
              
              return (
                <div key={safra.id} className="space-y-2">
                  <label className="text-sm font-medium">{safra.nome}</label>
                  <Input
                    type="text"
                    value={formatGenericCurrency(currentValue, divida.moeda || "BRL")}
                    onChange={(e) => handleEditValueChange(safra.id, e.target.value)}
                    placeholder="0"
                    className="text-right"
                  />
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button 
              size="sm"
              onClick={handleSaveChanges}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}