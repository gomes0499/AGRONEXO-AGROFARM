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

        console.log(
          `Ticker de notícias RSS: ${data.total || 0} notícias carregadas`
        );
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

  return (
    <div className="w-full relative bg-background border-b">
      <style jsx global>{`
        .news-ticker-container {
          width: 100%;
          position: relative;
          overflow: hidden;
          height: 2.5rem;
          background-color: hsl(var(--background));
          border-bottom: 1px solid hsl(var(--border));
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
          animation: newsTickerScroll 180s linear infinite;
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
          padding: 0 1.5rem;
          border-right: 1px solid hsl(var(--border));
          white-space: nowrap;
          cursor: pointer;
          transition: background-color 0.2s;
          min-width: fit-content;
        }

        .news-ticker-item:hover {
          background-color: hsl(var(--muted));
        }

        .news-ticker-icon {
          width: 1rem;
          height: 1rem;
          margin-right: 0.5rem;
          color: hsl(var(--muted-foreground));
        }

        .news-ticker-source {
          font-size: 0.75rem;
          font-weight: 600;
          color: hsl(var(--primary));
          margin-right: 0.5rem;
          text-transform: uppercase;
        }

        .news-ticker-title {
          font-size: 0.875rem;
          color: hsl(var(--foreground));
          max-width: 600px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .news-ticker-time {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
          margin-left: 0.5rem;
        }

        .news-ticker-external {
          width: 0.875rem;
          height: 0.875rem;
          margin-left: 0.5rem;
          color: hsl(var(--muted-foreground));
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
          width: 50px;
          background: linear-gradient(
            to right,
            hsl(var(--background)),
            transparent
          );
          z-index: 5;
        }

        .news-ticker-fade-right {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 50px;
          background: linear-gradient(
            to left,
            hsl(var(--background)),
            transparent
          );
          z-index: 5;
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
                <Newspaper className="news-ticker-icon" />
                <span className="news-ticker-source">{item.source}</span>
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
                <Newspaper className="news-ticker-icon" />
                <span className="news-ticker-source">{item.source}</span>
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
