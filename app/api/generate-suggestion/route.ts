import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { context } = await req.json()

    // Criar um prompt para gerar sugestões baseadas no contexto
    const prompt = `
      Com base nos seguintes dados de contexto de um dashboard de produção agrícola:
      
      ${JSON.stringify(context)}
      
      Gere 4-5 perguntas relevantes que um usuário poderia fazer sobre esses dados.
      As perguntas devem ser específicas ao contexto e ajudar o usuário a obter insights valiosos.
      Foque em áreas de plantio, culturas, custos e rebanho.
      Retorne apenas as perguntas em formato de array JSON, sem explicações adicionais.
      Exemplo de formato esperado: ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"]
    `

    const { text } = await generateText({
      model: groq("llama3-8b-8192"),
      prompt,
    })

    // Extrair as sugestões do texto gerado
    let suggestions = []
    try {
      // Tentar extrair um array JSON do texto
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        suggestions = JSON.parse(match[0])
      } else {
        // Fallback: dividir por linhas e limpar
        suggestions = text
          .split("\n")
          .filter((line) => line.trim().endsWith("?"))
          .map((line) => line.trim())
          .slice(0, 5)
      }
    } catch (error) {
      console.error("Erro ao processar sugestões:", error)
      suggestions = [
        "Qual é a área total de plantio?",
        "Como estão distribuídos os custos de produção?",
        "Qual cultura ocupa a maior área?",
        "Qual é o custo médio por hectare?",
      ]
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Erro ao gerar sugestões:", error)
    return new Response(
      JSON.stringify({
        suggestions: [
          "Qual é a área total de plantio?",
          "Como estão distribuídos os custos de produção?",
          "Qual cultura ocupa a maior área?",
          "Qual é o custo médio por hectare?",
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
