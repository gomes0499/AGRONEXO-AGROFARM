// Aumentar o tempo máximo de resposta para 30 segundos
export const maxDuration = 30

// Função para chamar o Ollama API
interface Message {
  role: string
  content: string
}

async function callOllama(messages: Message[]) {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3", // ou outro modelo disponível no Ollama
      messages: messages,
      stream: true,
    }),
  })

  return response
}

export async function POST(req: Request) {
  try {
    // Extrair as mensagens do corpo da requisição
    const { messages } = await req.json()

    // Chamar o Ollama
    const ollamaResponse = await callOllama(messages)

    // Verificar se a resposta foi bem-sucedida
    if (!ollamaResponse.ok) {
      throw new Error(`Erro na API do Ollama: ${ollamaResponse.status}`)
    }

    // Retornar o stream diretamente
    return new Response(ollamaResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Erro na API de chat (Ollama):", error)
    return new Response(JSON.stringify({ error: "Erro ao processar a solicitação", details: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
