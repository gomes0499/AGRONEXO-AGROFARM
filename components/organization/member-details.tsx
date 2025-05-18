"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/lib/auth/roles";
import { formatCPF, formatRG, formatPhone } from "@/lib/utils/formatters";
import { CalendarIcon, MailIcon, PhoneIcon, MapPinIcon, UserIcon, UserPlusIcon, CreditCardIcon, CalendarRangeIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define o tipo para o objeto de associação com usuário aninhado
interface MemberAssociation {
  id: string;
  organizacao_id: string;
  usuario_id: string;
  funcao: string;
  eh_proprietario: boolean;
  data_adicao?: string;
  ultimo_login?: string;
  user: {
    id: string;
    email: string;
    nome?: string;
    telefone?: string;
    imagem?: string;
    metadados?: any; // Usando any porque os metadados do Supabase Auth podem variar
  };
}

interface MemberDetailsProps {
  member: MemberAssociation;
  organizationId: string;
  organizationName: string;
}

export function MemberDetails({ member, organizationId, organizationName }: MemberDetailsProps) {
  const userData = member.user;
  const metadata = userData.metadados || {};
  
  console.log("Renderizando MemberDetails com dados:", { member, metadata });
  
  // Formatação de data (assumindo formato ISO)
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
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
  const getInitials = () => {
    const name = userData.nome || userData.email.split('@')[0];
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };
  
  return (
    <div className="space-y-6">
      {/* Cabeçalho com informações básicas */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-md">
                <AvatarImage src={userData.imagem || ''} alt={userData.nome || ''} />
                <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{userData.nome || userData.email.split('@')[0]}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <MailIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{userData.email}</span>
                </div>
              </div>
            </div>
            <Badge className={`${getRoleBadgeColor(member.funcao)} text-white`}>
              {getRoleDisplay(member.funcao)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="contact">Contato e Endereço</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>
            
            {/* Dados Pessoais */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                  <p className="text-md">{userData.nome || metadata.name || 'Não informado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                  <p className="text-md">{formatDate(metadata.data_nascimento || metadata.dataNascimento)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Naturalidade</p>
                  <p className="text-md">{metadata.naturalidade || 'Não informado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Estado Civil</p>
                  <p className="text-md">{metadata.estado_civil || metadata.estadoCivil || 'Não informado'}</p>
                </div>
              </div>
              
              {(metadata.estado_civil === 'CASADO' || metadata.estado_civil === 'CASADA' || 
                metadata.estadoCivil === 'Casado' || metadata.estadoCivil === 'Casada') ? (
                <>
                  <Separator className="my-4" />
                  <h3 className="text-lg font-semibold mb-3">Dados do Cônjuge</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Nome do Cônjuge</p>
                      <p className="text-md">{metadata.nome_conjuge || metadata.nomeConjuge || 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                      <p className="text-md">{formatDate(metadata.data_nascimento_conjuge || metadata.dataNascimentoConjuge)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">CPF do Cônjuge</p>
                      <p className="text-md">{metadata.cpf_conjuge || metadata.cpfConjuge ? formatCPF(metadata.cpf_conjuge || metadata.cpfConjuge) : 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">RG do Cônjuge</p>
                      <p className="text-md">
                        {metadata.rg_conjuge || metadata.rgConjuge ? 
                          `${formatRG(metadata.rg_conjuge || metadata.rgConjuge)}${
                            metadata.orgao_emissor_conjuge || metadata.orgaoEmissorConjuge ? 
                            ` - ${metadata.orgao_emissor_conjuge || metadata.orgaoEmissorConjuge}` : ''
                          }` : 'Não informado'}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
              
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Membro desde</p>
                <p className="text-md">{formatDate(member.data_adicao)}</p>
              </div>
              {member.ultimo_login && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Último acesso</p>
                  <p className="text-md">{formatDate(member.ultimo_login)}</p>
                </div>
              )}
            </TabsContent>
            
            {/* Contato e Endereço */}
            <TabsContent value="contact" className="space-y-4">
              <h3 className="text-lg font-semibold mb-3">Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-md">{userData.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p className="text-md">{userData.telefone || metadata.telefone ? formatPhone(userData.telefone || metadata.telefone) : 'Não informado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Celular</p>
                  <p className="text-md">{metadata.celular ? formatPhone(metadata.celular) : 'Não informado'}</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="text-lg font-semibold mb-3">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">CEP</p>
                  <p className="text-md">{metadata.cep || 'Não informado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Logradouro</p>
                  <p className="text-md">{metadata.endereco || 'Não informado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Número</p>
                  <p className="text-md">{metadata.numero || 'Não informado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Complemento</p>
                  <p className="text-md">{metadata.complemento || 'Não informado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Bairro</p>
                  <p className="text-md">{metadata.bairro || 'Não informado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Cidade/UF</p>
                  <p className="text-md">
                    {metadata.cidade ? `${metadata.cidade}${metadata.estado ? `/${metadata.estado}` : ''}` : 'Não informado'}
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Documentos */}
            <TabsContent value="documents" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">CPF</p>
                  <p className="text-md">{metadata.cpf ? formatCPF(metadata.cpf) : 'Não informado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">RG</p>
                  <p className="text-md">
                    {metadata.rg ? `${formatRG(metadata.rg)}${metadata.orgao_emissor || metadata.orgaoEmissor ? ` - ${metadata.orgao_emissor || metadata.orgaoEmissor}` : ''}` : 'Não informado'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Inscrição de Produtor Rural</p>
                  <p className="text-md">{metadata.inscricao_produtor_rural || metadata.inscricaoProdutorRural || 'Não informado'}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}