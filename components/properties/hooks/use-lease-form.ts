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

  const form = useForm({
    resolver: zodResolver(leaseFormSchema),
    defaultValues: {
      propriedade_id: propertyId, // Adicionar o propertyId
      numero_arrendamento: lease?.numero_arrendamento || "",
      area_fazenda: lease?.area_fazenda || 0,
      area_arrendada: lease?.area_arrendada || 0,
      nome_fazenda: lease?.nome_fazenda || "",
      arrendantes: lease?.arrendantes || "",
      data_inicio: lease?.data_inicio ? new Date(lease.data_inicio) : new Date(),
      data_termino: lease?.data_termino ? new Date(lease.data_termino) : new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
      custo_hectare: lease?.custo_hectare || 0,
      // These fields are not part of the schema but needed for compatibility
      custos_por_ano: lease?.custos_por_ano || {},
    },
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
      
      console.log("useLeaseForm onSubmit called with:", { mode, organizationId, propertyId, values });

      if (mode === "edit" && lease?.id) {
        console.log("Updating lease:", lease.id);
        await updateLease(lease.id, values);
        toast.success("Arrendamento atualizado com sucesso!");
      } else {
        console.log("Creating new lease");
        await createLease(organizationId, propertyId, values);
        toast.success("Arrendamento criado com sucesso!");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/properties/${propertyId}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar arrendamento:", error);
      toast.error(`Ocorreu um erro ao salvar o arrendamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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