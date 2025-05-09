"use client"

import type React from "react"

import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Briefcase,
  Hash,
  CreditCard,
  ExternalLink,
  Copy,
  FileText,
} from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { formatCEP, formatCNPJ, formatPhone, formatCPF } from "@/lib/utils/formatters"
import { toast } from "sonner"

type OrganizationDetailInfoProps = {
  organization: any
}

export function OrganizationDetailInfo({ organization }: OrganizationDetailInfoProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    toast.success(`${field} copiado para a área de transferência.`)

    setTimeout(() => {
      setCopied(null)
    }, 2000)
  }

  // Função para renderizar um campo de informação com ícone e valor
  const renderField = (
    icon: React.ReactNode,
    label: string,
    value: string | null | undefined,
    copyable = true,
    link = false,
  ) => {
    if (!value) return null

    return (
      <div className="group flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
          {icon}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            {link ? (
              <a
                href={value.startsWith("http") ? value : `https://${value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                {value} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="font-medium">{value}</p>
            )}

            {copyable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(value, label)}
                    >
                      <Copy
                        className={`h-3.5 w-3.5 ${copied === label ? "text-green-500" : "text-muted-foreground"}`}
                      />
                      <span className="sr-only">Copiar {label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{copied === label ? "Copiado!" : "Copiar"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Função para renderizar o tipo de organização (PF ou PJ)
  const renderTypeInfo = () => {
    const isPJ = !!organization.cnpj
    return (
      <div className="group flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
          {isPJ ? <Briefcase className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Tipo</p>
          <Badge variant={isPJ ? "default" : "outline"} className="mt-0.5">
            {isPJ ? "Pessoa Jurídica" : "Pessoa Física"}
          </Badge>
        </div>
      </div>
    )
  }

  // Função para renderizar o endereço completo
  const renderAddress = () => {
    if (!organization.endereco) return null

    const addressLine1 = [
      organization.endereco,
      organization.numero && `nº ${organization.numero}`,
      organization.complemento,
    ]
      .filter(Boolean)
      .join(", ")

    const addressLine2 = [
      organization.bairro,
      organization.cidade && `${organization.cidade}`,
      organization.estado && `${organization.estado}`,
    ]
      .filter(Boolean)
      .join(", ")

    const cep = organization.cep ? formatCEP(String(organization.cep)) : null

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Endereço</h3>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <p className="font-medium">{addressLine1}</p>
          {addressLine2 && <p>{addressLine2}</p>}
          {cep && <p className="text-sm text-muted-foreground">CEP {cep}</p>}
        </div>
      </div>
    )
  }

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>Dados da Organização</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
          {/* Informações básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Informações Gerais</h3>
            <div className="space-y-4">
              {renderField(<Building2 className="h-4 w-4" />, "Nome", organization.nome)}
              {renderField(<Hash className="h-4 w-4" />, "Identificador", organization.slug)}
              {renderTypeInfo()}
            </div>
          </div>

          {/* Informações de contato */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Contato</h3>
            <div className="space-y-4">
              {renderField(<Mail className="h-4 w-4" />, "Email", organization.email)}
              {renderField(
                <Phone className="h-4 w-4" />,
                "Telefone",
                organization.telefone ? formatPhone(String(organization.telefone)) : null,
              )}
              {renderField(
                <Globe className="h-4 w-4" />,
                "Website",
                organization.website,
                true,
                !!organization.website,
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Documentos */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Documentos</h3>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {organization.cnpj &&
              renderField(<Briefcase className="h-4 w-4" />, "CNPJ", formatCNPJ(String(organization.cnpj)))}
            {organization.cpf &&
              renderField(
                <CreditCard className="h-4 w-4" />,
                "CPF",
                formatCPF ? formatCPF(String(organization.cpf)) : organization.cpf,
              )}
            {organization.inscricao_estadual &&
              renderField(<FileText className="h-4 w-4" />, "Inscrição Estadual", organization.inscricao_estadual)}
          </div>
        </div>

        {/* Endereço */}
        {organization.endereco && (
          <>
            <Separator />
            {renderAddress()}
          </>
        )}
      </CardContent>
    </Card>
  )
}
