import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; safraId: string }> }
) {
  try {
    const { organizationId, safraId } = await params;
    
    if (!organizationId || !safraId) {
      return NextResponse.json(
        { error: 'Organization ID and Safra ID are required' },
        { status: 400 }
      );
    }

    // Criar cliente público do Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Buscar dados da organização
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      throw new Error('Organization not found');
    }

    // Buscar dados da safra
    const { data: safra, error: safraError } = await supabase
      .from('harvest_years')
      .select('id, name')
      .eq('id', safraId)
      .single();

    if (safraError || !safra) {
      throw new Error('Safra not found');
    }

    // Buscar o cálculo de rating mais recente
    const { data: ratingCalc, error: ratingError } = await supabase
      .from('rating_calculations')
      .select(`
        id,
        pontuacao_total,
        classificacao,
        created_at,
        rating_calculation_metrics (
          metric_id,
          valor,
          pontuacao,
          nivel,
          peso,
          rating_metrics (
            id,
            codigo,
            nome,
            tipo
          )
        )
      `)
      .eq('organization_id', organizationId)
      .eq('safra_id', safraId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (ratingError || !ratingCalc) {
      // Se não houver cálculo, retornar valores padrão
      return NextResponse.json({
        organization: {
          id: organization.id,
          nome: organization.name
        },
        safra: {
          id: safra.id,
          nome: safra.name
        },
        rating: {
          classificacao: 'N/A',
          pontuacaoTotal: 0,
          metrics: []
        }
      });
    }

    // Formatar métricas
    const metrics = ratingCalc.rating_calculation_metrics?.map((cm: any) => ({
      codigo: cm.rating_metrics.codigo,
      nome: cm.rating_metrics.nome,
      tipo: cm.rating_metrics.tipo,
      valor: cm.valor,
      pontuacao: cm.pontuacao,
      peso: cm.peso,
      nivel: cm.nivel
    })) || [];

    return NextResponse.json({
      organization: {
        id: organization.id,
        nome: organization.name
      },
      safra: {
        id: safra.id,
        nome: safra.name
      },
      rating: {
        classificacao: ratingCalc.classificacao,
        pontuacaoTotal: ratingCalc.pontuacao_total,
        metrics: metrics
      }
    });

  } catch (error) {
    console.error('Error fetching rating data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating data' },
      { status: 500 }
    );
  }
}