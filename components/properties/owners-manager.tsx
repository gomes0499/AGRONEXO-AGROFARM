"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, AlertCircle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PropertyOwner } from "@/schemas/properties";
import { formatCPF, formatCNPJ } from "@/lib/utils/formatters";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OwnersManagerProps {
  form: UseFormReturn<any>;
  owners: PropertyOwner[];
  onChange: (owners: PropertyOwner[]) => void;
}

export function OwnersManager({ form, owners, onChange }: OwnersManagerProps) {
  const [newOwner, setNewOwner] = useState<PropertyOwner>({
    nome: "",
    cpf_cnpj: "",
    tipo_pessoa: "F",
    percentual_participacao: undefined,
  });

  const handleAddOwner = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (newOwner.nome && newOwner.nome.trim()) {
      const updatedOwners = [...owners, { ...newOwner, nome: newOwner.nome.trim() }];
      onChange(updatedOwners);
      setNewOwner({
        nome: "",
        cpf_cnpj: "",
        tipo_pessoa: "F",
        percentual_participacao: undefined,
      });
    }
  };

  const handleRemoveOwner = (index: number) => {
    const updatedOwners = owners.filter((_, i) => i !== index);
    onChange(updatedOwners);
  };

  const handleOwnerChange = (index: number, field: keyof PropertyOwner, value: any) => {
    const updatedOwners = [...owners];
    updatedOwners[index] = { ...updatedOwners[index], [field]: value };
    onChange(updatedOwners);
  };

  const totalPercentual = owners.reduce((sum, owner) => sum + (owner.percentual_participacao || 0), 0);
  const showPercentualWarning = totalPercentual > 0 && totalPercentual !== 100;

  const formatDocument = (doc: string, tipo: string) => {
    if (!doc) return "";
    return tipo === "F" ? formatCPF(doc) : formatCNPJ(doc);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Adicionar Proprietário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="owner-name">Nome do Proprietário *</Label>
              <Input
                id="owner-name"
                value={newOwner.nome}
                onChange={(e) => setNewOwner({ ...newOwner, nome: e.target.value })}
                placeholder="Nome completo ou razão social"
              />
            </div>
            <div>
              <Label htmlFor="owner-type">Tipo de Pessoa</Label>
              <Select
                value={newOwner.tipo_pessoa}
                onValueChange={(value: "F" | "J") =>
                  setNewOwner({ ...newOwner, tipo_pessoa: value, cpf_cnpj: "" })
                }
              >
                <SelectTrigger id="owner-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Pessoa Física</SelectItem>
                  <SelectItem value="J">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="owner-doc">
                {newOwner.tipo_pessoa === "F" ? "CPF" : "CNPJ"} (opcional)
              </Label>
              <Input
                id="owner-doc"
                value={newOwner.cpf_cnpj}
                onChange={(e) => setNewOwner({ ...newOwner, cpf_cnpj: e.target.value })}
                placeholder={newOwner.tipo_pessoa === "F" ? "000.000.000-00" : "00.000.000/0000-00"}
              />
            </div>
            <div>
              <Label htmlFor="owner-percent">Participação (%) (opcional)</Label>
              <Input
                id="owner-percent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newOwner.percentual_participacao || ""}
                onChange={(e) =>
                  setNewOwner({ 
                    ...newOwner, 
                    percentual_participacao: e.target.value ? Number(e.target.value) : undefined 
                  })
                }
                placeholder="Ex: 50.00"
              />
            </div>
          </div>
          <Button 
            type="button" 
            onClick={handleAddOwner} 
            variant="outline"
            disabled={!newOwner.nome || !newOwner.nome.trim()}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Proprietário
          </Button>
        </CardContent>
      </Card>

      {owners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proprietários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showPercentualWarning && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A soma dos percentuais deve totalizar 100%. Atual: {totalPercentual.toFixed(2)}%
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-3">
              {owners.map((owner, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome</Label>
                        <Input
                          value={owner.nome}
                          onChange={(e) => handleOwnerChange(index, "nome", e.target.value)}
                          placeholder="Nome do proprietário"
                        />
                      </div>
                      <div>
                        <Label>Tipo de Pessoa</Label>
                        <Select
                          value={owner.tipo_pessoa || "F"}
                          onValueChange={(value: "F" | "J") => {
                            handleOwnerChange(index, "tipo_pessoa", value);
                            handleOwnerChange(index, "cpf_cnpj", "");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="F">Pessoa Física</SelectItem>
                            <SelectItem value="J">Pessoa Jurídica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{owner.tipo_pessoa === "J" ? "CNPJ" : "CPF"}</Label>
                        <Input
                          value={owner.cpf_cnpj || ""}
                          onChange={(e) => handleOwnerChange(index, "cpf_cnpj", e.target.value)}
                          placeholder={owner.tipo_pessoa === "J" ? "00.000.000/0000-00" : "000.000.000-00"}
                        />
                      </div>
                      <div>
                        <Label>Participação (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={owner.percentual_participacao || ""}
                          onChange={(e) =>
                            handleOwnerChange(
                              index, 
                              "percentual_participacao", 
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          placeholder="Ex: 50.00"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOwner(index)}
                      className="ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}