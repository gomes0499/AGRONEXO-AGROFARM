import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { propertyFormSchema, type PropertyFormValues, type Property } from "@/schemas/properties";
import { createProperty, updateProperty, getPropertyById } from "@/lib/actions/property-actions";

interface UsePropertyFormProps {
  organizationId: string;
  propertyId?: string;
  mode: "create" | "edit";
  onSuccess?: () => void;
  initialData?: any; // Property data for edit mode
}

export function usePropertyForm({
  organizationId,
  propertyId,
  mode,
  onSuccess,
  initialData,
}: UsePropertyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imagem || null);
  // A tabela já está pronta, não precisamos mais dessa verificação
  const tableReady = true;

  // Use 'any' as a temporary workaround for the complex resolver typing issue
  const form = useForm({
    resolver: zodResolver(propertyFormSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      // Garantir que valores numéricos sejam corretos
      area_total: initialData.area_total || null,
      area_cultivada: initialData.area_cultivada || null,
      valor_atual: initialData.valor_atual || null,
      avaliacao_banco: initialData.avaliacao_banco || null,
      ano_aquisicao: initialData.ano_aquisicao || null,
      // Garantir que valores de data sejam Date ou null
      data_inicio: initialData.data_inicio ? new Date(initialData.data_inicio) : null,
      data_termino: initialData.data_termino ? new Date(initialData.data_termino) : null,
      // Campo de armazenagem
      possui_armazem: initialData.possui_armazem || false,
    } : {
      nome: "",
      proprietario: "",
      cidade: "",
      estado: "",
      numero_matricula: "",
      area_total: null,
      area_cultivada: null,
      valor_atual: null, // NULL em vez de 0 para evitar constraint
      tipo: "PROPRIO" as const,
      ano_aquisicao: new Date().getFullYear(),
      onus: "",
      avaliacao_banco: null, // NULL em vez de 0 para evitar constraint
      // Valores para propriedades arrendadas
      cartorio_registro: "",
      numero_car: "",
      data_inicio: undefined,
      data_termino: undefined,
      tipo_anuencia: "",
      // Campo de armazenagem
      possui_armazem: false,
    },
  }) as any;

  // Carregar dados da propriedade quando estiver em modo de edição
  useEffect(() => {
    const loadPropertyData = async () => {
      if (mode === "edit" && propertyId && tableReady) {
        try {
          const property = await getPropertyById(propertyId);
          
          // Atualizar os valores do formulário com os dados da propriedade
          form.reset({
            nome: property.nome,
            proprietario: property.proprietario,
            cidade: property.cidade,
            estado: property.estado,
            numero_matricula: property.numero_matricula,
            area_total: property.area_total,
            area_cultivada: property.area_cultivada || 0,
            valor_atual: property.valor_atual || 0,
            tipo: property.tipo,
            ano_aquisicao: property.ano_aquisicao || new Date().getFullYear(),
            onus: property.onus || "",
            avaliacao_banco: property.avaliacao_banco || 0,
            cartorio_registro: property.cartorio_registro || "",
            numero_car: property.numero_car || "",
            data_inicio: property.data_inicio ? new Date(property.data_inicio) : undefined,
            data_termino: property.data_termino ? new Date(property.data_termino) : undefined,
            tipo_anuencia: property.tipo_anuencia || "",
            possui_armazem: property.possui_armazem || false,
          });

          // Atualizar a imagem se existir
          if (property.imagem) {
            setImageUrl(property.imagem);
          }
        } catch (error) {
          console.error("Erro ao carregar dados da propriedade:", error);
          toast.error("Erro ao carregar os dados da propriedade");
        }
      }
    };

    loadPropertyData();
  }, [mode, propertyId, form, tableReady]);

  const onSubmit = async (values: PropertyFormValues) => {
    try {
      setIsLoading(true);

      const dataWithImage = {
        ...values,
        imagem: imageUrl,
      };

      if (mode === "edit" && propertyId) {
        await updateProperty(propertyId, dataWithImage);
        toast.success("Propriedade atualizada com sucesso!");
      } else {
        await createProperty(organizationId, dataWithImage);
        toast.success("Propriedade criada com sucesso!");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/properties");
      }

      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar propriedade:", error);
      toast.error("Ocorreu um erro ao salvar a propriedade.");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setImageUrl(null);
  };

  return {
    form,
    isLoading,
    imageUrl,
    setImageUrl,
    onSubmit,
    resetForm,
    tableReady,
  };
}