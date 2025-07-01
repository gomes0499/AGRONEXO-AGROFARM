"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface Organization {
  id: string;
  nome: string;
  slug: string;
  logo?: string | null;
}

export interface UserOrganizationsData {
  organizations: Organization[];
  isSuperAdmin: boolean;
  currentOrganization?: Organization | null;
}

export async function getUserOrganizations(): Promise<UserOrganizationsData> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return {
      organizations: [],
      isSuperAdmin: false,
      currentOrganization: null,
    };
  }

  // Check if user is super admin
  const isSuperAdmin = user.app_metadata?.is_super_admin === true;
  
  let organizations: Organization[] = [];
  
  try {
    if (isSuperAdmin) {
      // If super admin, fetch all organizations
      const { data, error } = await supabase
        .from("organizacoes")
        .select("id, nome, slug, logo")
        .order("nome");

      if (error) throw error;
      organizations = data || [];
    } else {
      // For normal users, fetch only associated organizations
      const { data, error } = await supabase
        .from("associacoes")
        .select("*, organizacao:organizacao_id(id, nome, slug, logo)")
        .eq("usuario_id", user.id);

      if (error) throw error;

      // Extract and format organizations
      organizations = data?.map((assoc) => assoc.organizacao as Organization) || [];
    }

    // Get current organization from user metadata
    const currentOrganization = user.user_metadata?.organizacao || null;
    
    // Validate current organization exists in user's organizations
    let validatedCurrentOrg = null;
    if (currentOrganization && organizations.length > 0) {
      const orgExists = organizations.find((org) => org.id === currentOrganization.id);
      if (orgExists) {
        validatedCurrentOrg = orgExists;
      } else if (organizations[0]) {
        // If current org doesn't exist, use first available
        validatedCurrentOrg = organizations[0];
      }
    } else if (organizations[0]) {
      // If no current org set, use first available
      validatedCurrentOrg = organizations[0];
    }

    return {
      organizations,
      isSuperAdmin,
      currentOrganization: validatedCurrentOrg,
    };
  } catch (error) {
    console.error("Error loading user organizations:", error);
    return {
      organizations: [],
      isSuperAdmin,
      currentOrganization: null,
    };
  }
}

export async function switchOrganization(organizationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from("organizacoes")
      .select("id, nome, slug, logo")
      .eq("id", organizationId)
      .single();

    if (orgError || !organization) {
      return { success: false, error: "Organization not found" };
    }

    // Check if user has access to this organization (unless super admin)
    const isSuperAdmin = user.app_metadata?.is_super_admin === true;
    
    if (!isSuperAdmin) {
      const { data: association, error: assocError } = await supabase
        .from("associacoes")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("organizacao_id", organizationId)
        .single();

      if (assocError || !association) {
        return { success: false, error: "Access denied to this organization" };
      }
    }

    // Update user metadata with new organization
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        organizacao: {
          id: organization.id,
          nome: organization.nome,
          slug: organization.slug,
        },
      },
    });

    if (updateError) {
      return { success: false, error: "Failed to update user organization" };
    }

    // Update last login for this organization
    await supabase
      .from("associacoes")
      .update({ ultimo_login: new Date().toISOString() })
      .eq("usuario_id", user.id)
      .eq("organizacao_id", organizationId);

    return { success: true };
  } catch (error) {
    console.error("Error switching organization:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}