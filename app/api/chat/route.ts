import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"

// Aumentar o tempo máximo de resposta para 30 segundos
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Extrair as mensagens do corpo da requisição
    const { messages } = await req.json()


    // Chamar o modelo Groq
    const result = await streamText({
      model: groq("llama3-8b-8192"),
      messages,
      // Prompt de sistema para personalizar o comportamento do assistente
      system:
        "Você é um assistente agrícola especializado em produção rural, culturas, clima e mercado agrícola. Forneça respostas precisas e úteis sobre agricultura, pecuária e gestão rural.",
    })

    // Responder com o stream
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Erro na API de chat (Groq):", error)
    return new Response(JSON.stringify({ error: "Erro ao processar a solicitação", message: "Ocorreu um erro interno. Por favor, tente novamente." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
