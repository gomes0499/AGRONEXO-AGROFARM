#!/usr/bin/env tsx

/**
 * Script para executar seeds no banco de dados
 * 
 * Uso:
 * - Para executar todos os seeds: npm run seed
 * - Para executar um seed específico: npm run seed:propriedades
 */

import * as dotenv from "dotenv";
import path from "path";

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Verificar se as variáveis necessárias estão definidas
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Variáveis de ambiente faltando:", missingVars.join(", "));
  console.error("Por favor, configure estas variáveis no arquivo .env.local");
  process.exit(1);
}

// Importar e executar o seed principal
import("./index").catch((error) => {
  console.error("❌ Erro ao executar seeds:", error);
  process.exit(1);
});