import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: "ID da organização não fornecido" }, { status: 400 });
    }

    // Buscar a associação do usuário com a organização
    const { data: association, error } = await supabase
      .from("associacoes")
      .select("funcao, eh_proprietario")
      .eq("usuario_id", user.id)
      .eq("organizacao_id", organizationId)
      .single();

    if (error || !association) {
      return NextResponse.json({ error: "Associação não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ 
      role: association.funcao,
      isOwner: association.eh_proprietario 
    });
  } catch (error) {
    console.error("Erro ao buscar função do usuário:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}