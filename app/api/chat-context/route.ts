import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"

export async function POST(req: Request) {
  try {
    // Extrair as mensagens e dados contextuais do corpo da requisição
    const { messages, context } = await req.json()

    // Log para debug
    console.log("Contexto recebido:", context)

    // Criar um prompt de sistema que inclui o contexto
    const systemPrompt = `
      Você é um assistente agrícola especializado em produção rural, culturas, clima e mercado agrícola.
      
      CONTEXTO ATUAL:
      ${JSON.stringify(context)}
      
      Use os dados do contexto acima para fornecer insights relevantes e personalizados.
      Quando mencionar dados específicos do contexto, cite-os diretamente.
      Se o usuário perguntar sobre dados que não estão no contexto, informe que você não tem essa informação específica.
      
      Ao analisar dados de produção agrícola, considere:
      - Área total de plantio e sua variação
      - Distribuição de culturas e sistemas de plantio
      - Custos totais e por categoria
      - Dados de rebanho, quando disponíveis
      
      Seja preciso com números e unidades. Use hectares (ha) para áreas e R$ para valores monetários.
    `

    // Chamar o modelo Groq
    const result = await streamText({
      model: groq("llama3-8b-8192"),
      messages,
      system: systemPrompt,
    })

    // Responder com o stream
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Erro na API de chat contextual:", error)
    return new Response(
      JSON.stringify({
        error: "Erro ao processar a solicitação",
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
