"use server";

import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { generateExcelExport } from "@/lib/services/excel-export-service";
import { generateExcelExportV2 } from "@/lib/services/excel-export-service-v2";

export async function exportOrganizationDataToExcel(organizationId: string, useV2: boolean = true) {
  try {
    // Verificar permissão do usuário
    await verifyUserPermission();
    
    // Gerar o arquivo Excel usando a versão apropriada
    const excelBlob = useV2 
      ? await generateExcelExportV2(organizationId)
      : await generateExcelExport(organizationId);
    
    // Converter blob para base64 para transferir do servidor para o cliente
    const buffer = await excelBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    return {
      data: base64,
      filename: `Dados_Completos_${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error("Erro ao exportar dados:", error);
    throw new Error("Falha ao exportar dados da organização");
  }
}