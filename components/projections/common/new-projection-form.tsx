"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  FileText,
  Settings,
  BarChart3,
  Copy
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ProjecaoConfigFormValues, projecaoConfigFormSchema } from "@/schemas/projections";
import { createProjecaoConfig } from "@/lib/actions/projections-actions/index";
import { toast } from "sonner";

const WIZARD_STEPS = [
  {
    id: 1,
    title: "Informações Básicas",
    description: "Configure nome, período e tipo da projeção",
    icon: FileText,
  },
  {
    id: 2,
    title: "Configurações",
    description: "Defina parâmetros e cenários base",
    icon: Settings,
  },
  {
    id: 3,
    title: "Dados Iniciais",
    description: "Importe ou configure dados de partida",
    icon: BarChart3,
  },
  {
    id: 4,
    title: "Validação",
    description: "Revise e confirme a criação",
    icon: Check,
  },
];

interface NewProjectionFormProps {
  organization: { id: string; nome: string };
}

export function NewProjectionForm({ organization }: NewProjectionFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(projecaoConfigFormSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      periodo_inicio: new Date().getFullYear(),
      periodo_fim: new Date().getFullYear() + 5,
      formato_safra: "SAFRA_COMPLETA",
      status: "ATIVA",
      eh_padrao: false,
    },
  });

  const formData = form.watch();

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await createProjecaoConfig(organization.id, data);
      
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success("Projeção criada com sucesso");
        router.push("/dashboard/projections");
      }
    } catch (error) {
      toast.error("Erro ao criar projeção");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Informações Básicas
        </CardTitle>
        <CardDescription>
          Configure as informações fundamentais da projeção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Projeção</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Projeção Safra 2024/25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="formato_safra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formato de Safra</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ANO_SAFRA">Ano Safra</SelectItem>
                    <SelectItem value="ANO_CIVIL">Ano Civil</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="periodo_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Período Início</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={2020}
                    max={2050}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="periodo_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Período Fim</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={2020}
                    max={2050}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o objetivo desta projeção..."
                  rows={3}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações
        </CardTitle>
        <CardDescription>
          Defina os parâmetros base da projeção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ATIVA">Ativa</SelectItem>
                    <SelectItem value="INATIVA">Inativa</SelectItem>
                    <SelectItem value="ARQUIVADA">Arquivada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="eh_padrao"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Definir como configuração padrão
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Esta configuração será usada por padrão em novas projeções
                </p>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Dados Iniciais
        </CardTitle>
        <CardDescription>
          Configure os dados de partida para a projeção
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Os dados iniciais poderão ser configurados após a criação da projeção.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="w-5 h-5" />
          Validação
        </CardTitle>
        <CardDescription>
          Revise todas as configurações antes de criar a projeção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nome</label>
            <p className="text-sm font-medium">{formData.nome || "Sem nome"}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Formato</label>
            <p className="text-sm font-medium">
              {formData.formato_safra === "SAFRA_COMPLETA" ? "Safra Completa" : "Ano Civil"}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Período</label>
            <p className="text-sm font-medium">
              {formData.periodo_inicio} - {formData.periodo_fim}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <Badge variant={formData.status === "ATIVA" ? "default" : "secondary"}>
              {formData.status}
            </Badge>
          </div>
        </div>
        
        {formData.descricao && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Descrição</label>
            <p className="text-sm mt-1 p-3 bg-muted/30 rounded-md">{formData.descricao}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Projeção</h1>
          <p className="text-muted-foreground">
            Crie uma nova projeção financeira seguindo o assistente de configuração
          </p>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Progresso</CardTitle>
              <Badge variant="outline">
                Etapa {currentStep} de {WIZARD_STEPS.length}
              </Badge>
            </div>
            <Progress value={(currentStep / WIZARD_STEPS.length) * 100} className="w-full" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {WIZARD_STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isActive 
                        ? "border-primary bg-primary/5" 
                        : isCompleted
                        ? "border-green-200 bg-green-50"
                        : "border-muted"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium text-sm ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <div className="flex gap-2">
            {currentStep < WIZARD_STEPS.length ? (
              <Button type="button" onClick={handleNext}>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Projeção"}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}