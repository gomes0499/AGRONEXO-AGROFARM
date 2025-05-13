import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPropertyById } from "@/lib/actions/property-actions";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Obter dados da propriedade
    const property = await getPropertyById(context.params.id);

    // Verificar se a propriedade pertence à organização do usuário
    if (property.organizacao_id !== session.organizationId) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error("Erro ao buscar propriedade:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Erro ao buscar propriedade",
        message: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}