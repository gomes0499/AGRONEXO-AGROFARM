"use client";

import { useState, useEffect } from "react";
import { ControllerRenderProps } from "react-hook-form";
import { 
  formatCPF, 
  formatCNPJ, 
  formatCEP, 
  formatPhone, 
  formatMoney,
  formatArea,
  formatSacas,
  formatNumberOnly,
  formatRG,
  unformat,
  fetchAddressByCep,
  parseFormattedNumber,
  CepData
} from "@/lib/utils/format";

export type FormatType = "cpf" | "cnpj" | "cep" | "phone" | "money" | "area" | "sacas" | "rg" | "none";

/**
 * Interface para as opções do hook
 */
interface UseFormattedInputOptions {
  type: FormatType;
  field: ControllerRenderProps<any, any>;
  onAddressFound?: (data: CepData) => void;
}

/**
 * Hook para gerenciar inputs formatados
 * @param options - Opções de configuração
 * @returns Objeto com as propriedades e funções necessárias para o input
 */
export function useFormattedInput(options?: UseFormattedInputOptions) {
  // Se não for chamado com parâmetros, retorna uma versão simplificada com funções utilitárias
  if (!options) {
    return {
      // Função utilitária para lidar com campos de taxas
      getRateProps: (field: any) => {
        // Em vez de usar diretamente no campo, isso retorna propriedades que devem ser passadas
        // para o FormattedInput
        return {
          formatType: "money" as FormatType,
          field: field
        };
      }
    };
  }

  const { type, field, onAddressFound } = options;
  const [inputValue, setInputValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Formata o valor inicial quando o componente carrega
  useEffect(() => {
    if (field.value) {
      setInputValue(formatValue(field.value));
    }
  }, [field.value]);

  // Função para formatar o valor de acordo com o tipo
  const formatValue = (value: string): string => {
    if (!value) return '';
    
    switch (type) {
      case "cpf":
        return formatCPF(value);
      case "cnpj":
        return formatCNPJ(value);
      case "cep":
        return formatCEP(value);
      case "phone":
        return formatPhone(value);
      case "rg":
        return formatRG(value);
      case "money":
        return formatMoney(value);
      case "area":
        return formatArea(value);
      case "sacas":
        return formatSacas(value);
      default:
        return value;
    }
  };

  // Função para buscar endereço por CEP
  const searchCepAddress = async (cep: string) => {
    if (type === "cep" && unformat(cep).length === 8 && onAddressFound) {
      setIsLoading(true);
      
      try {
        const addressData = await fetchAddressByCep(cep);
        
        if (addressData) {
          onAddressFound(addressData);
        }
      } catch (error) {
        console.error("Erro ao buscar endereço por CEP:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handler para mudança no input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Para tipos numéricos, trate como entrada simples
    if (type === "money" || type === "area" || type === "sacas") {
      // Remove tudo exceto números, ponto e vírgula
      const cleanValue = value.replace(/[^\d.,]/g, '');
      
      // Salva o número para o form
      const numericValue = parseFormattedNumber(cleanValue);
      field.onChange(numericValue);
      
      // Se for uma string vazia, limpa o campo
      if (!cleanValue) {
        setInputValue('');
        return;
      }
      
      // Sempre mostra apenas o valor limpo, sem formatação
      setInputValue(cleanValue);
    } else {
      // Para outros tipos, mantém o comportamento anterior
      let formattedValue = formatValue(value);
      setInputValue(formattedValue);
      
      switch (type) {
        case "cpf":
        case "cnpj":
        case "cep":
        case "phone":
        case "rg":
          field.onChange(unformat(value));
          break;
        default:
          field.onChange(value);
      }
    }
  };

  // Handler para quando o input perde o foco
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    field.onBlur();
    
    // Tenta buscar o endereço por CEP quando o campo perder o foco
    if (type === "cep") {
      searchCepAddress(e.target.value);
    }
    
    // Para tipos numéricos, mantém o valor limpo
    if (type === "money" || type === "area" || type === "sacas") {
      if (field.value !== null && field.value !== undefined) {
        // Convertemos para string e mantemos apenas os números e pontuação
        const rawValue = field.value.toString().replace(/[^\d.,]/g, '');
        setInputValue(rawValue);
      }
    }
  };
  
  // Handler para quando o input ganha foco
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    
    // Para consistência nos campos numéricos, garantimos que mostra apenas o valor limpo
    if (type === "money" || type === "area" || type === "sacas") {
      if (field.value !== null && field.value !== undefined) {
        // Remove qualquer formatação, deixando apenas números e vírgulas
        const rawValue = e.target.value.replace(/[^\d.,]/g, '');
        setInputValue(rawValue);
      }
    }
  };

  // Exibe sempre o valor limpo para campos numéricos, sem formatação
  const displayValue = inputValue;

  return {
    ...field,
    value: displayValue,
    onChange: handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
    isLoading,
  };
}