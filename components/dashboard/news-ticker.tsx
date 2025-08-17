"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import type { NewsItem } from "@/app/api/agro-news/route";

export function NewsTicker() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Usar RSS como fonte principal
        const response = await fetch("/api/agro-news/rss");
        const data = await response.json();

        setNewsItems(data.news || []);
      } catch (error) {
        console.error("Erro ao buscar notícias:", error);
      } finally {
        setLoading(false);
      }
    };

    // Buscar notícias imediatamente
    fetchNews();

    // Atualizar a cada 15 minutos
    const interval = setInterval(fetchNews, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading || newsItems.length === 0) {
    return null;
  }

  const handleNewsClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Função para determinar a classe CSS baseada na fonte ou conteúdo
  const getSourceClass = (source: string): string => {
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes("agro") || sourceLower.includes("beefpoint")) {
      return "news-source-agronews";
    } else if (sourceLower.includes("tecnologia") || sourceLower.includes("tech")) {
      return "news-source-tecnologia";
    } else if (sourceLower.includes("export") || sourceLower.includes("china")) {
      return "news-source-exportacao";
    } else if (sourceLower.includes("clima") || sourceLower.includes("tempo")) {
      return "news-source-clima";
    } else if (sourceLower.includes("urgente") || sourceLower.includes("inmet")) {
      return "news-source-urgente";
    } else if (sourceLower.includes("mercado") || sourceLower.includes("broadcast")) {
      return "news-source-mercado";
    }
    return "news-source-agronews"; // default
  };

  return (
    <div className="w-full relative">
      <style jsx global>{`
        .news-ticker-container {
          width: 100%;
          position: relative;
          overflow: hidden;
          height: 2.5rem;
          background-color: #000000;
          border-bottom: 1px solid #1a1a1a;
        }

        .news-ticker-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          white-space: nowrap;
          overflow: hidden;
        }

        .news-ticker-track {
          position: absolute;
          height: 100%;
          display: inline-flex;
          animation: newsTickerScroll 120s linear infinite;
          will-change: transform;
        }

        .news-ticker-track:hover {
          animation-play-state: paused;
        }

        @keyframes newsTickerScroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .news-ticker-item {
          display: inline-flex;
          align-items: center;
          height: 100%;
          padding: 0 2rem;
          white-space: nowrap;
          cursor: pointer;
          transition: background-color 0.2s;
          min-width: fit-content;
          font-size: 0.8125rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .news-ticker-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .news-ticker-icon {
          width: 0.875rem;
          height: 0.875rem;
          margin-right: 0.5rem;
          color: #6b7280;
        }

        .news-ticker-source {
          font-size: 0.7rem;
          font-weight: 700;
          margin-right: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.125rem 0.375rem;
          border-radius: 0.125rem;
        }
        
        .news-source-agronews {
          color: #10b981;
          background-color: rgba(16, 185, 129, 0.15);
        }
        
        .news-source-tecnologia {
          color: #3b82f6;
          background-color: rgba(59, 130, 246, 0.15);
        }
        
        .news-source-exportacao {
          color: #f59e0b;
          background-color: rgba(245, 158, 11, 0.15);
        }
        
        .news-source-clima {
          color: #06b6d4;
          background-color: rgba(6, 182, 212, 0.15);
        }
        
        .news-source-urgente {
          color: #ef4444;
          background-color: rgba(239, 68, 68, 0.15);
        }
        
        .news-source-mercado {
          color: #8b5cf6;
          background-color: rgba(139, 92, 246, 0.15);
        }

        .news-ticker-title {
          font-size: 0.8125rem;
          color: #e5e7eb;
          max-width: none;
          overflow: visible;
        }

        .news-ticker-time {
          font-size: 0.75rem;
          color: #6b7280;
          margin-left: 0.75rem;
        }

        .news-ticker-external {
          width: 0.75rem;
          height: 0.75rem;
          margin-left: 0.5rem;
          color: #6b7280;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .news-ticker-item:hover .news-ticker-external {
          opacity: 1;
        }

        .news-ticker-fade-left {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 60px;
          background: linear-gradient(
            to right,
            #000000,
            transparent
          );
          z-index: 5;
          pointer-events: none;
        }

        .news-ticker-fade-right {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 60px;
          background: linear-gradient(
            to left,
            #000000,
            transparent
          );
          z-index: 5;
          pointer-events: none;
        }
      `}</style>

      <div
        className="news-ticker-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="news-ticker-wrapper">
          <div
            className="news-ticker-track"
            style={{ animationPlayState: isPaused ? "paused" : "running" }}
          >
            {/* Primeira cópia das notícias */}
            {newsItems.map((item) => (
              <div
                key={`${item.id}-1`}
                className="news-ticker-item"
                onClick={() => handleNewsClick(item.url)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleNewsClick(item.url);
                  }
                }}
              >
                <span className={`news-ticker-source ${getSourceClass(item.source)}`}>
                  {item.source}
                </span>
                <span className="news-ticker-title">{item.title}</span>
                <span className="news-ticker-time">
                  {formatTimeAgo(item.publishedAt)}
                </span>
                <ExternalLink className="news-ticker-external" />
              </div>
            ))}

            {/* Segunda cópia para loop contínuo */}
            {newsItems.map((item) => (
              <div
                key={`${item.id}-2`}
                className="news-ticker-item"
                onClick={() => handleNewsClick(item.url)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleNewsClick(item.url);
                  }
                }}
              >
                <span className={`news-ticker-source ${getSourceClass(item.source)}`}>
                  {item.source}
                </span>
                <span className="news-ticker-title">{item.title}</span>
                <span className="news-ticker-time">
                  {formatTimeAgo(item.publishedAt)}
                </span>
                <ExternalLink className="news-ticker-external" />
              </div>
            ))}
          </div>
        </div>

        {/* Gradientes de fade nas bordas */}
        <div className="news-ticker-fade-left" />
        <div className="news-ticker-fade-right" />
      </div>
    </div>
  );
}

// Função auxiliar para formatar tempo relativo
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}min atrás`;
  } else if (diffHours < 24) {
    return `${diffHours}h atrás`;
  } else if (diffDays === 1) {
    return "ontem";
  } else if (diffDays < 7) {
    return `${diffDays} dias atrás`;
  } else {
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
  }
}
