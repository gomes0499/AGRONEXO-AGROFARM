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
    // Dados fixos para teste - substituindo a chamada à API externa
    const rawData = {
      "codigo_car": "BA-2933455-07DE4C04FC994BAC9D2A3ABE19C0A6B1",
      "estado": "BA",
      "municipio": "Wanderley",
      "estatisticas": {
        "area_total": 83.89683171042174,
        "reserva_legal": 4.580004901657653,
        "area_cultivo_total": 56.36962281957116,
        "area_cultivo_ativa": 42.77517431816566,
        "area_pousio": 13.594448501405502,
        "area_protegida": 29.09138704425551,
        "area_cultivavel_teorica": 54.805444666166224,
        "recursos_hidricos": 2.434130821467923,
        "percentual_ocupacao": 67.18921521868253,
        "percentual_reserva_legal": 5.459091610832213,
        "percentual_area_protegida": 34.6751914835918
      },
      "geometrias": {
        "geometria_total": {
          "type": "Polygon",
          "coordinates": [[
            [-43.8263726234436, -11.805375705573574],
            [-43.83426904678345, -11.802519173390817],
            [-43.83450508117676, -11.796322916748823],
            [-43.829419612884514, -11.794453510143265],
            [-43.82439851760864, -11.796364925739704],
            [-43.8263726234436, -11.805375705573574]
          ]]
        },
        "geometria_reserva": {
          "type": "MultiPolygon",
          "coordinates": [
            [[
              [-43.8281966243818, -11.803650297872142],
              [-43.82946120523308, -11.804258410704618],
              [-43.82823944091797, -11.803611380386752],
              [-43.8281966243818, -11.803650297872142]
            ]],
            [[
              [-43.82948187845731, -11.804250932163031],
              [-43.83285909913576, -11.803029222137988],
              [-43.827595710754395, -11.802393149226702],
              [-43.82948187845731, -11.804250932163031]
            ]]
          ]
        },
        "geometria_hidrica": {
          "type": "MultiPolygon",
          "coordinates": [
            [[
              [-43.83448362350464, -11.79682702421471],
              [-43.83377552032471, -11.796322916748823],
              [-43.834054470062256, -11.796700997435087],
              [-43.83448362350464, -11.79682702421471]
            ]],
            [[
              [-43.82725238800049, -11.805102655989696],
              [-43.82823944091797, -11.803611380386752],
              [-43.82952690124512, -11.80432551337779],
              [-43.82896900177002, -11.803401340917732],
              [-43.82811069488525, -11.80346435277533],
              [-43.82744550704955, -11.80407346665218],
              [-43.82725238800049, -11.805102655989696]
            ]],
            [[
              [-43.83270465402896, -11.799518113026151],
              [-43.83323967038744, -11.798322599811902],
              [-43.8332195061826, -11.797794309394455],
              [-43.833941752275415, -11.797782719412227],
              [-43.83339266477481, -11.797842912355408],
              [-43.8332604705493, -11.798437664244377],
              [-43.832830382599866, -11.799494529473973],
              [-43.833522286345854, -11.802961304026272],
              [-43.832876158550164, -11.79949688375149],
              [-43.83452038021349, -11.797734778159777],
              [-43.83317984997008, -11.79775678833994],
              [-43.83265922407133, -11.799510855706519],
              [-43.833393884967286, -11.802919226684974],
              [-43.83270465402896, -11.799518113026151]
            ]]
          ]
        }
      }
    };
    
    // Verificar se os dados recebidos seguem a estrutura esperada
    // console.log("Dados recebidos da API SICAR:", JSON.stringify(rawData));
    
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

