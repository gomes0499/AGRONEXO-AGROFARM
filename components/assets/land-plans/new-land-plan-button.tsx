"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AssetFormModal } from "../common/asset-form-modal";
import { LandPlanForm } from "./land-plan-form";
import { createLandAcquisition } from "@/lib/actions/land-acquisition-actions";
import {
  landAcquisitionFormSchema,
  type LandAcquisitionFormValues,
  type LandAcquisition,
} from "@/schemas/patrimonio/land-acquisitions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/auth/user-provider";

interface NewLandPlanButtonProps {
  organizationId: string;
}

export function NewLandPlanButton({ organizationId }: NewLandPlanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const form = useForm<LandAcquisitionFormValues>({
    resolver: zodResolver(landAcquisitionFormSchema),
    defaultValues: {
      nome_fazenda: "",
      ano: new Date().getFullYear(),
      hectares: 0,
      sacas: 0,
      valor_total: 0,
      tipo: "PLANEJADO",
    },
  });

  const handleSubmit = async (data: LandAcquisitionFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createLandAcquisition({
        ...data,
        organizacao_id: organizationId,
      } as LandAcquisition);

      if ('error' in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Plano de aquisição criado com sucesso");
      setIsOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error("Erro ao criar plano de aquisição");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Novo Plano
      </Button>

      <AssetFormModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Novo Plano de Aquisição"
        description="Cadastre um novo plano de aquisição de terras"
        isSubmitting={isSubmitting}
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <Form {...form}>
          <LandPlanForm 
            organizationId={organizationId}
            onSubmit={(data: LandAcquisition) => {
              form.setValue('nome_fazenda', data.nome_fazenda);
              form.setValue('ano', data.ano);
              form.setValue('hectares', data.hectares);
              form.setValue('sacas', data.sacas);
              form.setValue('valor_total', data.valor_total);
            }}
          />
        </Form>
      </AssetFormModal>
    </>
  );
}
