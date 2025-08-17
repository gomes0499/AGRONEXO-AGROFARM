/**
 * Service for generating PDF reports using remote Python API
 * This is used when Python scripts are deployed separately (e.g., on Render/Railway)
 */
export class PythonPDFReportServiceRemote {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';
    console.log('Python PDF Service URL:', this.apiUrl);
  }

  async generateReport(organizationId: string, projectionId?: string): Promise<Buffer> {
    try {
      // Verificar se o serviço está disponível
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        throw new Error('Serviço Python não está disponível. Verifique se está rodando corretamente.');
      }
      
      // Determinar a URL base da API
      const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                        'https://srconsultoria.vercel.app';
      
      console.log(`Chamando serviço Python em: ${this.apiUrl}/generate-complete-report`);
      console.log('Payload:', { organizationId, projectionId, apiBaseUrl });
      
      const response = await fetch(`${this.apiUrl}/generate-complete-report`, {
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

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            // Se não for JSON, tentar ler como texto
            const text = await response.text();
            console.error('Resposta não-JSON do servidor:', text.substring(0, 500));
            errorMessage = `Servidor retornou HTML/texto em vez de PDF. Status: ${response.status}`;
          }
        } catch (e) {
          console.error('Erro ao processar resposta de erro:', e);
        }
        throw new Error(errorMessage);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Erro ao gerar relatório PDF remoto:', error);
      throw new Error(`Falha ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async generateRatingReport(organizationId: string, safraId: string): Promise<Buffer> {
    try {
      // Determinar a URL base da API
      const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                        'https://srconsultoria.vercel.app';
      
      const response = await fetch(`${this.apiUrl}/generate-rating-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          safraId,
          apiBaseUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Erro ao gerar relatório de rating remoto:', error);
      throw new Error(`Falha ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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