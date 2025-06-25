// Script to test debt creation with INVESTIMENTOS modality
import { createBankDebt } from "@/lib/actions/financial-actions";

async function testDebtCreation() {
  // Test data for creating a debt with INVESTIMENTOS modality
  const testDebt = {
    organizacao_id: "test-org-id", // Replace with actual org ID
    safra_id: "test-safra-id", // Replace with actual safra ID
    tipo: "BANCO" as const,
    modalidade: "INVESTIMENTOS" as const,
    instituicao_bancaria: "Banco Teste",
    ano_contratacao: 2024,
    indexador: "CDI",
    taxa_real: 5.5,
    fluxo_pagamento_anual: JSON.stringify({
      "safra-id-1": 100000,
      "safra-id-2": 150000
    }),
    moeda: "BRL" as const,
    status: "ATIVA" as const,
    observacoes: "Teste de criação com modalidade INVESTIMENTOS"
  };

  try {
    console.log("Creating debt with INVESTIMENTOS modality...");
    console.log("Test data:", testDebt);
    
    const result = await createBankDebt(testDebt);
    console.log("Success! Debt created:", result);
  } catch (error) {
    console.error("Error creating debt:", error);
    
    // Check if it's a validation error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }
}

// Run the test
testDebtCreation();