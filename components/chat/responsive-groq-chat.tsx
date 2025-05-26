"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Copy,
  Loader2,
  RefreshCw,
  Send,
  Trash2,
  User,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";

interface ResponsiveGroqChatProps {
  initialPrompt?: string;
  suggestions?: string[];
  title?: string;
  description?: string;
}

export function ResponsiveGroqChat({
  initialPrompt = "Você é um assistente agrícola especializado em produção rural.",
  suggestions = [
    "Como posso aumentar a produtividade da soja?",
    "Qual a melhor época para plantar milho?",
    "Como controlar pragas na lavoura?",
    "Quais fatores afetam o preço da soja?",
  ],
  title = "Assistente Agrícola",
  description,
}: ResponsiveGroqChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Configuração do useChat
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    setMessages,
    setInput,
  } = useChat({
    api: "/api/chat-groq",
    initialMessages: initialPrompt
      ? [{ id: "system-1", role: "system", content: initialPrompt }]
      : undefined,
    onError: (error) => {
      console.error("Erro no chat:", error);
    },
  });

  // Função para limpar o chat
  const handleClearChat = () => {
    setMessages([]);
  };

  // Função para copiar mensagem
  const handleCopyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Função para usar uma sugestão
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Rolar para a mensagem mais recente
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Detectar quando o usuário rolou para cima
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      const isScrolledUp =
        target.scrollTop < target.scrollHeight - target.clientHeight - 100;
      setShowScrollButton(isScrolledUp && messages.length > 2);
    };

    const scrollArea = document.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollArea) {
      scrollArea.addEventListener("scroll", handleScroll);
      return () => scrollArea.removeEventListener("scroll", handleScroll);
    }
  }, [messages.length]);

  // Filtrar mensagens do sistema
  const visibleMessages = messages.filter(
    (message) => message.role !== "system"
  );

  return (
    <Card 
      className="shadow-sm border-muted/80 flex flex-col" 
      style={{ height: isMobile ? "calc(100vh - 200px)" : "700px" }}
    >
      <CardHeaderPrimary
        icon={<MessageCircle className="h-5 w-5 text-white" />}
        title={title}
        description={description}
        action={
          <div className="flex items-center gap-2">
            <Badge
              variant={isLoading ? "secondary" : "outline"}
              className={cn(
                "text-xs transition-colors bg-white/20 text-white border-white/30",
                isLoading && "animate-pulse"
              )}
            >
              {isLoading ? "Processando..." : "Pronto"}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearChat}
                    disabled={messages.length === 0 || isLoading}
                    className="text-white hover:bg-white/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Limpar conversa</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        }
      />

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 pt-6 space-y-4 min-h-0">
            {visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <div className="bg-primary/5 p-4 rounded-full mb-4">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  Bem-vindo ao Suporte SR-Consultoria
                </h3>
                <p className="text-secondary-foreground max-w-md mb-8">
                  Estou aqui para responder suas dúvidas sobre o sistema.
                </p>

                {suggestions.length > 0 && (
                  <div className="w-full max-w-md">
                    <h4 className="text-sm font-medium mb-3">
                      Experimente perguntar:
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="justify-start text-left h-auto py-3 px-4 whitespace-normal"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              visibleMessages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 group w-full",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isUser && (
                      <Avatar className="h-8 w-8 mt-1 bg-primary/10 flex-shrink-0">
                        <AvatarImage src="/ai-assistant-icon.png" alt="AI" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "flex flex-col min-w-0 max-w-[calc(100%-3rem)]",
                        isUser ? "items-end ml-auto" : "items-start mr-auto"
                      )}
                    >
                      <div className="flex items-center mb-1 text-xs text-secondary-foreground">
                        <span>{isUser ? "Você" : "Assistente"}</span>
                      </div>
                      <div className="group relative w-full">
                        <div
                          className={cn(
                            "p-3 rounded-lg break-words overflow-hidden hyphens-auto",
                            "whitespace-pre-wrap [word-break:break-word] [overflow-wrap:anywhere]",
                            isUser
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-muted rounded-tl-none"
                          )}
                          style={{ 
                            maxWidth: "100%",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere"
                          }}
                        >
                          {message.content || "Carregando..."}
                        </div>
                        <div
                          className={cn(
                            "opacity-0 group-hover:opacity-100 transition-opacity absolute top-1",
                            isUser ? "-left-8" : "-right-8"
                          )}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    handleCopyMessage(
                                      message.content || "",
                                      message.id
                                    )
                                  }
                                >
                                  {copied === message.id ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side={isUser ? "left" : "right"}>
                                <p>
                                  {copied === message.id
                                    ? "Copiado!"
                                    : "Copiar mensagem"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                    {isUser && (
                      <Avatar className="h-8 w-8 mt-1 bg-primary flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
            {isLoading && visibleMessages.length > 0 && (
              <div className="flex gap-3 w-full">
                <Avatar className="h-8 w-8 mt-1 bg-primary/10 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 max-w-[calc(100%-3rem)]">
                  <div className="flex items-center mb-1 text-xs text-secondary-foreground">
                    <span>Assistente</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted rounded-tl-none flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"></div>
                    </div>
                    <span className="text-xs text-secondary-foreground">
                      Digitando...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {showScrollButton && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-md"
            onClick={() =>
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardContent>

      <CardFooter className="p-3 border-t bg-card shrink-0">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            className="flex-1 bg-background"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
