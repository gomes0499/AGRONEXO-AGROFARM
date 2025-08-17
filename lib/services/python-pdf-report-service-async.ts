/**
 * Service for generating PDF reports using remote Python API with async support
 */
export class PythonPDFReportServiceAsync {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';
    console.log('Python PDF Service URL (Async):', this.apiUrl);
  }

  async generateReport(organizationId: string, projectionId?: string): Promise<Buffer> {
    try {
      // Verificar se o serviço está disponível
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        throw new Error('Serviço Python não está disponível. Verifique se está rodando corretamente.');
      }
      
      // Determinar a URL base da API
      const apiBaseUrl = 'https://www.srconsultoria.online';
      
      console.log(`Iniciando geração assíncrona de relatório`);
      console.log('Payload:', { organizationId, projectionId, apiBaseUrl });
      
      // Iniciar geração do relatório (assíncrono)
      const startResponse = await fetch(`${this.apiUrl}/generate-complete-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          projectionId,
          apiBaseUrl,
        }),
      });

      if (!startResponse.ok) {
        const error = await this.parseErrorResponse(startResponse);
        throw new Error(error);
      }

      const { job_id } = await startResponse.json();
      console.log(`Job iniciado com ID: ${job_id}`);

      // Aguardar conclusão do job (polling)
      const maxAttempts = 60; // 60 tentativas
      const delayMs = 5000; // 5 segundos entre tentativas
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        console.log(`Verificando status do job ${job_id} (tentativa ${attempt + 1}/${maxAttempts})`);
        
        const statusResponse = await fetch(`${this.apiUrl}/job-status/${job_id}`);
        
        if (!statusResponse.ok) {
          console.error(`Erro ao verificar status do job: ${statusResponse.status}`);
          continue;
        }

        const status = await statusResponse.json();
        console.log(`Status do job: ${status.status}`);

        if (status.status === 'completed') {
          // Download do PDF
          console.log(`Job concluído, baixando PDF...`);
          const downloadResponse = await fetch(`${this.apiUrl}/download/${job_id}`);
          
          if (!downloadResponse.ok) {
            throw new Error(`Erro ao baixar PDF: ${downloadResponse.status}`);
          }

          const arrayBuffer = await downloadResponse.arrayBuffer();
          return Buffer.from(arrayBuffer);
        } else if (status.status === 'failed') {
          throw new Error(`Geração do relatório falhou: ${status.error || 'Erro desconhecido'}`);
        }
      }

      throw new Error('Timeout: geração do relatório demorou muito tempo');
    } catch (error) {
      console.error('Erro ao gerar relatório PDF assíncrono:', error);
      throw new Error(`Falha ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async parseErrorResponse(response: Response): Promise<string> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        return error.error || `HTTP error! status: ${response.status}`;
      } else {
        const text = await response.text();
        console.error('Resposta não-JSON do servidor:', text.substring(0, 500));
        return `Servidor retornou HTML/texto em vez de JSON. Status: ${response.status}`;
      }
    } catch (e) {
      return `HTTP error! status: ${response.status}`;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}