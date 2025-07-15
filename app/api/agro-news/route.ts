import { NextRequest, NextResponse } from "next/server";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  category?: string;
}

// Cache em memória para armazenar notícias
let newsCache: NewsItem[] = [];
let lastFetch: Date | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Fontes confiáveis de notícias do agronegócio
const NEWS_SOURCES = {
  // RSS Feeds que podemos tentar acessar
  globoRural: "https://g1.globo.com/economia/agronegocios/rss/agronegocios.xml",
  canalRural: "https://www.canalrural.com.br/feed/",
  agrolink: "https://www.agrolink.com.br/rss/",
  // APIs que podemos usar
  newsApi: process.env.NEWS_API_KEY ? "https://newsapi.org/v2/everything" : null,
};

// Função para buscar notícias de RSS
async function fetchRSSNews(url: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 }, // Cache por 30 minutos
    });
    
    if (!response.ok) return [];
    
    const text = await response.text();
    const items: NewsItem[] = [];
    
    // Parse básico de RSS - extrair items
    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
    
    itemMatches.slice(0, 10).forEach((item, index) => {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                        item.match(/<title>(.*?)<\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      
      if (titleMatch && linkMatch) {
        items.push({
          id: `${sourceName}-${index}`,
          title: titleMatch[1].trim(),
          url: linkMatch[1].trim(),
          source: sourceName,
          publishedAt: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
        });
      }
    });
    
    return items;
  } catch (error) {
    console.error(`Erro ao buscar RSS de ${sourceName}:`, error);
    return [];
  }
}

// Função para buscar notícias via News API
async function fetchNewsAPI(): Promise<NewsItem[]> {
  if (!process.env.NEWS_API_KEY) return [];
  
  try {
    // Buscar notícias em português sobre agronegócio
    const query = encodeURIComponent(
      'agronegócio OR agricultura OR (safra AND Brasil) OR (soja AND Brasil) OR (milho AND Brasil) OR (pecuária AND Brasil) OR (boi gordo) OR (café AND Brasil) OR (algodão AND Brasil) OR (exportação agrícola) OR (Embrapa) OR (Ministério da Agricultura)'
    );
    
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${query}&language=pt&sortBy=publishedAt&pageSize=30&apiKey=${process.env.NEWS_API_KEY}`,
      { next: { revalidate: 1800 } }
    );
    
    if (!response.ok) {
      console.error("News API erro:", response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    
    // Filtrar apenas notícias relevantes ao agronegócio
    const agriKeywords = [
      'agronegócio', 'agronegocio', 'agricultura', 'safra', 'soja', 'milho', 
      'boi gordo', 'pecuária', 'pecuaria', 'café', 'algodão', 'cana-de-açúcar',
      'commodities', 'exportação agrícola', 'produtor rural', 'fazenda', 
      'colheita', 'plantio', 'embrapa', 'cooperativa', 'grãos', 'arroba', 
      'hectare', 'lavoura', 'rebanho', 'suíno', 'frango', 'avicultura',
      'fertilizante', 'defensivo', 'máquina agrícola', 'trator', 'irrigação'
    ];
    
    // Palavras que indicam que NÃO é notícia de agro
    const excludeKeywords = [
      'game', 'gaming', 'videogame', 'esports', 'futebol', 'basquete', 'vôlei',
      'filme', 'série', 'netflix', 'música', 'show', 'celebridade', 'fofoca',
      'moda', 'beleza', 'tecnologia da informação', 'smartphone', 'iphone',
      'baldur', 'playstation', 'xbox', 'nintendo', 'steam', 'política partidária',
      'eleição municipal', 'eleição estadual', 'crime', 'polícia', 'assalto',
      'acidente de trânsito', 'reality', 'bbb', 'novela', 'artista'
    ];
    
    // Fontes confiáveis de agronegócio
    const trustedSources = [
      'globo rural', 'canal rural', 'agrolink', 'notícias agrícolas',
      'portal dbo', 'avicultura industrial', 'suinocultura industrial',
      'cepea', 'embrapa', 'mapa', 'conab', 'beef point', 'milk point',
      'farmnews', 'agrofy', 'revista cultivar', 'grupo cultivar',
      'valor econômico', 'broadcast agro', 'reuters', 'bloomberg'
    ];
    
    return data.articles
      .filter((article: any) => {
        // Validar que tem URL válida
        if (!article.url || !article.url.startsWith('http')) {
          return false;
        }
        
        const text = `${article.title} ${article.description || ''}`.toLowerCase();
        const sourceName = (article.source?.name || '').toLowerCase();
        
        // Excluir se tiver palavras não relacionadas
        if (excludeKeywords.some(keyword => text.includes(keyword))) {
          return false;
        }
        
        // Priorizar fontes confiáveis
        const isTrustedSource = trustedSources.some(source => 
          sourceName.includes(source)
        );
        
        // Se for fonte confiável, aceitar com menos rigor
        if (isTrustedSource) {
          return agriKeywords.slice(0, 10).some(keyword => text.includes(keyword));
        }
        
        // Para outras fontes, ser mais rigoroso
        const matchCount = agriKeywords.filter(keyword => text.includes(keyword)).length;
        return matchCount >= 2; // Precisa ter pelo menos 2 palavras-chave
      })
      .slice(0, 20)
      .map((article: any, index: number) => ({
        id: `newsapi-${index}`,
        title: article.title,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        category: detectCategory(article.title)
      }));
  } catch (error) {
    console.error("Erro ao buscar News API:", error);
    return [];
  }
}

// Função para detectar categoria da notícia
function detectCategory(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('soja')) return 'Soja';
  if (titleLower.includes('milho')) return 'Milho';
  if (titleLower.includes('boi') || titleLower.includes('gado') || titleLower.includes('pecuária')) return 'Pecuária';
  if (titleLower.includes('café')) return 'Café';
  if (titleLower.includes('algodão')) return 'Algodão';
  if (titleLower.includes('cana')) return 'Cana';
  if (titleLower.includes('exporta')) return 'Exportação';
  if (titleLower.includes('crédito') || titleLower.includes('financ')) return 'Crédito';
  if (titleLower.includes('tecnolog') || titleLower.includes('inova')) return 'Tecnologia';
  
  return 'Mercado';
}

// Notícias de exemplo para desenvolvimento
const EXAMPLE_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Safra de soja 2024/25 deve alcançar recorde de 166 milhões de toneladas",
    url: "https://www.canalrural.com.br/noticias/agricultura/soja/safra-soja-2024-25-recorde",
    source: "Canal Rural",
    publishedAt: new Date().toISOString(),
    category: "Soja"
  },
  {
    id: "2",
    title: "Preço do milho sobe 3% com alta demanda para exportação",
    url: "https://g1.globo.com/economia/agronegocios/noticia/2025/01/15/preco-milho-alta.ghtml",
    source: "Globo Rural",
    publishedAt: new Date().toISOString(),
    category: "Milho"
  },
  {
    id: "3",
    title: "Clima favorável impulsiona plantio de algodão no Centro-Oeste",
    url: "https://www.agrolink.com.br/noticias/clima-favoravel-plantio-algodao",
    source: "Agrolink",
    publishedAt: new Date().toISOString(),
    category: "Algodão"
  },
  {
    id: "4",
    title: "Exportações do agronegócio brasileiro batem novo recorde em 2024",
    url: "https://www.gov.br/agricultura/pt-br/assuntos/noticias/exportacoes-agro-recorde",
    source: "MAPA",
    publishedAt: new Date().toISOString(),
    category: "Mercado"
  },
  {
    id: "5",
    title: "Nova tecnologia de irrigação pode economizar até 40% de água",
    url: "https://www.embrapa.br/busca-de-noticias/-/noticia/tecnologia-irrigacao",
    source: "Embrapa",
    publishedAt: new Date().toISOString(),
    category: "Tecnologia"
  },
  {
    id: "6",
    title: "Mercado de café arábica tem alta de 5% na semana",
    url: "https://www.cepea.esalq.usp.br/br/diarias-de-mercado/cafe-arabica-alta.aspx",
    source: "CEPEA",
    publishedAt: new Date().toISOString(),
    category: "Café"
  },
  {
    id: "7",
    title: "Governo anuncia nova linha de crédito para produtores rurais",
    url: "https://www.bndes.gov.br/wps/portal/site/home/imprensa/noticias/credito-rural",
    source: "BNDES",
    publishedAt: new Date().toISOString(),
    category: "Crédito"
  },
  {
    id: "8",
    title: "Pecuária sustentável ganha destaque em feiras internacionais",
    url: "https://www.beefpoint.com.br/pecuaria-sustentavel-feiras",
    source: "BeefPoint",
    publishedAt: new Date().toISOString(),
    category: "Pecuária"
  }
];

export async function GET(request: NextRequest) {
  try {
    // Verificar se precisa atualizar o cache
    const now = new Date();
    if (!lastFetch || now.getTime() - lastFetch.getTime() > CACHE_DURATION) {
      
      const allNews: NewsItem[] = [];
      
      // Tentar News API se configurada
      if (process.env.NEWS_API_KEY) {
        const newsApiItems = await fetchNewsAPI();
        allNews.push(...newsApiItems);
      } else {
      }
      
      // Se não conseguiu notícias reais, usar exemplos
      if (allNews.length === 0) {
        newsCache = EXAMPLE_NEWS;
      } else {
        // Ordenar por data mais recente
        newsCache = allNews.sort((a, b) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      }
      
      lastFetch = now;
    }
    
    return NextResponse.json({
      news: newsCache,
      lastUpdate: lastFetch,
      cached: true,
      total: newsCache.length
    });
  } catch (error) {
    console.error("Erro ao buscar notícias:", error);
    return NextResponse.json({
      news: EXAMPLE_NEWS,
      error: "Usando notícias de exemplo",
      cached: false
    });
  }
}