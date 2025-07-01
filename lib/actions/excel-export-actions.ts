"use server";

import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { generateExcelExport } from "@/lib/services/excel-export-service";

export async function exportOrganizationDataToExcel(organizationId: string) {
  try {
    // Verificar permissão do usuário
    await verifyUserPermission();
    
    // Gerar o arquivo Excel
    const excelBlob = await generateExcelExport(organizationId);
    
    // Converter blob para base64 para transferir do servidor para o cliente
    const buffer = await excelBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    return {
      data: base64,
      filename: `Dados_Organizacao_${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error("Erro ao exportar dados:", error);
    throw new Error("Falha ao exportar dados da organização");
  }
}