import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { leaseFormSchema, type LeaseFormValues, type Lease } from "@/schemas/properties";
import { createLease, updateLease, getPropertyById } from "@/lib/actions/property-actions";

interface UseLeaseFormProps {
  organizationId: string;
  propertyId: string;
  lease?: Lease;
  mode: "create" | "edit";
  onSuccess?: () => void;
}

export function useLeaseForm({
  organizationId,
  propertyId,
  lease,
  mode,
  onSuccess,
}: UseLeaseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Garantir que custos_por_ano tenha pelo menos uma entrada
  const defaultCustos = lease?.custos_por_ano || {};
  // Se não tiver entradas, adicionar ano atual com valor 0
  if (Object.keys(defaultCustos).length === 0) {
    const currentYear = new Date().getFullYear().toString();
    defaultCustos[currentYear] = 0;
  }
  
  const form = useForm({
    resolver: zodResolver(leaseFormSchema),
    defaultValues: {
      propriedade_id: propertyId,
      ...((lease as any)?.safra_id ? { safra_id: (lease as any).safra_id } : { safra_id: "" }),
      numero_arrendamento: lease?.numero_arrendamento || "",
      area_fazenda: lease?.area_fazenda || 0,
      area_arrendada: lease?.area_arrendada || 0,
      nome_fazenda: lease?.nome_fazenda || "",
      arrendantes: lease?.arrendantes || "",
      data_inicio: lease?.data_inicio ? new Date(lease.data_inicio) : new Date(),
      data_termino: lease?.data_termino ? new Date(lease.data_termino) : new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
      custo_hectare: lease?.custo_hectare || 0,
      tipo_pagamento: lease?.tipo_pagamento || "SACAS",
      custos_por_ano: defaultCustos,
      ativo: lease?.ativo ?? true,
      observacoes: lease?.observacoes || "",
    },
    mode: "onSubmit", // Validar apenas ao enviar o formulário
  });

  // Buscar dados da propriedade para preenchimento automático (apenas no modo create)
  useEffect(() => {
    const fetchPropertyData = async () => {
      if (mode === "create" && propertyId && !lease) {
        try {
          const property = await getPropertyById(propertyId);
          
          // Preencher automaticamente os campos relacionados à propriedade
          form.setValue("propriedade_id", propertyId);
          // Handle possible null values for area_total
          form.setValue("area_fazenda", property.area_total || 0);
          form.setValue("nome_fazenda", property.nome);
        } catch (error) {
          console.error("Erro ao buscar dados da propriedade:", error);
          toast.error("Erro ao buscar dados da propriedade");
        }
      }
    };

    fetchPropertyData();
  }, [propertyId, mode, lease, form]);

  const onSubmit = async (values: LeaseFormValues) => {
    try {
      setIsLoading(true);
      toast.info("Processando formulário...");

      if (!(values as any).safra_id) {
        toast.error("Selecione uma safra");
        return { success: false };
      }
      
      if (!values.numero_arrendamento) {
        toast.error("Informe o número do arrendamento");
        return { success: false };
      }
      
      if (!values.nome_fazenda) {
        toast.error("Informe o nome da fazenda");
        return { success: false };
      }
      
      if (!values.area_arrendada || values.area_arrendada <= 0) {
        toast.error("A área arrendada deve ser maior que zero");
        return { success: false };
      }
      
      // Verificar se custos_por_ano não está vazio
      if (!values.custos_por_ano || Object.keys(values.custos_por_ano).length === 0) {
        // Adicionar pelo menos um par chave-valor padrão se estiver vazio
        const currentYear = new Date().getFullYear().toString();
        const calculatedCost = values.area_arrendada * (values.custo_hectare || 0);
        values.custos_por_ano = { [currentYear]: calculatedCost };
      }
 
      if (mode === "edit" && lease?.id) {
        await updateLease(lease.id, values);
        toast.success("Arrendamento atualizado com sucesso!");
      } else {
        const createdLease = await createLease(organizationId, propertyId, values);
        toast.success("Arrendamento criado com sucesso!");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          router.push(`/dashboard/properties/${propertyId}`);
          router.refresh();
        }, 1000);
      }

      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar arrendamento:", error);
      
      // Melhorar exibição de erros
      let errorMessage = "Ocorreu um erro ao salvar o arrendamento";
      
      if (error instanceof Error) {
        // Mensagens mais amigáveis para erros conhecidos
        if (error.message.includes("Já existe um arrendamento")) {
          errorMessage = error.message;
        } else if (error.message.includes("É necessário informar")) {
          errorMessage = error.message;
        } else if (error.message.includes("Validação de arrendamento")) {
          errorMessage = error.message;
        } else if (error.message.includes("A área arrendada não pode ser maior")) {
          errorMessage = error.message;
        } else if (error.message.includes("A data de término deve ser posterior")) {
          errorMessage = error.message;
        } else {
          errorMessage = `${errorMessage}: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
  };

  return {
    form,
    isLoading,
    onSubmit,
    resetForm,
  };
}