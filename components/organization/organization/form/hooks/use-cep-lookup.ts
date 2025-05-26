import { useState } from "react";
import { toast } from "sonner";
import type { CepData } from "@/lib/utils/format";
import type { UseFormReturn } from "react-hook-form";
import type { OrganizationFormValues } from "../schemas/organization-form-schema";

export function useCepLookup(form: UseFormReturn<OrganizationFormValues>) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepSuccess, setCepSuccess] = useState(false);

  // Handler para quando o CEP retornar um endereço
  const handleAddressFound = (data: CepData) => {
    setCepLoading(false);
    setCepSuccess(true);

    form.setValue("endereco", data.logradouro);
    form.setValue("bairro", data.bairro);
    form.setValue("cidade", data.localidade);
    form.setValue("estado", data.uf);

    toast.success("Endereço preenchido automaticamente!");

    setTimeout(() => setCepSuccess(false), 3000);
  };

  const handleCepLookupStart = () => {
    setCepLoading(true);
  };

  const handleCepLookupError = () => {
    setCepLoading(false);
    toast.error("CEP não encontrado. Verifique o número e tente novamente.");
  };

  return {
    cepLoading,
    cepSuccess,
    handleAddressFound,
    handleCepLookupStart,
    handleCepLookupError,
  };
}