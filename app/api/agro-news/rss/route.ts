import { NextResponse } from "next/server";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  category?: string;
}

// Fontes RSS confiáveis focadas em agricultura e pecuária
const RSS_SOURCES = [
  {
    name: "Canal Rural",
    url: "https://www.canalrural.com.br/feed/",
    category: "Agricultura"
  },
  {
    name: "BeefPoint",
    url: "https://www.beefpoint.com.br/feed/",
    category: "Pecuária"
  },
  {
    name: "MilkPoint",
    url: "https://www.milkpoint.com.br/feed/",
    category: "Pecuária Leiteira"
  },
  {
    name: "AgroNews Brasil",
    url: "https://agronewsbrasil.com.br/feed/",
    category: "Agricultura"
  },
  {
    name: "Compre Rural",
    url: "https://www.comprerural.com/feed/",
    category: "Mercado"
  },
  {
    name: "Portal do Agronegócio",
    url: "https://www.portaldoagronegocio.com.br/feed",
    category: "Agricultura"
  }
];

// Cache em memória
let newsCache: NewsItem[] = [];
let lastFetch: Date | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

async function parseRSSFeed(url: string, sourceName: string, category: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AgroNewsFeed/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 900 } // Cache por 15 minutos
    });

    if (!response.ok) {
      console.error(`Erro ao buscar RSS de ${sourceName}: ${response.status}`);
      return [];
    }

    const text = await response.text();
    const items: NewsItem[] = [];

    // Extrair items do RSS
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = text.matchAll(itemRegex);

    let index = 0;
    for (const match of matches) {
      if (index >= 5) break; // Máximo 5 notícias por fonte
      
      const itemContent = match[1];
      
      // Extrair título
      const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
      if (!titleMatch) continue;
      
      // Extrair link
      const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/);
      if (!linkMatch) continue;
      
      // Extrair data
      const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
      
      // Limpar título de CDATA e HTML entities
      let title = titleMatch[1]
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      // Limpar link
      let link = linkMatch[1]
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '')
        .trim();

      // Filtrar apenas notícias de agricultura e pecuária
      const titleLower = title.toLowerCase();
      const agriculturaKeywords = [
        'soja', 'milho', 'trigo', 'algodão', 'café', 'cana', 'safra', 
        'plantio', 'colheita', 'lavoura', 'grãos', 'commodity', 'commodities',
        'agricultura', 'agrícola', 'produtor', 'fazenda', 'campo',
        'fertilizante', 'defensivo', 'semente', 'irrigação', 'cultivo'
      ];
      
      const pecuariaKeywords = [
        'boi', 'gado', 'pecuária', 'arroba', 'bezerro', 'vaca',
        'corte', 'carne', 'frigorífico', 'abate', 'confinamento',
        'pasto', 'pastagem', 'rebanho', 'bovino', 'nelore', 'angus'
      ];
      
      const excludeKeywords = [
        'futebol', 'eleição', 'política', 'ministro', 'presidente',
        'crime', 'polícia', 'acidente', 'show', 'festa', 'evento social'
      ];
      
      // Excluir se tiver palavras não relacionadas
      if (excludeKeywords.some(keyword => titleLower.includes(keyword))) {
        continue;
      }
      
      // Incluir apenas se for sobre agricultura ou pecuária
      const isAgricultura = agriculturaKeywords.some(keyword => titleLower.includes(keyword));
      const isPecuaria = pecuariaKeywords.some(keyword => titleLower.includes(keyword));
      
      if (!isAgricultura && !isPecuaria) {
        continue;
      }

      items.push({
        id: `${sourceName}-${Date.now()}-${index}`,
        title,
        url: link,
        source: sourceName,
        publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
        category: isPecuaria ? "Pecuária" : "Agricultura"
      });
      
      index++;
    }

    return items;
  } catch (error) {
    console.error(`Erro ao processar RSS de ${sourceName}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    const now = new Date();
    
    // Verificar cache
    if (lastFetch && now.getTime() - lastFetch.getTime() < CACHE_DURATION && newsCache.length > 0) {
      return NextResponse.json({
        news: newsCache,
        lastUpdate: lastFetch,
        cached: true,
        total: newsCache.length
      });
    }

    
    // Buscar de todas as fontes em paralelo
    const promises = RSS_SOURCES.map(source => 
      parseRSSFeed(source.url, source.name, source.category)
    );
    
    const results = await Promise.all(promises);
    
    // Intercalar notícias de diferentes fontes
    const interleavedNews: NewsItem[] = [];
    const newsBySource: Map<string, NewsItem[]> = new Map();
    
    // Agrupar notícias por fonte
    results.forEach((sourceNews, index) => {
      if (sourceNews.length > 0) {
        const sourceName = RSS_SOURCES[index].name;
        // Ordenar notícias de cada fonte por data
        const sortedNews = sourceNews.sort((a, b) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
        newsBySource.set(sourceName, sortedNews);
      }
    });
    
    // Intercalar notícias alternando entre fontes
    let hasMoreNews = true;
    let currentIndex = 0;
    
    while (hasMoreNews && interleavedNews.length < 40) {
      hasMoreNews = false;
      
      for (const [sourceName, sourceNews] of newsBySource) {
        if (currentIndex < sourceNews.length) {
          interleavedNews.push(sourceNews[currentIndex]);
          hasMoreNews = true;
        }
      }
      
      currentIndex++;
    }
    
    // Remover duplicatas mantendo a ordem intercalada
    const uniqueTitles = new Set<string>();
    newsCache = interleavedNews.filter(item => {
      const titleLower = item.title.toLowerCase();
      if (uniqueTitles.has(titleLower)) {
        return false;
      }
      uniqueTitles.add(titleLower);
      return true;
    }).slice(0, 30); // Máximo 30 notícias
    
    lastFetch = now;
    
    
    return NextResponse.json({
      news: newsCache,
      lastUpdate: lastFetch,
      cached: false,
      total: newsCache.length
    });
  } catch (error) {
    console.error("Erro geral ao buscar RSS:", error);
    
    // Retornar cache antigo se houver
    if (newsCache.length > 0) {
      return NextResponse.json({
        news: newsCache,
        lastUpdate: lastFetch,
        cached: true,
        error: "Usando cache devido a erro",
        total: newsCache.length
      });
    }
    
    return NextResponse.json({
      news: [],
      error: "Erro ao buscar notícias",
      cached: false,
      total: 0
    });
  }
}