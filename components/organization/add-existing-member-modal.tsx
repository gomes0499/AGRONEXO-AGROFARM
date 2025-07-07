"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { getAvailableUsers, addExistingMember, type AvailableUser } from "@/lib/actions/add-existing-member-actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddExistingMemberModalProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddExistingMemberModal({
  organizationId,
  isOpen,
  onClose,
  onSuccess,
}: AddExistingMemberModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AvailableUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AvailableUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<"ADMINISTRADOR" | "MEMBRO">("MEMBRO");

  // Carregar usuários disponíveis
  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen, organizationId]);

  // Filtrar usuários com base na busca
  useEffect(() => {
    if (searchTerm) {
      const filtered = availableUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(availableUsers);
    }
  }, [searchTerm, availableUsers]);

  const loadAvailableUsers = async () => {
    try {
      setIsSearching(true);
      const result = await getAvailableUsers(organizationId);
      
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setAvailableUsers(result.data || []);
      setFilteredUsers(result.data || []);
    } catch (error) {
      toast.error("Erro ao buscar usuários disponíveis");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) {
      toast.error("Selecione um usuário");
      return;
    }

    try {
      setIsLoading(true);
      const result = await addExistingMember({
        userId: selectedUser.id,
        organizationId,
        role: selectedRole,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(`${selectedUser.nome} foi adicionado à organização!`);
      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error("Erro ao adicionar membro");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setSelectedUser(null);
    setSelectedRole("MEMBRO");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Membro Existente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              disabled={isSearching}
            />
          </div>

          {/* Lista de usuários */}
          <div className="space-y-2">
            <Label>Selecione um usuário</Label>
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-1">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Carregando usuários...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {searchTerm ? "Nenhum usuário encontrado" : "Não há usuários disponíveis"}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full p-3 text-left rounded-md hover:bg-accent transition-colors ${
                      selectedUser?.id === user.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="font-medium">{user.nome}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    {user.telefone && (
                      <div className="text-sm text-muted-foreground">{user.telefone}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Seleção de função */}
          {selectedUser && (
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                  <SelectItem value="MEMBRO">Membro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleAddMember} disabled={isLoading || !selectedUser}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adicionando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}