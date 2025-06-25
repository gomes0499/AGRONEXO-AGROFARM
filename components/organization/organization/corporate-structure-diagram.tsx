"use client";

import React from "react";
import { Building2, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCPF, formatCNPJ } from "@/lib/utils/formatters";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface Socio {
  nome: string;
  tipo_documento: "cpf" | "cnpj";
  documento: string;
  percentual?: number;
}

interface CorporateStructureDiagramProps {
  organizationName: string;
  socios: Socio[];
}

export function CorporateStructureDiagram({
  organizationName,
  socios,
}: CorporateStructureDiagramProps) {
  // Agrupar sócios por tipo
  const pessoasFisicas = socios.filter(s => s.tipo_documento === "cpf");
  const pessoasJuridicas = socios.filter(s => s.tipo_documento === "cnpj");

  return (
    <TooltipProvider>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px] py-8">
          {/* Organização principal no topo */}
          <div className="flex justify-center mb-12">
            <div className="relative">
              <div className="bg-primary text-primary-foreground px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
                <Building2 className="h-6 w-6" />
                <div>
                  <p className="font-semibold text-lg">{organizationName}</p>
                  <p className="text-sm opacity-90">Organização Principal</p>
                </div>
              </div>
              {/* Linha conectora vertical */}
              {socios.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full h-8 w-0.5 bg-border" />
              )}
            </div>
          </div>

          {socios.length > 0 && (
            <>
              {/* Linha horizontal conectando os sócios */}
              <div className="relative mb-8">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-border" 
                     style={{ width: `${Math.min(socios.length * 200, 800)}px` }} />
                
                {/* Linhas verticais para cada sócio */}
                <div className="flex justify-center gap-8 md:gap-12">
                  {socios.map((_, index) => (
                    <div 
                      key={index} 
                      className="w-0.5 h-8 bg-border"
                      style={{ 
                        marginLeft: index === 0 ? 0 : 'auto',
                        marginRight: index === socios.length - 1 ? 0 : 'auto'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Cards dos sócios */}
              <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                {socios.map((socio, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[200px] max-w-[250px]">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            socio.tipo_documento === 'cpf' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                              : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            {socio.tipo_documento === 'cpf' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Building2 className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{socio.nome}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {socio.tipo_documento === 'cpf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                            </p>
                            {socio.percentual && (
                              <Badge variant="secondary" className="mt-2">
                                {socio.percentual}% de participação
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{socio.nome}</p>
                        <p className="text-sm">
                          {socio.tipo_documento.toUpperCase()}: {
                            socio.tipo_documento === 'cpf'
                              ? formatCPF(socio.documento)
                              : formatCNPJ(socio.documento)
                          }
                        </p>
                        {socio.percentual && (
                          <p className="text-sm">Participação: {socio.percentual}%</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Legenda */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm">
                {pessoasFisicas.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      <User className="h-3 w-3" />
                    </div>
                    <span className="text-muted-foreground">
                      Pessoa Física ({pessoasFisicas.length})
                    </span>
                  </div>
                )}
                {pessoasJuridicas.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      <Building2 className="h-3 w-3" />
                    </div>
                    <span className="text-muted-foreground">
                      Pessoa Jurídica ({pessoasJuridicas.length})
                    </span>
                  </div>
                )}
              </div>

              {/* Resumo de participação */}
              {socios.some(s => s.percentual) && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Total de participação declarada: {' '}
                    <span className="font-medium">
                      {socios.reduce((acc, s) => acc + (s.percentual || 0), 0)}%
                    </span>
                  </p>
                </div>
              )}
            </>
          )}

          {socios.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma estrutura societária cadastrada
              </p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}