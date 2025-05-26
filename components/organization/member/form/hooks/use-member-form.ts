import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createMemberAccount } from "@/lib/actions/invitation-actions";
import { 
  memberSchema, 
  type MemberFormValues, 
  type MemberFormProps 
} from "../schemas/member-form-schema";
import { UserRole } from "@/lib/auth/roles";

interface UseMemberFormProps {
  organizationId: string
  existingMemberId?: string
  onSuccess?: () => void
}

export function useMemberForm({
  organizationId,
  existingMemberId,
  onSuccess,
}: UseMemberFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSpouseFields, setShowSpouseFields] = useState(false);

  // Inicializa o formulário
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      email: "",
      nome: "",
      telefone: "",
      funcao: UserRole.MEMBRO,
      cpf: "",
      rg: "",
      orgaoEmissor: "",
      estadoEmissor: "",
      dataNascimento: undefined,
      naturalidade: "",
      estadoCivil: "",
      nomeConjuge: "",
      cpfConjuge: "",
      rgConjuge: "",
      orgaoEmissorConjuge: "",
      dataNascimentoConjuge: undefined,
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      celular: "",
      inscricaoProdutorRural: "",
    },
  });

  // Observa mudanças no estado civil para mostrar/esconder campos do cônjuge
  const estadoCivil = form.watch("estadoCivil");
  const shouldShowSpouseFields = estadoCivil === "casado" || estadoCivil === "uniao_estavel";

  // Função para lidar com a submissão do formulário
  async function onSubmit(values: MemberFormValues) {
    setIsLoading(true);

    try {
      // Prepara os metadados do usuário
      const userMetadata = {
        nome: values.nome,
        telefone: values.telefone || undefined,
        cpf: values.cpf || undefined,
        rg: values.rg || undefined,
        orgaoEmissor: values.orgaoEmissor || undefined,
        estadoEmissor: values.estadoEmissor || undefined,
        dataNascimento: values.dataNascimento?.toISOString() || undefined,
        naturalidade: values.naturalidade || undefined,
        estadoCivil: values.estadoCivil || undefined,
        nomeConjuge: values.nomeConjuge || undefined,
        cpfConjuge: values.cpfConjuge || undefined,
        rgConjuge: values.rgConjuge || undefined,
        orgaoEmissorConjuge: values.orgaoEmissorConjuge || undefined,
        dataNascimentoConjuge: values.dataNascimentoConjuge?.toISOString() || undefined,
        cep: values.cep || undefined,
        endereco: values.endereco || undefined,
        numero: values.numero || undefined,
        complemento: values.complemento || undefined,
        bairro: values.bairro || undefined,
        cidade: values.cidade || undefined,
        estado: values.estado || undefined,
        celular: values.celular || undefined,
        inscricaoProdutorRural: values.inscricaoProdutorRural || undefined,
      };

      // Remove campos undefined do metadata
      const cleanMetadata = Object.fromEntries(
        Object.entries(userMetadata).filter(([_, value]) => value !== undefined)
      );

      const result = await createMemberAccount(
        values.email,
        organizationId,
      );

      if (result.success) {
        toast.success(
          `Membro adicionado com sucesso! Um email de convite foi enviado.`
        );
        form.reset();
        if (onSuccess) onSuccess();
        router.refresh();
        return { success: true };
      } else {
        toast.error(result.error || "Erro ao adicionar membro");
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error("Erro ao adicionar membro:", error);
      toast.error("Erro inesperado ao adicionar membro");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    form.reset();
    setShowSpouseFields(false);
  };

  const handleFormSubmit = async (values: MemberFormValues) => {
    await onSubmit(values)
  }

  return {
    form,
    isLoading,
    showSpouseFields,
    setShowSpouseFields,
    shouldShowSpouseFields,
    handleFormSubmit,
    resetForm,
  };
}