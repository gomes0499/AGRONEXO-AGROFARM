import { NextResponse } from 'next/server';

// Usar headers para cache HTTP ao invés de cache em memória
const CACHE_DURATION_SECONDS = 3600; // 1 hora

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'interest-rates') {
      // Buscar dados do BCB com cache no fetch
      const [selicResponse, cdiResponse] = await Promise.all([
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs/432/dados/ultimos/1?formato=json', {
          next: { revalidate: CACHE_DURATION_SECONDS }
        }),
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs/4389/dados/ultimos/1?formato=json', {
          next: { revalidate: CACHE_DURATION_SECONDS }
        })
      ]);

      const selicData = await selicResponse.json();
      const cdiData = await cdiResponse.json();

      const result = {
        selic: selicData && selicData[0] ? parseFloat(selicData[0].valor) : 15.00,
        cdi: cdiData && cdiData[0] ? parseFloat(cdiData[0].valor) : 14.90,
        timestamp: new Date().toISOString()
      };

      // Retornar com headers de cache
      return NextResponse.json(result, {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_DURATION_SECONDS}, stale-while-revalidate=60`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Erro na API de market data:', error);
    // Retornar valores padrão em caso de erro
    return NextResponse.json({
      selic: 15.00,
      cdi: 14.90,
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch data from BCB'
    });
  }
}