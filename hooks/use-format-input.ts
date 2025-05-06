"use client";

import { useState, useCallback } from "react";

// Hook para formatar valores monetários (R$)
export function useMoneyInput(initialValue: number | null = null) {
  const [formattedValue, setFormattedValue] = useState(() => {
    if (initialValue === null) return '';
    return formatToCurrency(initialValue);
  });
  
  const [rawValue, setRawValue] = useState(initialValue);
  
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Remove caracteres não numéricos, exceto ponto e vírgula
    const digits = value.replace(/[^\d.,]/g, '');
    
    // Converte para o formato interno (número)
    const numericValue = parseFloat(digits.replace(/\./g, '').replace(',', '.'));
    
    setRawValue(isNaN(numericValue) ? null : numericValue);
    
    // Formata o valor para exibição
    if (digits === '' || isNaN(numericValue)) {
      setFormattedValue('');
    } else {
      setFormattedValue(formatToCurrency(numericValue));
    }
  }, []);
  
  return { 
    formattedValue, 
    rawValue, 
    handleChange,
    setValue: (value: number | null) => {
      setRawValue(value);
      setFormattedValue(value === null ? '' : formatToCurrency(value));
    }
  };
}

// Hook para formatar valores de área (ha)
export function useAreaInput(initialValue: number | null = null) {
  const [formattedValue, setFormattedValue] = useState(() => {
    if (initialValue === null) return '';
    return formatToArea(initialValue);
  });
  
  const [rawValue, setRawValue] = useState(initialValue);
  
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Remove caracteres não numéricos, exceto ponto e vírgula
    const digits = value.replace(/[^\d.,]/g, '');
    
    // Converte para o formato interno (número)
    const numericValue = parseFloat(digits.replace(/\./g, '').replace(',', '.'));
    
    setRawValue(isNaN(numericValue) ? null : numericValue);
    
    // Formata o valor para exibição
    if (digits === '' || isNaN(numericValue)) {
      setFormattedValue('');
    } else {
      setFormattedValue(formatToArea(numericValue));
    }
  }, []);
  
  return { 
    formattedValue, 
    rawValue, 
    handleChange,
    setValue: (value: number | null) => {
      setRawValue(value);
      setFormattedValue(value === null ? '' : formatToArea(value));
    }
  };
}

// Hook para formatar valores em sacas
export function useSacasInput(initialValue: number | null = null) {
  const [formattedValue, setFormattedValue] = useState(() => {
    if (initialValue === null) return '';
    return formatToSacas(initialValue);
  });
  
  const [rawValue, setRawValue] = useState(initialValue);
  
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Remove caracteres não numéricos, exceto ponto e vírgula
    const digits = value.replace(/[^\d.,]/g, '');
    
    // Converte para o formato interno (número)
    const numericValue = parseFloat(digits.replace(/\./g, '').replace(',', '.'));
    
    setRawValue(isNaN(numericValue) ? null : numericValue);
    
    // Formata o valor para exibição
    if (digits === '' || isNaN(numericValue)) {
      setFormattedValue('');
    } else {
      setFormattedValue(formatToSacas(numericValue));
    }
  }, []);
  
  return { 
    formattedValue, 
    rawValue, 
    handleChange,
    setValue: (value: number | null) => {
      setRawValue(value);
      setFormattedValue(value === null ? '' : formatToSacas(value));
    }
  };
}

// Função auxiliar para formatar valor monetário
function formatToCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Função auxiliar para formatar área
function formatToArea(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' ha';
}

// Função auxiliar para formatar sacas
function formatToSacas(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' sc';
}