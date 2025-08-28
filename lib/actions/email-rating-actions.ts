"use server";

import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { getRatingData } from "./rating-actions";
import { generateRatingPDFReport } from "@/lib/services/pdf-rating-service";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailResult {
  success: boolean;
  successCount: number;
  failedCount: number;
  errors?: string[];
}

export async function sendRatingReportByEmail(
  organizationId: string,
  organizationName: string,
  safraId: string,
  recipientEmails: string[],
  customSubject?: string,
  customMessage?: string
): Promise<EmailResult> {
  try {
    // Verificar permissão
    await verifyUserPermission();

    // Gerar dados do relatório de rating
    const ratingData = await getRatingData(organizationId);

    // Gerar PDF
    const pdfBlob = await generateRatingPDFReport(ratingData);
    
    // Converter blob para buffer
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Preparar assunto e mensagem
    const subject = customSubject || `Relatório de Rating - ${organizationName}`;
    const currentDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // HTML do email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #333;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #ffffff;
              color: #1e293b;
              padding: 30px;
              text-align: center;
              border-bottom: 2px solid #e2e8f0;
            }
            .content {
              padding: 40px 30px;
            }
            .rating-box {
              background-color: #f8fafc;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .rating {
              font-size: 48px;
              font-weight: bold;
              color: #3b82f6;
              margin: 10px 0;
            }
            .outlook {
              font-size: 18px;
              color: #64748b;
            }
            .score {
              font-size: 24px;
              color: #0f172a;
              margin-top: 10px;
            }
            .highlights {
              background-color: #e0f2fe;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 20px 0;
            }
            .metric {
              background-color: #f8fafc;
              padding: 15px;
              border-radius: 6px;
              text-align: center;
            }
            .metric-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
            }
            .metric-value {
              font-size: 20px;
              font-weight: bold;
              color: #0f172a;
              margin-top: 5px;
            }
            .footer {
              background-color: #f8fafc;
              padding: 20px;
              text-align: center;
              color: #64748b;
              font-size: 14px;
            }
            .cta-button {
              display: inline-block;
              background-color: #3b82f6;
              color: #ffffff;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 20px 0;
            }
            .custom-message {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://vnqovsdcychjczfjamdc.supabase.co/storage/v1/object/public/public-assets/logosr.png" alt="SR Consultoria" style="max-width: 200px; height: auto; display: block; margin: 0 auto 15px;">
              <h1 style="margin: 0; font-size: 24px; color: #1e293b;">Relatório de Rating de Crédito</h1>
              <p style="margin: 10px 0 0 0; color: #64748b;">${organizationName}</p>
            </div>
            
            <div class="content">
              <p>Prezado(a),</p>
              
              ${customMessage ? `
                <div class="custom-message">
                  ${customMessage.replace(/\n/g, '<br>')}
                </div>
              ` : ''}
              
              <p>Segue em anexo o relatório de rating de crédito da <strong>${organizationName}</strong>, 
              gerado em ${currentDate}.</p>
              
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
                          <strong style="color: #475569;">Rating:</strong>
                        </td>
                        <td style="color: #64748b; padding: 5px 0;">
                          ${ratingData.rating} - ${
                            ratingData.rating === "AAA" || ratingData.rating.startsWith("AA") || ratingData.rating.startsWith("A") ? 
                              "Excelente capacidade de pagamento, gestão superior e práticas sustentáveis exemplares" :
                            ratingData.rating.startsWith("BAA") ? 
                              "Forte capacidade de pagamento, boa gestão e práticas sustentáveis sólidas" :
                            ratingData.rating.startsWith("BA") ? 
                              "Boa capacidade de pagamento, gestão adequada e boas práticas sustentáveis" :
                            ratingData.rating === "BA5" || ratingData.rating === "BA6" ? 
                              "Capacidade de pagamento adequada, gestão aceitável" :
                            ratingData.rating.startsWith("B") && !ratingData.rating.startsWith("BA") && !ratingData.rating.startsWith("BB") ? 
                              "Capacidade de pagamento aceitável, mas limitada" :
                            ratingData.rating.startsWith("BB") || ratingData.rating === "B1" || ratingData.rating === "B2" ? 
                              "Capacidade de pagamento fraca, alta probabilidade de problemas estruturais" :
                            ratingData.rating.startsWith("B3") || ratingData.rating.startsWith("C1") ? 
                              "Capacidade de pagamento muito fraca, problemas estruturais significativos" :
                            ratingData.rating.startsWith("C") || ratingData.rating.startsWith("D") ? 
                              "Capacidade de pagamento extremamente limitada, alta probabilidade de inadimplência" :
                            ratingData.rating === "E" || ratingData.rating === "F" || ratingData.rating === "G" || ratingData.rating === "H" ? 
                              "Já em situação de inadimplência ou com alta probabilidade de default iminente" :
                            "Capacidade de pagamento não avaliada"
                          }
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">
                          <strong style="color: #475569;">Score:</strong>
                        </td>
                        <td style="color: #64748b; padding: 5px 0;">
                          ${ratingData.score.toFixed(1)}/100
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">
                          <strong style="color: #475569;">Data de Geração:</strong>
                        </td>
                        <td style="color: #64748b; padding: 5px 0;">
                          ${currentDate}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;" valign="top">
                          <strong style="color: #475569;">Conteúdo:</strong>
                        </td>
                        <td style="color: #64748b; padding: 5px 0;">
                          • Análise de Crédito e Score<br>
                          • Indicadores Financeiros<br>
                          • Scoring por Dimensão de Risco<br>
                          • Benchmarks do Setor<br>
                          • Metodologia de Cálculo<br>
                          • Recomendações Estratégicas
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p>O relatório completo em PDF está anexado a este email e contém:</p>
              <ul>
                <li>Resumo executivo com análise qualitativa</li>
                <li>Detalhamento do score por dimensão</li>
                <li>Indicadores financeiros vs. benchmarks</li>
                <li>Análise de riscos (operacional, financeiro, mercado e regulatório)</li>
                <li>Projeções financeiras e cenários de stress</li>
                <li>Conclusões e recomendações estratégicas</li>
              </ul>
              
              <div style="margin-top: 40px; text-align: left;">
                <p style="margin: 0 0 15px 0; font-size: 16px;">Atenciosamente,</p>
                <img src="https://vnqovsdcychjczfjamdc.supabase.co/storage/v1/object/public/public-assets/logosr.png" alt="SR Consultoria" style="max-width: 150px; height: auto;">
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">Este relatório foi gerado automaticamente pelo sistema SR Consultoria.</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">
                As informações contidas neste relatório são confidenciais e destinadas exclusivamente aos seus destinatários.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar emails
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const email of recipientEmails) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'SR Consultoria <noreply@srcon.com.br>',
          to: email,
          subject: subject,
          html: htmlContent,
          attachments: [
            {
              filename: `Rating_${organizationName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
              content: buffer,
            },
          ],
        });
        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Falha ao enviar para ${email}: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        console.error(`Erro ao enviar email para ${email}:`, error);
      }
    }

    return {
      success: successCount > 0,
      successCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Erro ao enviar relatório de rating por email:", error);
    return {
      success: false,
      successCount: 0,
      failedCount: recipientEmails.length,
      errors: [`Erro geral: ${error instanceof Error ? error.message : "Erro desconhecido"}`],
    };
  }
}

// New function to send rating result from modal
export async function sendRatingResultByEmail(
  organizationName: string,
  ratingResult: any,
  recipientEmails: string[],
  customSubject?: string,
  customMessage?: string,
  pdfBase64?: string
): Promise<EmailResult> {
  try {
    // Verificar permissão
    await verifyUserPermission();

    // Preparar assunto e mensagem
    const subject = customSubject || `Relatório de Rating - ${ratingResult.modelName}`;
    const currentDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // HTML do email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #333;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #ffffff;
              color: #1e293b;
              padding: 30px;
              text-align: center;
              border-bottom: 2px solid #e2e8f0;
            }
            .logo {
              height: 50px;
              margin-bottom: 15px;
            }
            .content {
              padding: 40px 30px;
            }
            .rating-box {
              background-color: #f8fafc;
              border-radius: 8px;
              padding: 25px;
              margin: 25px 0;
              text-align: center;
              border: 2px solid #e2e8f0;
            }
            .rating {
              font-size: 56px;
              font-weight: bold;
              color: #3b82f6;
              margin: 10px 0;
              letter-spacing: -1px;
            }
            .rating-description {
              font-size: 16px;
              color: #64748b;
              margin-top: 10px;
            }
            .score {
              font-size: 28px;
              color: #0f172a;
              margin-top: 15px;
              font-weight: 600;
            }
            .highlights {
              background-color: #e0f2fe;
              border-left: 4px solid #3b82f6;
              padding: 20px;
              margin: 25px 0;
              border-radius: 0 6px 6px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 25px 0;
            }
            .info-item {
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              text-align: left;
              border: 1px solid #e2e8f0;
            }
            .info-label {
              font-size: 13px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
            }
            .info-value {
              font-size: 18px;
              font-weight: bold;
              color: #0f172a;
            }
            .metrics-table {
              width: 100%;
              margin: 25px 0;
              border-collapse: collapse;
            }
            .metrics-table th {
              background-color: #f1f5f9;
              padding: 12px;
              text-align: left;
              font-size: 13px;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #e2e8f0;
            }
            .metrics-table td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .metric-name {
              font-weight: 500;
              color: #1e293b;
            }
            .metric-value {
              color: #64748b;
              text-align: right;
            }
            .footer {
              background-color: #f8fafc;
              padding: 25px;
              text-align: center;
              color: #64748b;
              font-size: 13px;
            }
            .custom-message {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              margin: 25px 0;
              font-style: italic;
              border-radius: 0 6px 6px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://vnqovsdcychjczfjamdc.supabase.co/storage/v1/object/public/public-assets/logosr.png" alt="SR Consultoria" style="max-width: 200px; height: auto; display: block; margin: 0 auto 15px;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 600; color: #1e293b;">Relatório de Rating</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; color: #64748b;">${organizationName}</p>
            </div>
            
            <div class="content">
              <p style="font-size: 16px;">Prezado(a),</p>
              
              ${customMessage ? `
                <div class="custom-message">
                  ${customMessage.replace(/\n/g, '<br>')}
                </div>
              ` : ''}
              
              <p style="font-size: 16px;">Segue em anexo o relatório detalhado de rating da <strong>${organizationName}</strong>, 
              gerado em ${currentDate}.</p>
              
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
                          <strong style="color: #475569;">Rating:</strong>
                        </td>
                        <td style="color: #64748b; padding: 5px 0;">
                          ${ratingResult.rating} - ${
                            ratingResult.rating === "AAA" || ratingResult.rating.startsWith("AA") || ratingResult.rating.startsWith("A") ? 
                              "Excelente capacidade de pagamento, gestão superior e práticas sustentáveis exemplares" :
                            ratingResult.rating.startsWith("BAA") ? 
                              "Forte capacidade de pagamento, boa gestão e práticas sustentáveis sólidas" :
                            ratingResult.rating.startsWith("BA") ? 
                              "Boa capacidade de pagamento, gestão adequada e boas práticas sustentáveis" :
                            ratingResult.rating === "BA5" || ratingResult.rating === "BA6" ? 
                              "Capacidade de pagamento adequada, gestão aceitável" :
                            ratingResult.rating.startsWith("B") && !ratingResult.rating.startsWith("BA") && !ratingResult.rating.startsWith("BB") ? 
                              "Capacidade de pagamento aceitável, mas limitada" :
                            ratingResult.rating.startsWith("BB") || ratingResult.rating === "B1" || ratingResult.rating === "B2" ? 
                              "Capacidade de pagamento fraca, alta probabilidade de problemas estruturais" :
                            ratingResult.rating.startsWith("B3") || ratingResult.rating.startsWith("C1") ? 
                              "Capacidade de pagamento muito fraca, problemas estruturais significativos" :
                            ratingResult.rating.startsWith("C") || ratingResult.rating.startsWith("D") ? 
                              "Capacidade de pagamento extremamente limitada, alta probabilidade de inadimplência" :
                            ratingResult.rating === "E" || ratingResult.rating === "F" || ratingResult.rating === "G" || ratingResult.rating === "H" ? 
                              "Já em situação de inadimplência ou com alta probabilidade de default iminente" :
                            "Capacidade de pagamento não avaliada"
                          }
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">
                          <strong style="color: #475569;">Score:</strong>
                        </td>
                        <td style="color: #64748b; padding: 5px 0;">
                          ${ratingResult.finalScore.toFixed(1)}/100
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">
                          <strong style="color: #475569;">Modelo:</strong>
                        </td>
                        <td style="color: #64748b; padding: 5px 0;">
                          ${ratingResult.modelName}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">
                          <strong style="color: #475569;">Safra:</strong>
                        </td>
                        <td style="color: #64748b; padding: 5px 0;">
                          ${ratingResult.safraName}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">
                          <strong style="color: #475569;">Cenário:</strong>
                        </td>
                        <td style="color: #64748b; padding: 5px 0;">
                          ${ratingResult.scenarioName}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">
                          <strong style="color: #475569;">Data de Geração:</strong>
                        </td>
                        <td style="color: #64748b; padding: 5px 0;">
                          ${currentDate}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;" valign="top">
                          <strong style="color: #475569;">Conteúdo:</strong>
                        </td>
                        <td style="color: #64748b; padding: 5px 0;">
                          • Análise de Crédito e Score<br>
                          • Indicadores Financeiros<br>
                          • Scoring por Dimensão de Risco<br>
                          • Benchmarks do Setor<br>
                          • Metodologia de Cálculo<br>
                          • Recomendações Estratégicas
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 16px; margin-top: 30px;">O relatório completo em PDF anexo contém:</p>
              <ul style="font-size: 15px; color: #475569; line-height: 1.8;">
                <li>Análise detalhada de todas as métricas avaliadas</li>
                <li>Composição completa da nota final e score</li>
                <li>Detalhamento por dimensão de risco</li>
                <li>Metodologia de cálculo utilizada</li>
                <li>Interpretação dos resultados e recomendações</li>
              </ul>
              
              <div style="margin-top: 40px; text-align: left;">
                <p style="margin: 0 0 15px 0; font-size: 16px;">Atenciosamente,</p>
                <img src="https://vnqovsdcychjczfjamdc.supabase.co/storage/v1/object/public/public-assets/logosr.png" alt="SR Consultoria" style="max-width: 150px; height: auto;">
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">Este relatório foi gerado automaticamente pelo sistema SR Consultoria.</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
                As informações contidas neste relatório são confidenciais e destinadas exclusivamente aos seus destinatários.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Preparar o PDF
    let pdfBuffer: Buffer;
    if (pdfBase64) {
      pdfBuffer = Buffer.from(pdfBase64, 'base64');
    } else {
      throw new Error("PDF não fornecido");
    }

    // Tentar enviar para todos de uma vez primeiro
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'SR Consultoria <noreply@srcon.com.br>',
        to: recipientEmails,
        subject: subject,
        html: htmlContent,
        attachments: [
          {
            filename: `Rating_${organizationName.replace(/\s+/g, "_")}_${ratingResult.modelName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
      
      return {
        success: true,
        successCount: recipientEmails.length,
        failedCount: 0,
      };
    } catch (batchError) {
      
      // Se falhar, enviar individualmente
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const email of recipientEmails) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'SR Consultoria <noreply@srcon.com.br>',
            to: email,
            subject: subject,
            html: htmlContent,
            attachments: [
              {
                filename: `Rating_${organizationName.replace(/\s+/g, "_")}_${ratingResult.modelName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
                content: pdfBuffer,
              },
            ],
          });
          successCount++;
          
          // Adicionar delay entre emails para evitar rate limiting
          if (recipientEmails.indexOf(email) < recipientEmails.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          failedCount++;
          errors.push(`Falha ao enviar para ${email}: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
          console.error(`Erro ao enviar email para ${email}:`, error);
        }
      }

      return {
        success: successCount > 0,
        successCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    }
  } catch (error) {
    console.error("Erro ao enviar relatório de rating por email:", error);
    return {
      success: false,
      successCount: 0,
      failedCount: recipientEmails.length,
      errors: [`Erro geral: ${error instanceof Error ? error.message : "Erro desconhecido"}`],
    };
  }
}