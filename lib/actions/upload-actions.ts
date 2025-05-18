"use server";

import { revalidatePath } from "next/cache";
import { getStorageServerClient } from "@/lib/supabase/storage";
import { createClient } from "@/lib/supabase/server";

/**
 * Processa upload de imagem da organização (server-side)
 */
export async function uploadOrganizationLogo(
  organizationId: string,
  formData: FormData
) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "Arquivo não fornecido" };
    }

    // Obtém extensão do arquivo
    const fileExt = file.name.split(".").pop();
    
    // Cria nome único para o arquivo (organizationId + timestamp + extensão)
    const fileName = `logo_${organizationId}_${Date.now()}.${fileExt}`;
    const filePath = `organizations/${organizationId}/${fileName}`;

    // Converte o arquivo para um Buffer (necessário para upload no servidor)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Obter o cliente de storage do Supabase (server-side)
    const storage = await getStorageServerClient();
    
    // Fazer upload do arquivo
    const { data, error } = await storage.upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (error) {
      console.error("Erro ao fazer upload:", error.message);
      return { success: false, error: error.message };
    }

    // Obter URL pública do arquivo
    const { data: { publicUrl } } = storage.getPublicUrl(filePath);

    // Atualizar o campo logo da organização no banco de dados
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("organizacoes")
      .update({ logo: publicUrl })
      .eq("id", organizationId);

    if (updateError) {
      console.error("Erro ao atualizar logo:", updateError.message);
      // Não retorna erro aqui, pois o upload foi bem-sucedido
    }

    // Revalidar o caminho para que a UI seja atualizada
    revalidatePath(`/dashboard/organization/${organizationId}`);
    
    return { 
      success: true, 
      data: {
        path: filePath,
        publicUrl,
      } 
    };
  } catch (error: any) {
    console.error("Erro ao processar upload:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Remove imagem da organização (server-side)
 */
export async function removeOrganizationLogo(
  organizationId: string,
  filePath: string
) {
  try {
    // Obter o cliente de storage do Supabase (server-side)
    const storage = await getStorageServerClient();
    
    // Remover o arquivo
    const { error } = await storage.remove([filePath]);

    if (error) {
      console.error("Erro ao remover arquivo:", error.message);
      return { success: false, error: error.message };
    }

    // Atualizar o campo logo da organização no banco de dados
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("organizacoes")
      .update({ logo: null })
      .eq("id", organizationId);

    if (updateError) {
      console.error("Erro ao atualizar logo:", updateError.message);
      // Não retorna erro aqui, pois a remoção foi bem-sucedida
    }

    // Revalidar o caminho para que a UI seja atualizada
    revalidatePath(`/dashboard/organization/${organizationId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao remover logo:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Processa upload de avatar do usuário (server-side)
 */
export async function uploadUserAvatar(
  userId: string,
  formData: FormData
) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "Arquivo não fornecido" };
    }

    // Obtém extensão do arquivo
    const fileExt = file.name.split(".").pop();
    
    // Cria nome único para o arquivo (userId + timestamp + extensão)
    const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `users/${userId}/${fileName}`;

    // Converte o arquivo para um Buffer (necessário para upload no servidor)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Obter o cliente de storage do Supabase (server-side)
    const storage = await getStorageServerClient();
    
    // Fazer upload do arquivo
    const { data, error } = await storage.upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (error) {
      console.error("Erro ao fazer upload:", error.message);
      return { success: false, error: error.message };
    }

    // Obter URL pública do arquivo
    const { data: { publicUrl } } = storage.getPublicUrl(filePath);

    // Atualizar o campo avatar nos metadados do usuário
    const supabase = await createClient();
    const { error: functionError } = await supabase.rpc(
      'update_user_avatar', 
      { 
        user_id: userId, 
        avatar_url: publicUrl 
      }
    );

    if (functionError) {
      console.error("Erro ao atualizar avatar:", functionError.message);
      // Não retorna erro aqui, pois o upload foi bem-sucedido
    }

    // Revalidar o caminho para que a UI seja atualizada
    revalidatePath(`/dashboard/profile`);
    
    return { 
      success: true, 
      data: {
        path: filePath,
        publicUrl,
      } 
    };
  } catch (error: any) {
    console.error("Erro ao processar upload de avatar:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Remove avatar do usuário (server-side)
 */
export async function removeUserAvatar(
  userId: string,
  filePath: string
) {
  try {
    // Obter o cliente de storage do Supabase (server-side)
    const storage = await getStorageServerClient();
    
    // Remover o arquivo
    const { error } = await storage.remove([filePath]);

    if (error) {
      console.error("Erro ao remover arquivo:", error.message);
      return { success: false, error: error.message };
    }

    // Remover o campo avatar dos metadados do usuário
    const supabase = await createClient();
    const { error: functionError } = await supabase.rpc(
      'remove_user_avatar', 
      { user_id: userId }
    );

    if (functionError) {
      console.error("Erro ao remover avatar dos metadados:", functionError.message);
      // Não retorna erro aqui, pois a remoção do arquivo foi bem-sucedida
    }

    // Revalidar o caminho para que a UI seja atualizada
    revalidatePath(`/dashboard/profile`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao remover avatar:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Processa upload de imagem da propriedade (server-side)
 */
export async function uploadPropertyImage(
  propertyId: string,
  formData: FormData
) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "Arquivo não fornecido" };
    }

    // Obtém extensão do arquivo e garante que seja válida
    let fileExt = file.name.split(".").pop();
    
    // Se a extensão não for encontrada ou for inválida, determina pelo tipo MIME
    if (!fileExt || fileExt.length > 10) {
      // Mapeia tipos MIME comuns para extensões
      const mimeToExt = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
      };
      fileExt = mimeToExt[file.type as keyof typeof mimeToExt] || 'jpg';
    }
    
    // Cria nome único para o arquivo (propertyId + timestamp + extensão)
    const fileName = `property_${propertyId}_${Date.now()}.${fileExt}`;
    const filePath = `properties/${propertyId}/${fileName}`;

    // Converte o arquivo para um Buffer (necessário para upload no servidor)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Obter o cliente de storage do Supabase (server-side)
    const storage = await getStorageServerClient();
    
    // Fazer upload do arquivo
    const { data, error } = await storage.upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (error) {
      console.error("Erro ao fazer upload:", error.message);
      return { success: false, error: error.message };
    }

    // Obter URL pública do arquivo
    const { data: { publicUrl } } = storage.getPublicUrl(filePath);
    
    // Remove qualquer parâmetro de token da URL para garantir que seja uma URL pública estável
    const cleanUrl = publicUrl.split('?')[0];
    console.log("URL original:", publicUrl);
    console.log("URL limpa:", cleanUrl);

    // Atualizar o campo imagem da propriedade no banco de dados
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("propriedades")
      .update({ imagem: cleanUrl })
      .eq("id", propertyId);

    if (updateError) {
      console.error("Erro ao atualizar imagem da propriedade:", updateError.message);
      // Não retorna erro aqui, pois o upload foi bem-sucedido
    }

    // Revalidar o caminho para que a UI seja atualizada
    revalidatePath(`/dashboard/properties/${propertyId}`);
    
    return { 
      success: true, 
      data: {
        path: filePath,
        publicUrl,
      } 
    };
  } catch (error: any) {
    console.error("Erro ao processar upload de imagem da propriedade:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Remove imagem da propriedade (server-side)
 */
export async function removePropertyImage(
  propertyId: string,
  filePath: string
) {
  try {
    // Obter o cliente de storage do Supabase (server-side)
    const storage = await getStorageServerClient();
    
    // Remover o arquivo
    const { error } = await storage.remove([filePath]);

    if (error) {
      console.error("Erro ao remover arquivo:", error.message);
      return { success: false, error: error.message };
    }

    // Atualizar o campo imagem da propriedade no banco de dados
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("propriedades")
      .update({ imagem: null })
      .eq("id", propertyId);

    if (updateError) {
      console.error("Erro ao atualizar imagem da propriedade:", updateError.message);
      // Não retorna erro aqui, pois a remoção foi bem-sucedida
    }

    // Revalidar o caminho para que a UI seja atualizada
    revalidatePath(`/dashboard/properties/${propertyId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao remover imagem da propriedade:", error.message);
    return { success: false, error: error.message };
  }
}