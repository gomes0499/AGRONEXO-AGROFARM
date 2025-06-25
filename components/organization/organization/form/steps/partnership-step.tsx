"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { OrganizationFormValues } from "../schemas/organization-form-schema";

interface PartnershipStepProps {
  form: UseFormReturn<OrganizationFormValues>;
}

interface Partner {
  nome: string;
  documento: string;
  tipo_documento: "cpf" | "cnpj";
  percentual?: number;
}

export function PartnershipStep({ form }: PartnershipStepProps) {
  const [partners, setPartners] = useState<Partner[]>(
    form.getValues("estrutura_societaria") || []
  );
  const [newPartner, setNewPartner] = useState<Partner>({
    nome: "",
    documento: "",
    tipo_documento: "cpf",
    percentual: undefined,
  });

  const handleAddPartner = () => {
    if (newPartner.nome && newPartner.documento) {
      const updatedPartners = [...partners, newPartner];
      setPartners(updatedPartners);
      form.setValue("estrutura_societaria", updatedPartners);
      setNewPartner({
        nome: "",
        documento: "",
        tipo_documento: "cpf",
        percentual: undefined,
      });
    }
  };

  const handleRemovePartner = (index: number) => {
    const updatedPartners = partners.filter((_, i) => i !== index);
    setPartners(updatedPartners);
    form.setValue("estrutura_societaria", updatedPartners);
  };

  const totalPercentual = partners.reduce((sum, partner) => sum + (partner.percentual || 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estrutura Societária</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partner-name">Nome do Sócio/Acionista</Label>
              <Input
                id="partner-name"
                value={newPartner.nome}
                onChange={(e) => setNewPartner({ ...newPartner, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="partner-doc-type">Tipo de Documento</Label>
              <Select
                value={newPartner.tipo_documento}
                onValueChange={(value: "cpf" | "cnpj") =>
                  setNewPartner({ ...newPartner, tipo_documento: value })
                }
              >
                <SelectTrigger id="partner-doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="partner-doc">Documento</Label>
              <Input
                id="partner-doc"
                value={newPartner.documento}
                onChange={(e) => setNewPartner({ ...newPartner, documento: e.target.value })}
                placeholder={newPartner.tipo_documento === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
              />
            </div>
            <div>
              <Label htmlFor="partner-percent">Participação (%)</Label>
              <Input
                id="partner-percent"
                type="number"
                min="0"
                max="100"
                value={newPartner.percentual || ""}
                onChange={(e) =>
                  setNewPartner({ ...newPartner, percentual: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="Opcional"
              />
            </div>
          </div>
          <Button 
            type="button" 
            onClick={handleAddPartner} 
            variant="outline"
            disabled={!newPartner.nome || !newPartner.documento}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Sócio
          </Button>
        </CardContent>
      </Card>

      {partners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sócios/Acionistas Adicionados</CardTitle>
            {totalPercentual > 0 && (
              <p className="text-sm text-muted-foreground">
                Total de participação: {totalPercentual}%
                {totalPercentual !== 100 && " (deve somar 100% se informado)"}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {partners.map((partner, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{partner.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {partner.tipo_documento.toUpperCase()}: {partner.documento}
                      {partner.percentual && ` • ${partner.percentual}%`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePartner(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}