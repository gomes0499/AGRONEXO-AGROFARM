"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";

export async function getMaquinasEquipamentos(organizationId: string) {
  await verifyUserPermission();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('maquinas_equipamentos')
    .select('*')
    .eq('organizacao_id', organizationId)
    .order('equipamento', { ascending: true });
  
  if (error) {
    console.error("Erro ao buscar máquinas e equipamentos:", error);
    throw new Error("Falha ao buscar máquinas e equipamentos");
  }
  
  return data || [];
}

export async function getBenfeitorias(organizationId: string) {
  await verifyUserPermission();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('benfeitorias')
    .select('*, propriedades(nome)')
    .eq('organizacao_id', organizationId)
    .order('nome', { ascending: true });
  
  if (error) {
    console.error("Erro ao buscar benfeitorias:", error);
    throw new Error("Falha ao buscar benfeitorias");
  }
  
  // Mapear propriedade_nome
  return (data || []).map(b => ({
    ...b,
    propriedade_nome: b.propriedades?.nome || "N/A"
  }));
}

export async function getInvestimentos(organizationId: string) {
  await verifyUserPermission();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('investimentos')
    .select('*')
    .eq('organizacao_id', organizationId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar investimentos:", error);
    throw new Error("Falha ao buscar investimentos");
  }
  
  return data || [];
}

export async function getRebanhos(organizationId: string) {
  await verifyUserPermission();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('rebanhos')
    .select('*, propriedades(nome)')
    .eq('organizacao_id', organizationId)
    .order('categoria', { ascending: true });
  
  if (error) {
    console.error("Erro ao buscar rebanhos:", error);
    throw new Error("Falha ao buscar rebanhos");
  }
  
  // Mapear propriedade_nome
  return (data || []).map(r => ({
    ...r,
    propriedade_nome: r.propriedades?.nome || "Todas"
  }));
}

export async function getAssociacoes(organizationId: string) {
  await verifyUserPermission();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('associacoes')
    .select('*')
    .eq('organizacao_id', organizationId)
    .order('nome', { ascending: true });
  
  if (error) {
    console.error("Erro ao buscar associações:", error);
    throw new Error("Falha ao buscar associações");
  }
  
  return data || [];
}

export async function getAquisicaoTerras(organizationId: string) {
  await verifyUserPermission();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('aquisicao_terras')
    .select('*, propriedades(nome)')
    .eq('organizacao_id', organizationId)
    .order('data_aquisicao', { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar aquisições de terras:", error);
    throw new Error("Falha ao buscar aquisições de terras");
  }
  
  return data || [];
}

export async function getArrendamentos(organizationId: string) {
  await verifyUserPermission();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('arrendamentos')
    .select('*, propriedades(nome)')
    .eq('organizacao_id', organizationId)
    .order('nome', { ascending: true });
  
  if (error) {
    console.error("Erro ao buscar arrendamentos:", error);
    throw new Error("Falha ao buscar arrendamentos");
  }
  
  return data || [];
}

export async function getPrecos(organizationId: string) {
  await verifyUserPermission();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('precos')
    .select('*, culturas(nome), safras(nome)')
    .eq('organizacao_id', organizationId)
    .order('safra_id', { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar preços:", error);
    throw new Error("Falha ao buscar preços");
  }
  
  return data || [];
}

export async function getCotacoesCambio(organizationId: string) {
  await verifyUserPermission();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cotacoes_cambio')
    .select('*')
    .eq('organizacao_id', organizationId)
    .order('moeda', { ascending: true });
  
  if (error) {
    console.error("Erro ao buscar cotações de câmbio:", error);
    throw new Error("Falha ao buscar cotações de câmbio");
  }
  
  return data || [];
}

export async function getAdiantamentos(organizationId: string) {
  await verifyUserPermission();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('adiantamentos')
    .select('*, safras(nome)')
    .eq('organizacao_id', organizationId)
    .order('safra_id', { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar adiantamentos:", error);
    throw new Error("Falha ao buscar adiantamentos");
  }
  
  return data || [];
}