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
  codigo_car: string;
  municipio: string;
  estado: string;
  estatisticas: Estatisticas;
  geometrias: Geometrias;
  // Campos opcionais
  cod_tema?: string;
  nom_tema?: string;
  mod_fiscal?: number;
  num_area?: number;
  ind_status?: string;
  ind_tipo?: string;
  des_condic?: string;
  cod_estado?: string;
  dat_criaca?: string;
  dat_atuali?: string;
  nome_imovel?: string;
  situacao_imovel?: string;
  classe_imovel?: string;
}

// Interface para os dados da API InfoSimples
interface InfoSimplesImovelResponse {
  code: number;
  code_message: string;
  data: Array<{
    area: number;
    car: string;
    coordenadas: number[][];
    municipio: string;
    status: string;
    tipo: string;
  }>;
  errors: unknown[];
}

interface InfoSimplesDemonstrativoResponse {
  code: number;
  code_message: string;
  data: Array<{
    area_preservacao_permanente: number;
    area_preservacao_permanente_area_remanescente_vegetacao_nativa: number;
    area_preservacao_permanente_area_rural_consolidada: number;
    area_uso_restrito: number;
    car: string;
    condicao_cadastro: string;
    imovel: {
      area: number;
      modulos_fiscais: number;
      endereco_municipio: string;
      endereco_uf: string;
      endereco_latitude: string;
      endereco_longitude: string;
      registro_data: string;
      analise_data: string | null;
      retificacao_data: string;
    };
    regularidade_ambiental: {
      passivo_excedente_reserva_legal: number;
      area_reserva_legal_recompor: number;
      area_preservacao_permanente_recompor: number;
    };
    reserva: {
      situacao: string;
      justificativa: string | null;
      area_averbada: number;
      area_nao_averbada: number;
      area_legal_proposta: number;
      area_legal_declarada: number;
    };
    restricoes: unknown[];
    situacao: string;
    solo: {
      area_nativa: number;
      area_uso: number;
      area_servidao_administrativa: number;
    };
    site_receipt: string;
  }>;
  errors: unknown[];
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
    // Buscar token da API InfoSimples do ambiente
    const token = process.env.INFO_SIMPLES_TOKEN;
    if (!token) {
      throw new Error('Token da API InfoSimples não configurado');
    }

    // Buscar dados do imóvel na API InfoSimples
    const imovelResponse = await fetch('https://api.infosimples.com/api/v2/consultas/car/imovel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
        car: numeroCAR
      })
    });

    if (!imovelResponse.ok) {
      throw new Error(`Erro ao buscar dados do imóvel: ${imovelResponse.statusText}`);
    }

    const imovelData: InfoSimplesImovelResponse = await imovelResponse.json();
    
    if (imovelData.code !== 200 || !imovelData.data || imovelData.data.length === 0) {
      throw new Error(imovelData.code_message || 'Não foi possível obter dados do imóvel');
    }

    // Buscar dados do demonstrativo na API InfoSimples
    const demonstrativoResponse = await fetch('https://api.infosimples.com/api/v2/consultas/car/demonstrativo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
        car: numeroCAR
      })
    });

    if (!demonstrativoResponse.ok) {
      throw new Error(`Erro ao buscar dados do demonstrativo: ${demonstrativoResponse.statusText}`);
    }

    const demonstrativoData: InfoSimplesDemonstrativoResponse = await demonstrativoResponse.json();
    
    if (demonstrativoData.code !== 200 || !demonstrativoData.data || demonstrativoData.data.length === 0) {
      throw new Error(demonstrativoData.code_message || 'Não foi possível obter dados do demonstrativo');
    }

    // Extrair dados das respostas
    const imovel = imovelData.data[0];
    const demonstrativo = demonstrativoData.data[0];

    // Converter coordenadas da API para formato GeoJSON MultiPolygon
    const coordenadasToGeoJsonPolygon = (coordenadas: number[][]): GeometriaMultiPolygon => {
      return {
        type: 'MultiPolygon',
        coordinates: [
          [coordenadas]
        ]
      };
    };

    // Como a API não fornece polígonos separados para reserva legal e APP,
    // vamos criar geometrias estimadas baseadas na área total
    const geometriaTotal = coordenadasToGeoJsonPolygon(imovel.coordenadas);
    
    // Criar dados no formato esperado pelo aplicativo
    const data: DadosCAR = {
      codigo_car: imovel.car,
      municipio: imovel.municipio,
      estado: demonstrativo.imovel.endereco_uf,
      mod_fiscal: demonstrativo.imovel.modulos_fiscais,
      ind_status: demonstrativo.situacao,
      ind_tipo: imovel.tipo,
      des_condic: demonstrativo.condicao_cadastro,
      dat_criaca: demonstrativo.imovel.registro_data,
      dat_atuali: demonstrativo.imovel.retificacao_data,
      situacao_imovel: demonstrativo.situacao,
      
      // Construir estatísticas a partir dos dados do demonstrativo
      estatisticas: {
        area_total: demonstrativo.imovel.area,
        reserva_legal: demonstrativo.reserva.area_legal_declarada,
        area_cultivo_total: demonstrativo.solo.area_uso,
        area_cultivo_ativa: demonstrativo.solo.area_uso,
        area_pousio: 0, // Não fornecido diretamente pela API
        area_protegida: demonstrativo.area_preservacao_permanente,
        area_cultivavel_teorica: demonstrativo.solo.area_uso,
        recursos_hidricos: demonstrativo.area_preservacao_permanente,
        percentual_ocupacao: (demonstrativo.solo.area_uso / demonstrativo.imovel.area) * 100,
        percentual_reserva_legal: (demonstrativo.reserva.area_legal_declarada / demonstrativo.imovel.area) * 100,
        percentual_area_protegida: (demonstrativo.area_preservacao_permanente / demonstrativo.imovel.area) * 100
      },
      
      // Construir geometrias a partir das coordenadas do imóvel
      geometrias: {
        geometria_total: geometriaTotal,
        // Criar geometrias aproximadas para reserva e APP (já que a API não fornece polígonos separados)
        geometria_reserva: geometriaTotal,
        geometria_hidrica: geometriaTotal
      }
    };

    // Extrair valores com segurança usando operador opcional ?. e garantindo valores padrão
    const areaTotal = data.estatisticas?.area_total || 0;
    
    // Função para calcular área cultivável seguindo a fórmula:
    // Área de cultivo ≈ Área total - (RL + APP + Uso Restrito + Vegetação Nativa)
    function calcularAreaCultivavel(estatisticas: Estatisticas | undefined): number {
      try {
        if (!estatisticas) return 0;
        
        const areaTotal = estatisticas.area_total || 0;
        const reservaLegal = estatisticas.reserva_legal || 0;
        const recursosHidricos = estatisticas.recursos_hidricos || 0; // APP
        
        // Alguns valores do demonstrativo da API
        const vegetacaoNativa = demonstrativo.solo.area_nativa || 0;
        const usoRestrito = demonstrativo.area_uso_restrito || 0;
        
        // Calculamos a área cultivável
        let areaCultivavel = areaTotal - (reservaLegal + recursosHidricos + usoRestrito + vegetacaoNativa);
        
        // Garantimos que não seja negativa
        areaCultivavel = Math.max(0, areaCultivavel);
        
        // Se temos uma área cultivável teórica já calculada, podemos usar ela também
        if (estatisticas.area_cultivavel_teorica && estatisticas.area_cultivavel_teorica > 0) {
          // Podemos usar a média entre o nosso cálculo e o valor teórico 
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
    function criarPoligonoAreaCultivavel(geometrias: Geometrias | undefined, estatisticas: Estatisticas | undefined): object | null {
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
        area: demonstrativo.reserva.area_legal_declarada || 0,
        percentual: (demonstrativo.reserva.area_legal_declarada / demonstrativo.imovel.area) * 100 || 0,
        poligono: {
          type: "Feature",
          geometry: data.geometrias?.geometria_reserva || { type: 'Polygon', coordinates: [[]] }
        }
      },
      
      // Área de Preservação Permanente (Recursos Hídricos)
      app: {
        area: demonstrativo.area_preservacao_permanente || 0,
        percentual: (demonstrativo.area_preservacao_permanente / demonstrativo.imovel.area) * 100 || 0,
        poligono: {
          type: "Feature",
          geometry: data.geometrias?.geometria_hidrica || { type: 'Polygon', coordinates: [[]] }
        }
      },
      
      // Área de Cultivo Ativa
      area_cultivo: {
        area: demonstrativo.solo.area_uso || 0,
        percentual: (demonstrativo.solo.area_uso / demonstrativo.imovel.area) * 100 || 0,
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
      
      
      // Área Nativa (vegetação nativa)
      area_protegida: {
        area: demonstrativo.solo.area_nativa || 0,
        percentual: (demonstrativo.solo.area_nativa / demonstrativo.imovel.area) * 100 || 0,
        poligono: null
      },
      
      // Coordenadas do centro: calcular a partir do polígono principal
      coordenadas: {
        centro: calcularCentroPoligonoSeguro(data.geometrias?.geometria_total)
      },
      
      // Adicionar estatísticas adicionais do demonstrativo
      estatisticas: {
        percentual_ocupacao: (demonstrativo.solo.area_uso / demonstrativo.imovel.area) * 100 || 0,
        area_cultivavel_teorica: demonstrativo.solo.area_uso || 0
      },
      
      // Adicionar dados específicos da API InfoSimples
      area_preservacao_permanente: demonstrativo.area_preservacao_permanente,
      area_preservacao_permanente_area_remanescente_vegetacao_nativa: demonstrativo.area_preservacao_permanente_area_remanescente_vegetacao_nativa,
      area_preservacao_permanente_area_rural_consolidada: demonstrativo.area_preservacao_permanente_area_rural_consolidada,
      area_uso_restrito: demonstrativo.area_uso_restrito,
      regularidade_ambiental: demonstrativo.regularidade_ambiental,
      reserva_situacao: demonstrativo.reserva.situacao,
      reserva_justificativa: demonstrativo.reserva.justificativa,
      reserva_area_averbada: demonstrativo.reserva.area_averbada,
      reserva_area_nao_averbada: demonstrativo.reserva.area_nao_averbada,
      reserva_area_legal_proposta: demonstrativo.reserva.area_legal_proposta,
      reserva_area_legal_declarada: demonstrativo.reserva.area_legal_declarada,
      
      // Adicionar dados do solo
      solo: demonstrativo.solo
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Erro ao buscar dados do SICAR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    // const errorStack = error instanceof Error ? error.stack : '';
    
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
      message: "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
      // Nunca expor stack trace, mesmo em desenvolvimento 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Função auxiliar para calcular o centro de um polígono
function calcularCentroPoligono(coords: number[][]): [number, number] {
  if (!coords || coords.length < 2) {
    return [0, 0];
  }
  let sumLat = 0;
  let sumLng = 0;
  for (const point of coords) {
    sumLng += point[0];
    sumLat += point[1];
  }
  return [sumLat / coords.length, sumLng / coords.length] as [number, number];
}

// Função auxiliar segura para calcular o centro com verificações
function calcularCentroPoligonoSeguro(geometria: Geometria | undefined): [number, number] {
  try {
    if (!geometria) {
      return [0, 0];
    }
    // Validar o tipo de geometria e extrair coordenadas conforme necessário
    if (geometria.type === 'Polygon' && Array.isArray(geometria.coordinates[0]) && geometria.coordinates[0].length >= 2) {
      return calcularCentroPoligono(geometria.coordinates[0]);
    } 
    else if (geometria.type === 'MultiPolygon' && Array.isArray(geometria.coordinates[0]) && Array.isArray(geometria.coordinates[0][0]) && geometria.coordinates[0][0].length >= 2) {
      return calcularCentroPoligono(geometria.coordinates[0][0]);
    }
    // Caso não consiga extrair, retorna valores padrão
    return [0, 0];
  } catch (error) {
    console.error("Erro ao calcular centro do polígono:", error);
    return [0, 0]; // Retornar valor padrão em caso de erro
  }
}

