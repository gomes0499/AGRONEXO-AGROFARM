import { ResponsiveGroqChat } from "@/components/chat/responsive-groq-chat";
import { SiteHeader } from "@/components/dashboard/site-header";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";

export default async function ResponsiveChatPage() {
  // Verificar se o usuário está autenticado
  await verifyUserPermission();
  
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Suporte" />
      <div className="container mx-auto py-8 px-4">
        <ResponsiveGroqChat
          initialPrompt="Você é um assistente agrícola especializado em produção rural, culturas, clima e mercado agrícola. Forneça respostas precisas e úteis sobre agricultura, pecuária e gestão rural."
          suggestions={[
            "Como posso aumentar a produtividade da soja?",
            "Qual a melhor época para plantar milho?",
            "Como controlar pragas na lavoura?",
            "Quais fatores afetam o preço da soja?",
          ]}
          title="Chat AGROFARM"
          description="Converse com nosso assistente e tire suas dúvidas sobre o sistema"
        />
      </div>
    </div>
  );
}
