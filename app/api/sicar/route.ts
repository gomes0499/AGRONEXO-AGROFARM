import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// Tipos para os dados geométricos
interface GeometriaPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

interface GeometriaMultiPolygon {
  type: 'MultiPolygon'
  coordinates: number[][][][]
}

// Tipo união para diferentes geometrias
type Geometria = GeometriaPolygon | GeometriaMultiPolygon;

// Interfaces para as áreas especiais
interface ReservaLegal {
  area_ha: number
  percentual: number
  geometria: Geometria
}

interface APP {
  area_ha: number
  percentual: number
  geometria: Geometria
}

interface VegetacaoNativa {
  area_ha: number
  percentual: number
  geometria: Geometria
}

interface AreaConsolidada {
  area_ha: number
  percentual: number
  geometria: Geometria
}

// Interface para estatísticas do CAR
interface Estatisticas {
  area_total: number
  reserva_legal: number
  area_cultivo_total: number
  area_cultivo_ativa: number
  area_pousio: number
  area_protegida: number
  area_cultivavel_teorica: number
  recursos_hidricos: number
  percentual_ocupacao: number
  percentual_reserva_legal: number
  percentual_area_protegida: number
}

// Interface para geometrias do CAR
interface Geometrias {
  geometria_total: Geometria
  geometria_reserva: Geometria
  geometria_hidrica: Geometria
}

// Interface principal dos dados do CAR
interface DadosCAR {
  codigo_car: string
  municipio: string
  estado: string
  estatisticas: Estatisticas
  geometrias: Geometrias
  
  // Campos opcionais que podem não estar presentes neste endpoint
  cod_tema?: string
  nom_tema?: string
  mod_fiscal?: number
  num_area?: number
  ind_status?: string
  ind_tipo?: string
  des_condic?: string
  cod_estado?: string
  dat_criaca?: string
  dat_atuali?: string
  nome_imovel?: string
  situacao_imovel?: string
  classe_imovel?: string
}

export async function GET(request: Request) {
  const session = await getSession();
  
  if (!session?.userId) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Pegar os parâmetros da query string
  const { searchParams } = new URL(request.url);
  const numeroCAR = searchParams.get('car');
  const estado = searchParams.get('estado');
  
  if (!numeroCAR || !estado) {
    return new Response(JSON.stringify({ error: 'É necessário fornecer o estado e o número do CAR' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Consumir a API externa do SICAR com o novo endpoint que inclui geometrias
    const response = await fetch(
      `http://localhost:8000/api/v1/estatisticas/estados/${estado}/car/${numeroCAR}?incluir_geometrias=true`
    );
    
    if (!response.ok) {
      // Verificar status do response
      if (response.status === 404) {
        return new Response(JSON.stringify({ error: 'CAR não encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Se a API estiver indisponível, podemos usar dados simulados como fallback
      return new Response(JSON.stringify({ error: 'Serviço SICAR indisponível', status: response.status }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawData = await response.json();
    
    // Verificar se os dados recebidos seguem a estrutura esperada
    console.log("Dados recebidos da API SICAR:", JSON.stringify(rawData));
    
    // Garantir que temos as propriedades esperadas com valores padrão se não existirem
    const data: DadosCAR = {
      codigo_car: rawData.codigo_car || "",
      municipio: rawData.municipio || "",
      estado: rawData.estado || "",
      estatisticas: rawData.estatisticas || {
        area_total: 0,
        reserva_legal: 0,
        area_cultivo_total: 0,
        area_cultivo_ativa: 0,
        area_pousio: 0,
        area_protegida: 0,
        area_cultivavel_teorica: 0,
        recursos_hidricos: 0,
        percentual_ocupacao: 0,
        percentual_reserva_legal: 0,
        percentual_area_protegida: 0
      },
      geometrias: rawData.geometrias || {
        geometria_total: { type: 'Polygon', coordinates: [[]] },
        geometria_reserva: { type: 'Polygon', coordinates: [[]] },
        geometria_hidrica: { type: 'Polygon', coordinates: [[]] }
      },
      // Campos opcionais da API antiga
      ind_status: rawData.ind_status,
      ind_tipo: rawData.ind_tipo,
      des_condic: rawData.des_condic,
      mod_fiscal: rawData.mod_fiscal,
      dat_criaca: rawData.dat_criaca,
      dat_atuali: rawData.dat_atuali,
      nome_imovel: rawData.nome_imovel,
      situacao_imovel: rawData.situacao_imovel,
      classe_imovel: rawData.classe_imovel
    };

    // Extrair valores com segurança usando operador opcional ?. e garantindo valores padrão
    const areaTotal = data.estatisticas?.area_total || 0;
    
    // Função para calcular área cultivável seguindo a fórmula:
    // Área de cultivo ≈ Área total - (RL + APP + Uso Restrito + Vegetação Nativa)
    function calcularAreaCultivavel(estatisticas: any): number {
      try {
        if (!estatisticas) return 0;
        
        const areaTotal = estatisticas.area_total || 0;
        const reservaLegal = estatisticas.reserva_legal || 0;
        const recursosHidricos = estatisticas.recursos_hidricos || 0; // APP
        
        // Alguns valores podem não estar disponíveis na API, então usamos valores padrão
        const vegetacaoNativa = estatisticas.vegetacao_nativa || 0;
        const usoRestrito = estatisticas.uso_restrito || 0;
        
        // Calculamos a área cultivável
        let areaCultivavel = areaTotal - (reservaLegal + recursosHidricos + usoRestrito + vegetacaoNativa);
        
        // Garantimos que não seja negativa
        areaCultivavel = Math.max(0, areaCultivavel);
        
        // Se temos uma área cultivável teórica já calculada pela API, podemos usar ela também
        if (estatisticas.area_cultivavel_teorica && estatisticas.area_cultivavel_teorica > 0) {
          // Podemos usar a média entre o nosso cálculo e o valor teórico da API
          return (areaCultivavel + estatisticas.area_cultivavel_teorica) / 2;
        }
        
        return areaCultivavel;
      } catch (error) {
        console.error("Erro ao calcular área cultivável:", error);
        return 0;
      }
    }

    // Função para criar um polígono aproximado da área cultivável
    // Como não temos o polígono real, vamos criar uma aproximação
    function criarPoligonoAreaCultivavel(geometrias: any, estatisticas: any): any {
      try {
        if (!geometrias || !geometrias.geometria_total) {
          return null;
        }
        
        // Calculamos a área cultivável como percentual da área total
        const areaTotal = estatisticas?.area_total || 0;
        const areaCultivavel = calcularAreaCultivavel(estatisticas);
        
        // Se a área cultivável for muito pequena, retornamos null
        if (areaCultivavel <= 0 || areaTotal <= 0) {
          return null;
        }
        
        // Calculamos o percentual da área cultivável em relação à área total
        const percentualCultivavel = areaCultivavel / areaTotal;
        
        // Criamos um Feature com o polígono total simplificado
        return {
          type: "Feature",
          properties: { 
            tipo: "cultivavel",
            area: areaCultivavel,
            percentual: (percentualCultivavel * 100).toFixed(2) + "%"
          },
          // Usamos o mesmo polígono da área total, mas com uma nota de que é uma aproximação
          geometry: geometrias.geometria_total
        };
      } catch (error) {
        console.error("Erro ao criar polígono da área cultivável:", error);
        return null;
      }
    }
    
    // Transformar os dados para um formato mais adequado para o frontend
    const formattedData = {
      car: data.codigo_car,
      status: data.ind_status || "AT", // Padrão para "Ativo" se não for informado
      tipo: data.ind_tipo || "RURAL",
      area_imovel: areaTotal,
      modulos_fiscais: data.mod_fiscal || 0,
      municipio: data.municipio,
      estado: data.estado,
      condicao: data.des_condic || "",
      criacao: data.dat_criaca || "",
      atualizacao: data.dat_atuali || "",
      nome_imovel: data.nome_imovel || "",
      situacao_imovel: data.situacao_imovel || "",
      classe_imovel: data.classe_imovel || "",
      
      // Dados geográficos do imóvel - garantir que a geometria existe
      poligono_imovel: {
        type: "Feature",
        geometry: data.geometrias?.geometria_total || { type: 'Polygon', coordinates: [[]] }
      },
      
      // Dados de reserva legal
      reserva_legal: {
        area: data.estatisticas?.reserva_legal || 0,
        percentual: data.estatisticas?.percentual_reserva_legal || 0,
        poligono: {
          type: "Feature",
          geometry: data.geometrias?.geometria_reserva || { type: 'Polygon', coordinates: [[]] }
        }
      },
      
      // Área de Preservação Permanente (Recursos Hídricos)
      app: {
        area: data.estatisticas?.recursos_hidricos || 0,
        percentual: areaTotal > 0 ? ((data.estatisticas?.recursos_hidricos || 0) / areaTotal) * 100 : 0,
        poligono: {
          type: "Feature",
          geometry: data.geometrias?.geometria_hidrica || { type: 'Polygon', coordinates: [[]] }
        }
      },
      
      // Área de Cultivo Ativa
      area_cultivo: {
        area: data.estatisticas?.area_cultivo_ativa || 0,
        percentual: areaTotal > 0 ? ((data.estatisticas?.area_cultivo_ativa || 0) / areaTotal) * 100 : 0,
        // Vamos usar a área calculada, mas ainda sem geometria específica
        poligono: null 
      },
      
      // Área de Cultivo Calculada (teórica): Área total - (RL + APP + Vegetação Nativa)
      area_cultivavel: {
        area: calcularAreaCultivavel(data.estatisticas),
        percentual: areaTotal > 0 ? 
          (calcularAreaCultivavel(data.estatisticas) / areaTotal) * 100 : 0,
        // Vamos criar uma aproximação do polígono da área cultivável
        poligono: criarPoligonoAreaCultivavel(data.geometrias, data.estatisticas)
      },
      
      // Área de Pousio
      area_pousio: {
        area: data.estatisticas?.area_pousio || 0,
        percentual: areaTotal > 0 ? ((data.estatisticas?.area_pousio || 0) / areaTotal) * 100 : 0,
        poligono: null // Não temos a geometria desta área
      },
      
      // Área Protegida
      area_protegida: {
        area: data.estatisticas?.area_protegida || 0,
        percentual: data.estatisticas?.percentual_area_protegida || 0,
        poligono: null // Não temos a geometria específica desta área
      },
      
      // Coordenadas do centro: calcular a partir do polígono principal com verificação de segurança
      coordenadas: {
        centro: calcularCentroPoligonoSeguro(data.geometrias?.geometria_total)
      },
      
      // Adicionar estatísticas gerais
      estatisticas: {
        percentual_ocupacao: data.estatisticas?.percentual_ocupacao || 0,
        area_cultivavel_teorica: data.estatisticas?.area_cultivavel_teorica || 0
      }
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Erro ao buscar dados do SICAR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : '';
    
    // Verificar se o erro é de conexão (API indisponível)
    if (error instanceof TypeError && errorMessage.includes('fetch')) {
      return new Response(JSON.stringify({ 
        error: 'Serviço SICAR indisponível', 
        message: 'Não foi possível conectar ao servidor do SICAR',
        details: errorMessage
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Erro ao processar a requisição',
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Função auxiliar para calcular o centro de um polígono
function calcularCentroPoligono(coords: number[][]) {
  if (!coords || coords.length === 0) {
    return [0, 0];
  }
  
  let sumLat = 0;
  let sumLng = 0;
  
  for (const point of coords) {
    sumLng += point[0];
    sumLat += point[1];
  }
  
  return [sumLat / coords.length, sumLng / coords.length];
}

// Função auxiliar segura para calcular o centro com verificações
function calcularCentroPoligonoSeguro(geometria: any): [number, number] {
  try {
    if (!geometria) {
      return [0, 0];
    }
    
    // Validar o tipo de geometria e extrair coordenadas conforme necessário
    if (geometria.type === 'Polygon' && geometria.coordinates && geometria.coordinates.length > 0) {
      return calcularCentroPoligono(geometria.coordinates[0]);
    } 
    else if (geometria.type === 'MultiPolygon' && geometria.coordinates && geometria.coordinates.length > 0) {
      if (geometria.coordinates[0] && geometria.coordinates[0].length > 0) {
        return calcularCentroPoligono(geometria.coordinates[0][0]);
      }
    }
    
    // Caso não consiga extrair, retorna valores padrão
    return [0, 0];
  } catch (error) {
    console.error("Erro ao calcular centro do polígono:", error);
    return [0, 0]; // Retornar valor padrão em caso de erro
  }
}

