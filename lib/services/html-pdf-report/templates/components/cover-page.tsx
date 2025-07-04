import React from 'react';

interface CoverPageProps {
  organizationName: string;
  generatedAt: Date;
}

export function CoverPage({ organizationName, generatedAt }: CoverPageProps) {
  return (
    <div className="cover-page">
      <div>
        <h1 className="cover-title">RELATÓRIO FINANCEIRO</h1>
        <h2 className="cover-subtitle">{organizationName.toUpperCase()}</h2>
        
        <div className="cover-info">
          <p>Data de Geração: {new Date(generatedAt).toLocaleDateString('pt-BR')}</p>
          <p>Período: Safra 2024/2025</p>
          <p>Análise Completa</p>
        </div>
      </div>
      
      <div style={{ position: 'absolute', bottom: '40pt', textAlign: 'center' }}>
        <p style={{ fontSize: '10pt', opacity: 0.8 }}>
          INFORMAÇÕES CONFIDENCIAIS<br />
          Este documento contém informações confidenciais e seu conteúdo é de uso exclusivo.
        </p>
      </div>
    </div>
  );
}