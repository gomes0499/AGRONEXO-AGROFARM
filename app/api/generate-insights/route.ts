import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { data } = await req.json()

    // Criar um prompt para gerar insights baseados nos dados
    const prompt = `
      Analise os seguintes dados de um dashboard de produção agrícola e gere 3-5 insights relevantes:
      
      ${JSON.stringify(data)}
      
      Para cada insight, determine se é positivo, negativo, neutro ou um alerta.
      Retorne os insights em formato JSON como um array de objetos, cada um com as propriedades "text" e "type".
      Os tipos possíveis são: "positive", "negative", "neutral", "warning".
      
      Exemplo de formato esperado:
      [
        {"text": "A produtividade aumentou 15% em relação à safra anterior", "type": "positive"},
        {"text": "Os custos de produção estão acima da média do setor", "type": "negative"},
        {"text": "A previsão climática indica possibilidade de seca nos próximos meses", "type": "warning"}
      ]
      
      Seja específico e use números quando disponíveis. Foque em tendências, anomalias e oportunidades.
    `

    const { text } = await generateText({
      model: groq("llama3-8b-8192"),
      prompt,
    })

    // Extrair os insights do texto gerado
    let insights = []
    try {
      // Tentar extrair um array JSON do texto
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        insights = JSON.parse(match[0])
      }
    } catch (error) {
      console.error("Erro ao processar insights:", error)
      insights = [
        { text: "Dados analisados com sucesso", type: "neutral" },
        { text: "Recomendamos revisar os indicadores de produtividade", type: "warning" },
      ]
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Erro ao gerar insights:", error)
    return new Response(
      JSON.stringify({
        insights: [
          { text: "Não foi possível analisar os dados completamente", type: "warning" },
          { text: "Recomendamos verificar a qualidade dos dados", type: "neutral" },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
