"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextualAssistantProps {
  pageContext: any; // Dados da página que serão passados como contexto
  title?: string;
  subtitle?: string;
  height?: string;
  initialSuggestions?: string[];
}

export function ContextualAssistant({
  pageContext,
  title = "Assistente Contextual",
  subtitle = "Powered by Groq",
  height = "500px",
  initialSuggestions = [],
}: ContextualAssistantProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions);

  // Configuração do useChat
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
  } = useChat({
    api: "/api/chat-context",
    body: {
      context: pageContext, // Passando o contexto da página para a API
    },
    onError: (error) => {
      console.error("Erro no chat:", error);
    },
    onFinish: () => {
      // Gerar novas sugestões baseadas no contexto se não houver sugestões iniciais
      if (initialSuggestions.length === 0 && messages.length === 0) {
        generateContextualSuggestions();
      }
    },
  });

  // Função para gerar sugestões contextuais
  const generateContextualSuggestions = async () => {
    try {
      const response = await fetch("/api/generate-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ context: pageContext }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Erro ao gerar sugestões:", error);
    }
  };

  // Função para usar uma sugestão
  const handleSuggestionClick = (suggestion: string) => {
    const form = document.querySelector("form") as HTMLFormElement;
    const input = form.querySelector("input") as HTMLInputElement;
    input.value = suggestion;

    // Disparar o evento de mudança para atualizar o estado
    const event = new Event("input", { bubbles: true });
    input.dispatchEvent(event);
  };

  // Rolar para a mensagem mais recente
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Gerar sugestões iniciais baseadas no contexto
  useEffect(() => {
    if (initialSuggestions.length === 0 && messages.length === 0) {
      generateContextualSuggestions();
    }
  }, [pageContext, initialSuggestions.length, messages.length]);

  return (
    <Card
      className={`w-full flex flex-col shadow-lg border-primary/10`}
      style={{ height }}
    >
      <CardHeader className="px-4 py-3 flex flex-row items-center justify-between border-b bg-card shrink-0">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2 bg-primary/10">
            <AvatarImage src="/ai-assistant-icon.png" alt="AI" />
            <AvatarFallback className="bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-medium flex items-center">
              {title}
              <Badge variant="outline" className="ml-2 text-xs font-normal">
                <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                {subtitle}
              </Badge>
            </CardTitle>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isLoading ? "secondary" : "outline"}
            className={cn(
              "text-xs transition-colors",
              isLoading && "animate-pulse"
            )}
          >
            {isLoading ? "Processando..." : "Pronto"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <div className="bg-primary/5 p-4 rounded-full mb-4">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  Assistente Contextual
                </h3>
                <p className="text-secondary-foreground max-w-md mb-8">
                  Posso ajudar com insights baseados nos dados desta página.
                  Pergunte-me algo!
                </p>

                {suggestions.length > 0 && (
                  <div className="w-full max-w-md">
                    <h4 className="text-sm font-medium mb-3">
                      Sugestões baseadas no contexto:
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
              messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 group",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isUser && (
                      <Avatar className="h-8 w-8 mt-1 bg-primary/10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "flex flex-col max-w-[75%]",
                        isUser && "items-end"
                      )}
                    >
                      <div className="flex items-center mb-1 text-xs text-secondary-foreground">
                        <span>{isUser ? "Você" : "Assistente"}</span>
                      </div>
                      <div
                        className={cn(
                          "p-3 rounded-lg whitespace-pre-wrap break-words",
                          isUser
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted rounded-tl-none"
                        )}
                      >
                        {message.content || "Carregando..."}
                      </div>
                    </div>
                    {isUser && (
                      <Avatar className="h-8 w-8 mt-1 bg-primary flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          U
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
            {isLoading && messages.length > 0 && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 mt-1 bg-primary/10 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col max-w-[75%]">
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
                      Analisando dados...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 border-t bg-card shrink-0">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Pergunte sobre os dados desta página..."
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
