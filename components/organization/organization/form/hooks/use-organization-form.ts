import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/lib/auth/roles";
import { uploadOrganizationLogo } from "@/lib/actions/upload-actions";
import { unformat } from "@/lib/utils/format";
import { 
  organizationSchema, 
  type OrganizationFormValues, 
  type OrganizationFormProps 
} from "../schemas/organization-form-schema";

export function useOrganizationForm({
  userId,
  organizationData,
  mode = "create",
  onClose,
  onSuccess,
}: Pick<OrganizationFormProps, "userId" | "organizationData" | "mode" | "onClose" | "onSuccess">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(
    organizationData?.logo || null
  );
  const supabase = createClient();

  // Inicializa o formulário
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      nome: organizationData?.nome || "",
      slug: organizationData?.slug || "",
      email: organizationData?.email || "",
      telefone: organizationData?.telefone || "",
      website: organizationData?.website || "",
      cpf: organizationData?.cpf || "",
      cnpj: organizationData?.cnpj || "",
      tipo: organizationData?.tipo || (organizationData?.cnpj ? "juridica" : "fisica"),
      endereco: organizationData?.endereco || "",
      numero: organizationData?.numero || "",
      complemento: organizationData?.complemento || "",
      bairro: organizationData?.bairro || "",
      cidade: organizationData?.cidade || "",
      estado: organizationData?.estado || "",
      cep: organizationData?.cep || "",
      inscricao_estadual: organizationData?.inscricao_estadual || "",
      roteiro: organizationData?.roteiro || "",
      latitude: organizationData?.latitude?.toString() || "",
      longitude: organizationData?.longitude?.toString() || "",
      estrutura_societaria: organizationData?.estrutura_societaria || [],
      cor_primaria: organizationData?.cor_primaria || "#0066FF",
      cor_secundaria: organizationData?.cor_secundaria || "#FF6B00",
      cor_fundo: organizationData?.cor_fundo || "#FFFFFF",
      cor_texto: organizationData?.cor_texto || "#000000",
    },
  });

  // Atualiza o formulário quando os dados da organização mudam
  useEffect(() => {
    if (organizationData && mode === "edit") {
      const formData = {
        nome: organizationData.nome || "",
        slug: organizationData.slug || "",
        email: organizationData.email || "",
        telefone: organizationData.telefone || "",
        website: organizationData.website || "",
        cpf: organizationData.cpf || "",
        cnpj: organizationData.cnpj || "",
        tipo: organizationData.tipo || (organizationData.cnpj ? "juridica" : "fisica"),
        endereco: organizationData.endereco || "",
        numero: organizationData.numero || "",
        complemento: organizationData.complemento || "",
        bairro: organizationData.bairro || "",
        cidade: organizationData.cidade || "",
        estado: organizationData.estado || "",
        cep: organizationData.cep || "",
        inscricao_estadual: organizationData.inscricao_estadual || "",
        roteiro: organizationData.roteiro || "",
        latitude: organizationData.latitude?.toString() || "",
        longitude: organizationData.longitude?.toString() || "",
        estrutura_societaria: organizationData.estrutura_societaria || [],
        cor_primaria: organizationData.cor_primaria || "#0066FF",
        cor_secundaria: organizationData.cor_secundaria || "#FF6B00",
        cor_fundo: organizationData.cor_fundo || "#FFFFFF",
        cor_texto: organizationData.cor_texto || "#000000",
      };
      form.reset(formData as OrganizationFormValues);
      setLogoUrl(organizationData.logo || null);
    }
  }, [organizationData, mode, form]);

  // Função para gerar slug a partir do nome
  const generateSlug = () => {
    const nome = form.getValues("nome");
    if (!nome) return;

    const slug = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    form.setValue("slug", slug);
  };

  // Função para lidar com a submissão do formulário
  async function onSubmit(values: OrganizationFormValues) {
    setIsLoading(true);

    try {
      // Verifica se o slug já existe (apenas para criação ou se mudou o slug na edição)
      if (
        mode === "create" ||
        (mode === "edit" && values.slug !== organizationData?.slug)
      ) {
        const { data: existingOrg } = await supabase
          .from("organizacoes")
          .select("id")
          .eq("slug", values.slug)
          .single();

        if (existingOrg) {
          form.setError("slug", {
            type: "manual",
            message: "Este identificador já está em uso",
          });
          setIsLoading(false);
          return { success: false, shouldReturnToStep1: true };
        }
      }

      // Prepara os dados da organização
      const orgData = {
        nome: values.nome,
        slug: values.slug,
        email: values.email || null,
        telefone: values.telefone ? unformat(values.telefone) || null : null,
        website: values.website || null,
        cpf: values.tipo === "fisica" ? unformat(values.cpf) || null : null,
        cnpj: values.tipo === "juridica" ? unformat(values.cnpj) || null : null,
        tipo: values.tipo,
        endereco: values.endereco || null,
        numero: values.numero || null,
        complemento: values.complemento || null,
        bairro: values.bairro || null,
        cidade: values.cidade || null,
        estado: values.estado || null,
        cep: values.cep ? unformat(values.cep) || null : null,
        inscricao_estadual: values.inscricao_estadual || null,
        roteiro: values.roteiro || null,
        latitude: values.latitude || null,
        longitude: values.longitude || null,
        logo: logoUrl,
        estrutura_societaria: values.estrutura_societaria || [],
        cor_primaria: values.cor_primaria,
        cor_secundaria: values.cor_secundaria,
        cor_fundo: values.cor_fundo,
        cor_texto: values.cor_texto,
      };

      if (mode === "edit" && organizationData?.id) {
        // Atualiza organização existente
        const { data: updatedOrg, error: updateError } = await supabase
          .from("organizacoes")
          .update(orgData)
          .eq("id", organizationData.id)
          .select()
          .single();

        if (updateError) throw updateError;

        toast.success("Organização atualizada com sucesso");
        if (onSuccess) onSuccess();
        if (onClose) onClose();
        return { success: true };
      } else {
        // Cria nova organização
        const { data: newOrg, error: createError } = await supabase
          .from("organizacoes")
          .insert(orgData)
          .select()
          .single();

        if (createError) throw createError;

        // Upload do logo se houver
        if (logoUrl && logoUrl.startsWith("blob:")) {
          try {
            const uploadComponent = document.querySelector(
              '[data-organization-upload="true"]'
            );
            if (uploadComponent) {
              const temporaryFile = (uploadComponent as any).__temporaryImage;

              if (temporaryFile && temporaryFile instanceof File) {
                const formData = new FormData();
                formData.append("file", temporaryFile);

                const uploadResult = await uploadOrganizationLogo(
                  newOrg.id,
                  formData
                );

                if (!uploadResult.success) {
                  console.error(
                    "Erro ao fazer upload do logo:",
                    uploadResult.error
                  );
                  toast.error(
                    "A organização foi criada, mas houve um erro ao salvar o logo."
                  );
                }
              }
            }
          } catch (uploadError) {
            console.error(
              "Erro ao processar upload do logo temporário:",
              uploadError
            );
            toast.error(
              "A organização foi criada, mas houve um erro ao salvar o logo."
            );
          }
        }

        // Cria associação entre usuário e organização
        if (userId) {
          const { error: associationError } = await supabase
            .from("associacoes")
            .insert({
              usuario_id: userId,
              organizacao_id: newOrg.id,
              funcao: UserRole.PROPRIETARIO,
              eh_proprietario: true,
            });

          if (associationError) throw associationError;

          // Atualiza o perfil do usuário com a organização nos metadados
          const { error: updateUserError } = await supabase.auth.updateUser({
            data: {
              organizacao: {
                id: newOrg.id,
                nome: newOrg.nome,
                slug: newOrg.slug,
              },
            },
          });

          if (updateUserError) throw updateUserError;
        }

        toast.success("Organização criada com sucesso");
        if (onSuccess) onSuccess();
        if (onClose) onClose();
        router.push("/dashboard");
        return { success: true };
      }
    } catch (error: any) {
      console.error("Erro ao salvar organização:", error);
      toast.error("Erro ao salvar organização: " + error.message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    if (mode === "edit" && organizationData) {
      // No modo edição, volta aos dados originais
      form.reset({
        nome: organizationData.nome || "",
        slug: organizationData.slug || "",
        email: organizationData.email || "",
        telefone: organizationData.telefone || "",
        website: organizationData.website || "",
        cpf: organizationData.cpf || "",
        cnpj: organizationData.cnpj || "",
        tipo: organizationData.cnpj ? "juridica" : "fisica",
        endereco: organizationData.endereco || "",
        numero: organizationData.numero || "",
        complemento: organizationData.complemento || "",
        bairro: organizationData.bairro || "",
        cidade: organizationData.cidade || "",
        estado: organizationData.estado || "",
        cep: organizationData.cep || "",
        inscricao_estadual: organizationData.inscricao_estadual || "",
        roteiro: organizationData.roteiro || "",
        latitude: organizationData.latitude?.toString() || "",
        longitude: organizationData.longitude?.toString() || "",
      });
      setLogoUrl(organizationData.logo || null);
    } else {
      // No modo criação, limpa tudo
      form.reset();
      setLogoUrl(null);
    }
  };

  return {
    form,
    isLoading,
    logoUrl,
    setLogoUrl,
    generateSlug,
    onSubmit,
    resetForm,
  };
}