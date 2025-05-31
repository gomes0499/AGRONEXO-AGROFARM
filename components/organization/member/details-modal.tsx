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
  X
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    value 
  }: { 
    icon: any; 
    label: string; 
    value: string | undefined 
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm ml-5">{value || "Não informado"}</p>
    </div>
  );

  if (!member && !loading) {
    return null;
  }

  const userData = member?.user;
  const metadata = userData?.metadados || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95%] md:max-w-[90%] lg:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Detalhes do Membro
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : member ? (
            <div className="space-y-6">
              {/* Header com informações básicas */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 rounded-md">
                    <AvatarImage
                      src={userData?.imagem || ""}
                      alt={userData?.nome || ""}
                    />
                    <AvatarFallback className="text-lg">
                      {getInitials(userData)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">
                      {userData?.nome || userData?.email?.split("@")[0] || "Usuário"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MailIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">
                        {userData?.email || "email@exemplo.com"}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="default" className="w-fit">
                  {getRoleDisplay(member.funcao)}
                </Badge>
              </div>

              {/* Tabs com informações detalhadas */}
              <Tabs defaultValue="personal" className="w-full">
                <div className="bg-muted/50 border-b mb-4">
                  <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start">
                    <TabsTrigger 
                      value="personal"
                      className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                    >
                      Pessoais
                    </TabsTrigger>
                    <TabsTrigger 
                      value="contact"
                      className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                    >
                      Contato
                    </TabsTrigger>
                    <TabsTrigger 
                      value="documents"
                      className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                    >
                      Documentos
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Dados Pessoais */}
                <TabsContent value="personal" className="space-y-4 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      icon={MapPin} 
                      label="Naturalidade" 
                      value={metadata.naturalidade} 
                    />
                    <InfoField 
                      icon={User} 
                      label="Estado Civil" 
                      value={metadata.estadoCivil} 
                    />
                  </div>

                  {/* Dados do cônjuge se casado */}
                  {(metadata.estadoCivil === "CASADO" || metadata.estadoCivil === "UNIAO_ESTAVEL") && (
                    <>
                      <Separator className="my-4" />
                      <h4 className="text-md font-semibold mb-3">Dados do Cônjuge</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          value={metadata.cpfConjuge ? formatCPF(metadata.cpfConjuge) : undefined} 
                        />
                        <InfoField 
                          icon={FileText} 
                          label="RG do Cônjuge" 
                          value={metadata.rgConjuge ? `${formatRG(metadata.rgConjuge)}${metadata.orgaoEmissorConjuge ? ` - ${metadata.orgaoEmissorConjuge}` : ""}` : undefined} 
                        />
                      </div>
                    </>
                  )}

                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField 
                      icon={Calendar} 
                      label="Membro desde" 
                      value={formatDate(member.data_adicao || member.created_at)} 
                    />
                    <InfoField 
                      icon={Clock} 
                      label="Último acesso" 
                      value={formatDate(member.ultimo_login)} 
                    />
                  </div>
                </TabsContent>

                {/* Contato e Endereço */}
                <TabsContent value="contact" className="space-y-4 p-4">
                  <h4 className="text-md font-semibold mb-3">Contato</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField 
                      icon={MailIcon} 
                      label="Email" 
                      value={userData?.email} 
                    />
                    <InfoField 
                      icon={Phone} 
                      label="Telefone" 
                      value={userData?.telefone || metadata.telefone ? formatPhone(userData?.telefone || metadata.telefone) : undefined} 
                    />
                  </div>

                  <Separator className="my-4" />

                  <h4 className="text-md font-semibold mb-3">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      value={metadata.cidade ? `${metadata.cidade}${metadata.estado ? `/${metadata.estado}` : ""}` : undefined} 
                    />
                  </div>
                </TabsContent>

                {/* Documentos */}
                <TabsContent value="documents" className="space-y-4 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField 
                      icon={CreditCard} 
                      label="CPF" 
                      value={metadata.cpf ? formatCPF(metadata.cpf) : undefined} 
                    />
                    <InfoField 
                      icon={FileText} 
                      label="RG" 
                      value={metadata.rg ? `${formatRG(metadata.rg)}${metadata.orgaoEmissor ? ` - ${metadata.orgaoEmissor}` : ""}` : undefined} 
                    />
                    <InfoField 
                      icon={FileText} 
                      label="Inscrição de Produtor Rural" 
                      value={metadata.inscricaoProdutorRural} 
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Membro não encontrado</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}