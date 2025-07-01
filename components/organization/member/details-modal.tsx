"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/lib/auth/roles";
import { formatCPF, formatRG, formatPhone } from "@/lib/utils/formatters";
import {
  MailIcon,
  User,
  Phone,
  MapPin,
  FileText,
  Calendar,
  CreditCard,
  Clock,
  X,
  Shield,
  UserCheck,
  Home,
  Heart,
  Building,
  Activity,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTriggerPrimary } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getMemberDetails } from "@/lib/actions/organization-actions";
import { toast } from "sonner";

// Define o tipo para o objeto de associação com usuário aninhado
interface MemberAssociation {
  id: string;
  organizacao_id: string;
  usuario_id: string;
  funcao: string;
  eh_proprietario: boolean;
  data_adicao?: string;
  ultimo_login?: string;
  created_at?: string;
  user?: {
    id: string;
    email: string;
    nome?: string;
    telefone?: string;
    imagem?: string;
    metadados?: any;
  };
}

interface MemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId?: string;
  organizationId: string;
  organizationName?: string;
}

export function MemberDetailsModal({
  isOpen,
  onClose,
  memberId,
  organizationId,
  organizationName,
}: MemberDetailsModalProps) {
  const [member, setMember] = useState<MemberAssociation | null>(null);
  const [loading, setLoading] = useState(false);

  // Buscar dados do membro quando o modal abrir
  useEffect(() => {
    if (isOpen && memberId) {
      fetchMemberData();
    }
  }, [isOpen, memberId]);

  const fetchMemberData = async () => {
    if (!memberId) return;

    setLoading(true);
    try {
      const result = await getMemberDetails(memberId, organizationId);

      if (result.success && result.data) {
        setMember(result.data);
      } else {
        toast.error(result.error || "Erro ao carregar dados do membro");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do membro:", error);
      toast.error("Erro interno. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Formatação de data
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não informado";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch (e) {
      return dateString;
    }
  };

  // Obtém o papel/função formatado
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case UserRole.PROPRIETARIO:
        return "bg-yellow-500 hover:bg-yellow-600";
      case UserRole.ADMINISTRADOR:
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-green-500 hover:bg-green-600";
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case UserRole.PROPRIETARIO:
        return "Proprietário";
      case UserRole.ADMINISTRADOR:
        return "Administrador";
      case UserRole.MEMBRO:
        return "Membro";
      default:
        return role;
    }
  };

  // Iniciais para o avatar (fallback)
  const getInitials = (userData: any) => {
    const name = userData?.nome || userData?.email?.split("@")[0] || "U";
    return name
      .split(" ")
      .slice(0, 2)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
  };

  // Campo de informação reutilizável
  const InfoField = ({
    icon: Icon,
    label,
    value,
    className = "",
  }: {
    icon: any;
    label: string;
    value: string | undefined;
    className?: string;
  }) => (
    <div
      className={`group relative bg-card rounded-lg p-4 hover:bg-accent/50 transition-colors border ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md bg-background group-hover:bg-primary/10 transition-colors">
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm font-medium pl-8">{value || "Não informado"}</p>
    </div>
  );

  if (!member && !loading) {
    return null;
  }

  const userData = member?.user;
  const metadata = userData?.metadados || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95%] md:max-w-[90%] lg:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-card">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
            Informações do Membro
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary"></div>
              <p className="text-sm text-muted-foreground">
                Carregando informações...
              </p>
            </div>
          ) : member ? (
            <div className="p-6 space-y-6">
              {/* Header com informações básicas */}
              <div className="relative overflow-hidden bg-card rounded-xl p-6 border">
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20 ring-4 ring-background shadow-xl">
                        <AvatarImage
                          src={userData?.imagem || ""}
                          alt={userData?.nome || ""}
                        />
                        <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                          {getInitials(userData)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-1 -right-1 p-1.5 rounded-full ${getRoleBadgeColor(
                          member.funcao
                        )} shadow-lg`}
                      >
                        <Shield className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">
                        {userData?.nome ||
                          userData?.email?.split("@")[0] ||
                          "Usuário"}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                          <MailIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">
                            {userData?.email || "email@exemplo.com"}
                          </span>
                        </div>
                        {userData?.telefone && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground text-sm">
                                {formatPhone(userData.telefone)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant="default"
                      className="px-4 py-1.5 text-sm shadow-sm"
                    >
                      {getRoleDisplay(member.funcao)}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      <span>
                        {member.ultimo_login
                          ? `Ativo ${formatDate(member.ultimo_login)}`
                          : "Nunca acessou"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs com informações detalhadas */}
              <Tabs defaultValue="personal" className="w-full">
                <div className="border-b">
                  <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start mb-2">
                    <TabsTriggerPrimary value="personal">
                      Pessoais
                    </TabsTriggerPrimary>
                    <TabsTriggerPrimary value="contact">
                      Contato
                    </TabsTriggerPrimary>
                    <TabsTriggerPrimary value="documents">
                      Documentos
                    </TabsTriggerPrimary>
                  </TabsList>
                </div>

                {/* Dados Pessoais */}
                <TabsContent value="personal" className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary rounded-full" />
                      Informações Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InfoField
                        icon={User}
                        label="Nome Completo"
                        value={userData?.nome || metadata.name}
                      />
                      <InfoField
                        icon={Calendar}
                        label="Data de Nascimento"
                        value={formatDate(metadata.dataNascimento)}
                      />
                      <InfoField
                        icon={Building}
                        label="Naturalidade"
                        value={metadata.naturalidade}
                      />
                      <InfoField
                        icon={Heart}
                        label="Estado Civil"
                        value={metadata.estadoCivil}
                      />
                    </div>
                  </div>

                  {/* Dados do cônjuge se casado */}
                  {(metadata.estadoCivil === "CASADO" ||
                    metadata.estadoCivil === "UNIAO_ESTAVEL") && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        Dados do Cônjuge
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InfoField
                          icon={User}
                          label="Nome do Cônjuge"
                          value={metadata.nomeConjuge}
                        />
                        <InfoField
                          icon={Calendar}
                          label="Data de Nascimento"
                          value={formatDate(metadata.dataNascimentoConjuge)}
                        />
                        <InfoField
                          icon={CreditCard}
                          label="CPF do Cônjuge"
                          value={
                            metadata.cpfConjuge
                              ? formatCPF(metadata.cpfConjuge)
                              : undefined
                          }
                        />
                        <InfoField
                          icon={FileText}
                          label="RG do Cônjuge"
                          value={
                            metadata.rgConjuge
                              ? `${formatRG(metadata.rgConjuge)}${
                                  metadata.orgaoEmissorConjuge
                                    ? ` - ${metadata.orgaoEmissorConjuge}`
                                    : ""
                                }`
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary rounded-full" />
                      Informações da Conta
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InfoField
                        icon={Calendar}
                        label="Membro desde"
                        value={formatDate(
                          member.data_adicao || member.created_at
                        )}
                      />
                      <InfoField
                        icon={Clock}
                        label="Último acesso"
                        value={formatDate(member.ultimo_login)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Contato e Endereço */}
                <TabsContent value="contact" className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary rounded-full" />
                      Informações de Contato
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InfoField
                        icon={MailIcon}
                        label="Email"
                        value={userData?.email}
                      />
                      <InfoField
                        icon={Phone}
                        label="Telefone"
                        value={
                          userData?.telefone || metadata.telefone
                            ? formatPhone(
                                userData?.telefone || metadata.telefone
                              )
                            : undefined
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary rounded-full" />
                      Endereço
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InfoField
                        icon={MapPin}
                        label="CEP"
                        value={metadata.cep}
                      />
                      <InfoField
                        icon={MapPin}
                        label="Logradouro"
                        value={metadata.endereco}
                      />
                      <InfoField
                        icon={MapPin}
                        label="Número"
                        value={metadata.numero}
                      />
                      <InfoField
                        icon={MapPin}
                        label="Complemento"
                        value={metadata.complemento}
                      />
                      <InfoField
                        icon={MapPin}
                        label="Bairro"
                        value={metadata.bairro}
                      />
                      <InfoField
                        icon={MapPin}
                        label="Cidade/UF"
                        value={
                          metadata.cidade
                            ? `${metadata.cidade}${
                                metadata.estado ? `/${metadata.estado}` : ""
                              }`
                            : undefined
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Documentos */}
                <TabsContent value="documents" className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary rounded-full" />
                      Documentação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InfoField
                        icon={CreditCard}
                        label="CPF"
                        value={
                          metadata.cpf ? formatCPF(metadata.cpf) : undefined
                        }
                      />
                      <InfoField
                        icon={FileText}
                        label="RG"
                        value={
                          metadata.rg
                            ? `${formatRG(metadata.rg)}${
                                metadata.orgaoEmissor
                                  ? ` - ${metadata.orgaoEmissor}`
                                  : ""
                              }`
                            : undefined
                        }
                      />
                      <InfoField
                        icon={FileText}
                        label="Inscrição de Produtor Rural"
                        value={metadata.inscricaoProdutorRural}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="p-4 rounded-full bg-muted/50">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                Membro não encontrado
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
