import { ResponsiveGroqChat } from "@/components/chat/responsive-groq-chat";

export default function ResponsiveChatPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Chat SR-Consultoria</h1>
      <p className="text-secondary-foreground mb-6">
        Converse com nosso assistente especializado em agricultura e pecuária.
      </p>

      <ResponsiveGroqChat
        initialPrompt="Você é um assistente agrícola especializado em produção rural, culturas, clima e mercado agrícola. Forneça respostas precisas e úteis sobre agricultura, pecuária e gestão rural."
        suggestions={[
          "Como posso aumentar a produtividade da soja?",
          "Qual a melhor época para plantar milho?",
          "Como controlar pragas na lavoura?",
          "Quais fatores afetam o preço da soja?",
        ]}
        title="Assistente Agrícola"
      />
    </div>
  );
}
