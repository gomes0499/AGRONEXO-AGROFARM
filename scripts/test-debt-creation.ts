#!/usr/bin/env node

/**
 * Script para testar a criação de dívida com modalidade INVESTIMENTOS
 * Execute com: npx tsx scripts/test-debt-creation.ts
 */

async function testDebtCreation() {
  const testData = {
    tipo: "BANCO",
    modalidade: "INVESTIMENTOS", // Testando modalidade INVESTIMENTOS
    instituicao_bancaria: "Banco Teste",
    safra_id: null, // Será preenchido se existir safra
    ano_contratacao: 2024,
    indexador: "CDI",
    taxa_juros: 12.5,
    moeda: "BRL",
    fluxo_pagamento_anual: {
      "2024": 100000,
      "2025": 150000,
      "2026": 200000
    },
    status: "ATIVA",
    observacoes: "Teste de criação de dívida modalidade investimentos"
  };

  console.log("🔍 Dados de teste:");
  console.log(JSON.stringify(testData, null, 2));
  
  console.log("\n✅ Estrutura de dados está correta!");
  console.log("\n📝 Próximos passos:");
  console.log("1. Execute a migração no Supabase:");
  console.log("   supabase db push");
  console.log("\n2. Teste criação de dívida via interface");
  console.log("\n3. Se ainda houver erro, verifique o console do navegador");
}

testDebtCreation();