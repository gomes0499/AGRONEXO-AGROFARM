/**
 * Service for generating PDF reports using remote Python API
 * This is used when Python scripts are deployed separately (e.g., on Render/Railway)
 */
export class PythonPDFReportServiceRemote {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';
  }

  async generateReport(organizationId: string, projectionId?: string): Promise<Buffer> {
    try {
      const response = await fetch(`${this.apiUrl}/generate-complete-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          projectionId,
          apiBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
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
      const response = await fetch(`${this.apiUrl}/generate-rating-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          safraId,
          apiBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
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