import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  
  if (!session?.userId) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Pegar o número CAR da query string
  const { searchParams } = new URL(request.url);
  const carNumber = searchParams.get('car');
  
  if (!carNumber) {
    return new Response(JSON.stringify({ error: 'Número CAR não fornecido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Em uma implementação real, aqui você faria uma chamada para a API do SICAR
    // Exemplo: const response = await fetch(`https://api.sicar.gov.br/car/${carNumber}`);
    
    // Por enquanto, gerar dados simulados baseados no número CAR
    const areaTotal = Math.floor(Math.random() * 1000) + 100; // 100-1100 hectares
    
    // Calcular áreas ambientais com base em porcentagens típicas
    const reservaLegal = areaTotal * 0.2; // 20% de reserva legal
    const app = areaTotal * 0.1; // 10% de APP
    const vegetacaoNativa = areaTotal * 0.3; // 30% vegetação nativa
    const usoConsolidado = areaTotal * 0.5; // 50% uso consolidado
    
    // Simular um polígono simples
    const centroLat = -15.7801 + (Math.random() * 10 - 5);
    const centroLng = -47.9292 + (Math.random() * 10 - 5);
    
    // Criar um polígono simulado ao redor do ponto central
    const poligono = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [centroLng - 0.05, centroLat - 0.03],
          [centroLng + 0.05, centroLat - 0.03],
          [centroLng + 0.05, centroLat + 0.03],
          [centroLng - 0.05, centroLat + 0.03],
          [centroLng - 0.05, centroLat - 0.03],
        ]]
      }
    };
    
    // Dados formatados no padrão da API SICAR
    const data = {
      car: carNumber,
      status: Math.random() > 0.2 ? "ATIVO" : "PENDENTE",
      tipo: "RURAL",
      area_imovel: areaTotal,
      modulos_fiscais: (areaTotal / 80).toFixed(1), // 1 módulo = ~80ha (varia por região)
      app: app,
      reserva_legal: reservaLegal,
      vegetacao_nativa: vegetacaoNativa,
      uso_consolidado: usoConsolidado,
      poligono: poligono,
      coordenadas: {
        centro: [centroLat, centroLng]
      }
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar dados do SICAR:', error);
    return new Response(JSON.stringify({ error: 'Erro ao buscar dados do SICAR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}