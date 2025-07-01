"use client";

import { useState, useEffect } from "react";
import { UserRole } from "@/lib/auth/roles";

export function useUserRole(organizationId?: string) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/role?organizationId=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Erro ao buscar função do usuário:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [organizationId]);

  return { userRole, isLoading };
}