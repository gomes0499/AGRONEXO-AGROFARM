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
              background-color: #0f172a;
              color: #ffffff;
              padding: 30px;
              text-align: center;
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
              <h1 style="margin: 0; font-size: 24px;">Relatório de Rating de Crédito</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${organizationName}</p>
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
              
              <div class="rating-box">
                <div class="rating">${ratingData.rating}</div>
                <div class="outlook">Outlook: ${ratingData.outlook}</div>
                <div class="score">Score: ${ratingData.score.toFixed(1)}/100</div>
              </div>
              
              <div class="highlights">
                <strong>Destaques da Análise:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Análise completa de indicadores financeiros</li>
                  <li>Scoring detalhado por dimensão de risco</li>
                  <li>Comparativo com benchmarks do setor</li>
                  <li>Projeções e análise de cenários</li>
                  <li>Recomendações para melhoria do rating</li>
                </ul>
              </div>
              
              <div class="metrics-grid">
                <div class="metric">
                  <div class="metric-label">Margem EBITDA</div>
                  <div class="metric-value">${(ratingData.indicators.margemEbitda * 100).toFixed(1)}%</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Dívida/EBITDA</div>
                  <div class="metric-value">${ratingData.indicators.dividaEbitda.toFixed(2)}x</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Liquidez Corrente</div>
                  <div class="metric-value">${ratingData.indicators.liquidezCorrente.toFixed(2)}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">ROE</div>
                  <div class="metric-value">${(ratingData.indicators.roe).toFixed(1)}%</div>
                </div>
              </div>
              
              <p>O relatório completo em PDF está anexado a este email e contém:</p>
              <ul>
                <li>Resumo executivo com análise qualitativa</li>
                <li>Detalhamento do score por dimensão</li>
                <li>Indicadores financeiros vs. benchmarks</li>
                <li>Análise de riscos (operacional, financeiro, mercado e regulatório)</li>
                <li>Projeções financeiras e cenários de stress</li>
                <li>Conclusões e recomendações estratégicas</li>
              </ul>
              
              <p style="margin-top: 30px;">Atenciosamente,<br>
              <strong>SR Consultoria</strong></p>
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
          from: "SR Consultoria <relatorios@srconsultoria.com.br>",
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