import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { exportReportDataAsJSONPublic } from '@/lib/actions/export-report-data-actions-public';

const execAsync = promisify(exec);

export class PythonPDFReportService {
  private pythonPath: string;
  private scriptPath: string;
  private tempDir: string;

  constructor() {
    // Caminhos do Python e do script
    this.pythonPath = path.join(process.cwd(), 'scripts', 'venv', 'bin', 'python');
    this.scriptPath = path.join(process.cwd(), 'scripts', 'generate_complete_report.py');
    this.tempDir = path.join(process.cwd(), 'tmp');
  }

  async generateReport(organizationId: string, projectionId?: string): Promise<Buffer> {
    try {
      // Garantir que o diretório temporário existe
      await fs.mkdir(this.tempDir, { recursive: true });

      // Gerar nome do arquivo temporário
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputPath = path.join(this.tempDir, `report_${organizationId}_${timestamp}.pdf`);

      // Executar o script Python
      const command = `${this.pythonPath} ${this.scriptPath} ${organizationId} ${outputPath}`;
      
      console.log('Executando comando:', command);
      
      const { stdout, stderr } = await execAsync(command, {
        env: {
          ...process.env,
          // Adicionar URL da API se necessário
          API_BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        }
      });

      if (stderr && !stderr.includes('NotOpenSSLWarning')) {
        console.error('Stderr do Python:', stderr);
      }

      console.log('Stdout do Python:', stdout);

      // Ler o arquivo PDF gerado
      const pdfBuffer = await fs.readFile(outputPath);

      // Limpar arquivo temporário
      await fs.unlink(outputPath).catch(err => {
        console.error('Erro ao deletar arquivo temporário:', err);
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Erro ao gerar relatório PDF com Python:', error);
      throw new Error(`Falha ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Método alternativo que primeiro exporta os dados como JSON e depois gera o PDF
   */
  async generateReportWithData(organizationId: string, projectionId?: string): Promise<Buffer> {
    try {
      // Garantir que o diretório temporário existe
      await fs.mkdir(this.tempDir, { recursive: true });

      // Primeiro, exportar os dados como JSON
      const reportData = await exportReportDataAsJSONPublic(organizationId, projectionId);

      // Salvar dados em arquivo JSON temporário
      const jsonPath = path.join(this.tempDir, `data_${organizationId}_${Date.now()}.json`);
      await fs.writeFile(jsonPath, JSON.stringify(reportData, null, 2));

      // Gerar nome do arquivo de saída
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputPath = path.join(this.tempDir, `report_${organizationId}_${timestamp}.pdf`);

      // Executar o script Python com o arquivo JSON
      const command = `${this.pythonPath} ${this.scriptPath} --json ${jsonPath} ${outputPath}`;
      
      console.log('Executando comando com JSON:', command);
      
      const { stdout, stderr } = await execAsync(command, {
        env: {
          ...process.env,
          API_BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        }
      });

      if (stderr && !stderr.includes('NotOpenSSLWarning')) {
        console.error('Stderr do Python:', stderr);
      }

      console.log('Stdout do Python:', stdout);

      // Ler o arquivo PDF gerado
      const pdfBuffer = await fs.readFile(outputPath);

      // Limpar arquivos temporários
      await Promise.all([
        fs.unlink(outputPath).catch(err => console.error('Erro ao deletar PDF temporário:', err)),
        fs.unlink(jsonPath).catch(err => console.error('Erro ao deletar JSON temporário:', err))
      ]);

      return pdfBuffer;
    } catch (error) {
      console.error('Erro ao gerar relatório PDF com dados:', error);
      throw new Error(`Falha ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}