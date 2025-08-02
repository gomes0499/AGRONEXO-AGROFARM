"use server";

import { Resend } from "resend";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { generateDefinitiveReport, generatePythonReport } from "./definitive-report-actions";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDefinitiveReportByEmail(
  organizationId: string,
  organizationName: string,
  recipients: string[],
  subject?: string,
  message?: string,
  projectionId?: string
) {
  try {
    // Verificar permissão do usuário
    await verifyUserPermission();
    
    // Gerar o relatório definitivo usando o Python
    const reportResult = await generatePythonReport(organizationId, projectionId);
    
    if (!reportResult.success || !reportResult.data) {
      throw new Error(reportResult.error || "Erro ao gerar relatório");
    }
    
    // Converter base64 para buffer
    const pdfBuffer = Buffer.from(reportResult.data, 'base64');
    
    // Nome do arquivo
    const filename = reportResult.filename || `Relatorio_Completo_${organizationName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
    
    // Preparar email
    const emailSubject = subject || `Relatório Completo - ${organizationName}`;
    
    // Buscar logo da organização se disponível
    const supabase = await createClient();
    const { data: orgData } = await supabase
      .from("organizacoes")
      .select("logo")
      .eq("id", organizationId)
      .single();
    
    const logoUrl = orgData?.logo || null;
    
    // URL do logo SR Consultoria hospedado no ImgBB
    const srLogoUrl = process.env.SR_LOGO_URL || 'https://i.ibb.co/MDVmjRPB/logosr.png';
    
    // Fallback: tenta usar o logo da organização primeiro, depois o logo SR
    const emailLogoUrl = logoUrl || srLogoUrl;
    
    // Obter nome do cenário se projection foi selecionada
    let scenarioName = "Base";
    if (projectionId) {
      const { data: projectionData } = await supabase
        .from("projections")
        .select("nome")
        .eq("id", projectionId)
        .single();
      
      if (projectionData) {
        scenarioName = projectionData.nome;
      }
    }
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1e293b; padding: 30px; border-radius: 8px 8px 0 0;">
                    <!-- Logo Container with light background -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                          <img src="${emailLogoUrl}" alt="SR Consultoria" style="max-width: 180px; height: auto; display: block;">
                        </td>
                      </tr>
                    </table>
                    <p style="color: #cbd5e1; margin: 20px 0 0 0; font-size: 16px; text-align: center;">Relatório Completo</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      ${organizationName}
                    </h2>
                    
                    <p style="color: #475569; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                      ${message || `Prezado(a),<br><br>Segue em anexo o relatório completo da organização ${organizationName}, contendo todas as informações detalhadas sobre produção, finanças, patrimônio e projeções.`}
                    </p>
                    
                    <!-- Info Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin: 30px 0;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                            📊 Informações do Relatório
                          </h3>
                          <table width="100%" cellpadding="5" cellspacing="0">
                            <tr>
                              <td style="color: #64748b; padding: 5px 0;">
                                <strong style="color: #475569;">Organização:</strong>
                              </td>
                              <td style="color: #64748b; padding: 5px 0;">
                                ${organizationName}
                              </td>
                            </tr>
                            <tr>
                              <td style="color: #64748b; padding: 5px 0;">
                                <strong style="color: #475569;">Cenário:</strong>
                              </td>
                              <td style="color: #64748b; padding: 5px 0;">
                                ${scenarioName}
                              </td>
                            </tr>
                            <tr>
                              <td style="color: #64748b; padding: 5px 0;">
                                <strong style="color: #475569;">Data de Geração:</strong>
                              </td>
                              <td style="color: #64748b; padding: 5px 0;">
                                ${new Date().toLocaleDateString("pt-BR", { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </td>
                            </tr>
                            <tr>
                              <td style="color: #64748b; padding: 5px 0;" valign="top">
                                <strong style="color: #475569;">Conteúdo:</strong>
                              </td>
                              <td style="color: #64748b; padding: 5px 0;">
                                • Visão Geral da Organização<br>
                                • Propriedades e Terras<br>
                                • Áreas de Plantio Detalhadas<br>
                                • Produtividade por Cultura<br>
                                • Evolução Financeira<br>
                                • Análise de Passivos e Dívidas<br>
                                • Indicadores Econômicos<br>
                                • Investimentos Realizados e Planejados<br>
                                • Fluxo de Caixa Projetado<br>
                                • DRE e Balanço Patrimonial
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <p style="color: #64748b; margin: 0; font-size: 14px;">
                            O relatório completo está anexado a este email em formato PDF.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                    <p style="color: #94a3b8; margin: 0 0 10px 0; font-size: 12px; text-align: center;">
                      Este é um email automático gerado pelo sistema SR Consultoria.
                    </p>
                    <p style="color: #94a3b8; margin: 0; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} SR Consultoria. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    
    // Enviar email - tentar enviar para todos de uma vez primeiro
    try {
      // Tentar enviar para todos os destinatários de uma vez
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "SR Consultoria <onboarding@resend.dev>",
        to: recipients, // Enviar para todos de uma vez
        subject: emailSubject,
        html: emailHtml,
        attachments: [
          {
            filename,
            content: pdfBuffer,
          },
        ],
      });
      
      if (error) {
        console.error("Erro ao enviar email em lote:", error);
        
        // Se falhar, tentar enviar individualmente
        
        const results = [];
        for (const email of recipients) {
          try {
            // Adicionar delay entre emails para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de delay
            
            const { data: individualData, error: individualError } = await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || "SR Consultoria <onboarding@resend.dev>",
              to: [email],
              subject: emailSubject,
              html: emailHtml,
              attachments: [
                {
                  filename,
                  content: pdfBuffer,
                },
              ],
            });
            
            if (individualError) {
              console.error(`Erro ao enviar email para ${email}:`, individualError);
              results.push({ email, success: false, error: individualError.message });
            } else {
              results.push({ email, success: true, id: individualData?.id });
            }
          } catch (err) {
            console.error(`Erro ao enviar email para ${email}:`, err);
            results.push({ email, success: false, error: "Erro ao enviar email" });
          }
        }
        
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;
        
        return {
          success: successCount > 0,
          successCount,
          failedCount,
          results,
        };
      }
      
      // Sucesso no envio em lote
      return {
        success: true,
        successCount: recipients.length,
        failedCount: 0,
        results: recipients.map(email => ({ email, success: true, id: data?.id })),
      };
    } catch (error) {
      console.error("Erro geral ao enviar emails:", error);
      
      // Tentar envio individual como fallback
      const results = [];
      for (const email of recipients) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data, error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "SR Consultoria <onboarding@resend.dev>",
            to: [email],
            subject: emailSubject,
            html: emailHtml,
            attachments: [
              {
                filename,
                content: pdfBuffer,
              },
            ],
          });
          
          if (emailError) {
            results.push({ email, success: false, error: emailError.message });
          } else {
            results.push({ email, success: true, id: data?.id });
          }
        } catch (err) {
          results.push({ email, success: false, error: "Erro ao enviar email" });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      
      return {
        success: successCount > 0,
        successCount,
        failedCount,
        results,
      };
    }
  } catch (error) {
    console.error("Erro ao enviar relatório completo por email:", error);
    throw new Error("Falha ao enviar relatório completo por email");
  }
}