import { HtmlPdfReportGenerator } from './generator';
import type { ReportData } from '../definitive-pdf-report-service';

export class HtmlPdfReportService {
  private generator: HtmlPdfReportGenerator;

  constructor() {
    this.generator = new HtmlPdfReportGenerator();
  }

  /**
   * Gera o relatório em PDF usando HTML/CSS
   */
  async generateReport(data: ReportData): Promise<Buffer> {
    try {
      const pdfBuffer = await this.generator.generatePdf(data);
      return pdfBuffer;
    } catch (error) {
      console.error('Erro ao gerar relatório HTML/PDF:', error);
      throw new Error('Falha na geração do relatório PDF');
    }
  }
}

export { HtmlPdfReportGenerator };