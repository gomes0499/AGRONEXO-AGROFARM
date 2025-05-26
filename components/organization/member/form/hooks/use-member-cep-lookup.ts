import { useState } from "react";
import { toast } from "sonner";
import type { CepData } from "@/lib/utils/format";
import type { UseFormReturn } from "react-hook-form";
import type { MemberFormValues } from "../schemas/member-form-schema";

export function useMemberCepLookup(form: UseFormReturn<MemberFormValues>) {
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

  const lookupCep = async (cep: string) => {
    if (!cep || cep.length < 8) return
    
    handleCepLookupStart()
    
    try {
      const cleanCep = cep.replace(/\D/g, "")
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (!data.erro) {
          handleAddressFound(data)
        } else {
          handleCepLookupError()
        }
      } else {
        handleCepLookupError()
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      handleCepLookupError()
    }
  }

  return {
    lookupCep,
    isLoading: cepLoading,
    cepLoading,
    cepSuccess,
    handleAddressFound,
    handleCepLookupStart,
    handleCepLookupError,
  };
}