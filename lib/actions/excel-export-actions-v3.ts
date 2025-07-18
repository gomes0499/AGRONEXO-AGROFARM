"use server";

import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { generateCompleteExcelExport } from "@/lib/services/excel-export-service-v3";
import { createClient } from "@/lib/supabase/server";

export async function exportOrganizationDataToExcel(organizationId: string) {
  try {
    // Verificar permissão do usuário
    await verifyUserPermission();
    
    const supabase = await createClient();
    const blob = await generateCompleteExcelExport(organizationId, supabase);
    
    // Converter Blob para Base64 para transferir do servidor para o cliente
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64 = buffer.toString('base64');
    
    return {
      data: base64,
      filename: `Dados_Completos_${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error("Erro ao exportar dados:", error);
    throw new Error("Falha ao exportar dados da organização");
  }
}