import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return new Response(JSON.stringify({ error: "Sessão não encontrada" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Retorna apenas os dados necessários para evitar expor informações sensíveis
    return NextResponse.json({
      userId: session.userId,
      organizationId: session.organizationId,
      role: session.role,
      isOwner: session.isOwner,
    });
  } catch (error) {
    console.error("Erro ao obter sessão:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Erro ao obter sessão",
        message: "Ocorreu um erro interno. Por favor, tente novamente." 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}