"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyField } from "@/components/shared/currency-field";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEquipment,
  updateEquipment,
} from "@/lib/actions/patrimonio-actions";
import { Loader2 } from "lucide-react";
import { equipmentFormSchema, type EquipmentFormValues } from "@/schemas/patrimonio/equipment";

// Lista de equipamentos agrícolas
const EQUIPMENT_OPTIONS = [
  // Tratores
  "TRATOR_4X2",
  "TRATOR_4X4", 
  "MICRO_TRATOR",
  "TRATOR_ESTEIRA",
  "TRATOR_FRUTEIRO",
  "TRATOR_COMPACTO",
  
  // Máquinas de Colheita
  "COLHEITADEIRA",
  "COLHEDORA_CANA",
  "COLHEDORA_ALGODAO",
  "CEIFADEIRA",
  "DEBULHADORA",
  "DESCASCADORA",
  
  // Máquinas de Plantio
  "PLANTADEIRA",
  "SEMEADEIRA",
  "TRANSPLANTADORA",
  "DISTRIBUIDORA_CALCARIO",
  "DISTRIBUIDORA_FERTILIZANTE",
  "SULCADOR",
  
  // Preparo do Solo
  "ARADO",
  "GRADE_ARADORA",
  "GRADE_NIVELADORA",
  "SUBSOLADOR",
  "ESCARIFICADOR",
  "CULTIVADOR",
  "ENXADA_ROTATIVA",
  "ROLO_COMPACTADOR",
  
  // Pulverizadores
  "PULVERIZADOR_AUTOPROPELIDO",
  "PULVERIZADOR_ARRASTO",
  "PULVERIZADOR_COSTAL",
  "ATOMIZADOR",
  "NEBULIZADOR",
  
  // Irrigação
  "PIVO_CENTRAL",
  "ASPERSOR",
  "SISTEMA_GOTEJAMENTO",
  "BOMBA_AGUA",
  "MOTOBOMBA",
  "CONJUNTO_MOTOBOMBA",
  
  // Transporte
  "CARRETA_GRANELEIRA",
  "CARRETA_BASCULANTE",
  "REBOQUE",
  "TRANSBORDO",
  "CAMINHAO",
  "GUINCHO",
  
  // Pecuária
  "ORDENHADEIRA",
  "RESFRIADOR_LEITE",
  "MISTURADOR_RACAO",
  "CARROCA_RACAO",
  "BEBEDOURO",
  "CERCA_ELETRICA",
  
  // Outros
  "GERADOR",
  "COMPRESSOR",
  "ROCADEIRA",
  "MOTOSSERRA",
  "SOPRADOR",
  "LAVADORA_ALTA_PRESSAO",
  "SOLDADORA",
  "OUTROS"
];

// Lista das principais marcas de equipamentos agrícolas
const BRAND_OPTIONS = [
  // Marcas Internacionais - Tratores e Máquinas Pesadas
  "JOHN_DEERE",
  "CASE_IH", 
  "NEW_HOLLAND",
  "MASSEY_FERGUSON",
  "VALTRA",
  "FENDT",
  "DEUTZ_FAHR",
  "CLAAS",
  "KUBOTA",
  "YANMAR",
  "MAHINDRA",
  "FORD",
  "INTERNATIONAL_HARVESTER",
  
  // Marcas de Máquinas de Construção/Terraplanagem
  "CATERPILLAR",
  "VOLVO",
  "KOMATSU",
  "JCB",
  "LIEBHERR",
  "HITACHI",
  "HYUNDAI",
  
  // Marcas Nacionais - Implementos e Máquinas
  "STARA",
  "JACTO",
  "MARCHESAN",
  "BALDAN",
  "AGRALE",
  "MONTANA",
  "SEMEATO",
  "JUMIL",
  "TATU",
  "JAN",
  "FANKHAUSER",
  "CARRETA_FEMA",
  "SERMAG",
  "RIGESA",
  "PICCIN",
  
  // Marcas de Pulverizadores e Implementos Especializados
  "KUHN",
  "AMAZONE",
  "LEMKEN",
  "POTTINGER",
  "HORSCH",
  "VADERSTAD",
  "GREAT_PLAINS",
  "KINZE",
  
  // Marcas de Sistemas de Irrigação
  "VALLEY",
  "LINDSAY",
  "REINKE",
  "PIVOT",
  "KREBS",
  "IRRIGABRAS",
  
  // Marcas de Equipamentos Pecuários
  "DELAVAL",
  "LELY",
  "GEA",
  "WESTFALIA_SURGE",
  "ALFA_LAVAL",
  "FULLWOOD",
  
  // Marcas de Geradores e Motores
  "HONDA",
  "YAMAHA",
  "BRANCO",
  "TOYAMA",
  "ROMAGNOLE",
  "WEG",
  "STEMAC",
  
  // Marcas de Ferramentas e Equipamentos Menores
  "STIHL",
  "HUSQVARNA",
  "ECHO",
  "MAKITA",
  "BOSCH",
  "KARCHER",
  
  // Outras marcas
  "OUTROS"
].sort();

interface EquipmentFormProps {
  organizationId: string;
  initialData?: any;
  onSuccess?: (equipment: any) => void;
  onCancel?: () => void;
}

export function EquipmentForm({
  organizationId,
  initialData,
  onSuccess,
  onCancel,
}: EquipmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData?.id;

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      equipamento: initialData?.equipamento || "",
      equipamento_outro: initialData?.equipamento_outro || "",
      ano_fabricacao: initialData?.ano_fabricacao || new Date().getFullYear(),
      marca: initialData?.marca || "",
      marca_outro: initialData?.marca_outro || "",
      modelo: initialData?.modelo || "",
      quantidade: initialData?.quantidade || 1,
      valor_unitario: initialData?.valor_unitario || 0,
    },
  });

  // Watch form values for calculations and conditional fields
  const equipamento = form.watch("equipamento");
  const marca = form.watch("marca");
  const quantidade = form.watch("quantidade") || 0;
  const valorUnitario = form.watch("valor_unitario") || 0;
  const anoFabricacao = form.watch("ano_fabricacao") || new Date().getFullYear();
  
  // Calcular valor total automaticamente
  const valorTotal = useMemo(() => {
    return quantidade * valorUnitario;
  }, [quantidade, valorUnitario]);


  const onSubmit = async (values: EquipmentFormValues) => {
    try {
      setIsSubmitting(true);

      // Preparar dados para envio incluindo campos calculados
      const dataToSubmit = {
        organizacao_id: organizationId,
        ...values,
        valor_total: valorTotal,
      };

      let result;
      if (isEditing && initialData?.id) {
        result = await updateEquipment(initialData.id, dataToSubmit);
        toast.success("Equipamento atualizado com sucesso!");
      } else {
        result = await createEquipment(dataToSubmit);
        toast.success("Equipamento criado com sucesso!");
      }

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      if (onSuccess && result?.data) {
        onSuccess(result.data);
      }
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error);
      toast.error("Erro ao salvar equipamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="equipamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o equipamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EQUIPMENT_OPTIONS.map((equipment) => (
                      <SelectItem key={equipment} value={equipment}>
                        {equipment.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ano_fabricacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano de Fabricação</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 2020"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {equipamento === "OUTROS" && (
          <FormField
            control={form.control}
            name="equipamento_outro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especifique o Equipamento</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Digite o nome do equipamento" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a marca" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BRAND_OPTIONS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modelo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 6155J, MX135" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {marca === "OUTROS" && (
          <FormField
            control={form.control}
            name="marca_outro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especifique a Marca</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Digite o nome da marca" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <CurrencyField
            name="valor_unitario"
            label="Valor Unitário"
            control={form.control}
            placeholder="R$ 0,00"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Valor Total</label>
          <Input
            type="text"
            value={formatGenericCurrency(valorTotal, "BRL")}
            disabled
            className="bg-muted"
          />
        </div>


        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}