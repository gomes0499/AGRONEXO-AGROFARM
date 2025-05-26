"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, CreditCard } from "lucide-react"
import { CurrencyField } from "@/components/shared/currency-field"
import { YearFilter } from "../common/year-filter"
import { projecaoDividaFormSchema, type ProjecaoDividaFormValues } from "@/schemas/projections"

interface DebtProjectionFormProps {
  organizationId: string
  projecaoConfigId: string
  initialData?: Partial<ProjecaoDividaFormValues>
  onSubmit: (data: ProjecaoDividaFormValues) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  mode?: "create" | "edit"
}

const debtCategories = [
  {
    value: "BANCOS",
    label: "Bancos",
    subcategories: [
      "Banco do Brasil",
      "Itaú",
      "Bradesco",
      "Santander",
      "Sicredi",
      "Sicoob",
      "Caixa Econômica",
      "Outros"
    ]
  },
  {
    value: "TERRAS",
    label: "Terras",
    subcategories: [
      "Financiamento de Terras",
      "Parcelas de Aquisição",
      "PRONAF Terra",
      "Outros"
    ]
  },
  {
    value: "ARRENDAMENTO",
    label: "Arrendamento",
    subcategories: [
      "Arrendamento Rural",
      "Parceria",
      "Outros"
    ]
  },
  {
    value: "FORNECEDORES",
    label: "Fornecedores",
    subcategories: [
      "Fornecedores de Insumos",
      "Fornecedores de Equipamentos",
      "Prestadores de Serviços",
      "Outros"
    ]
  },
  {
    value: "TRADINGS",
    label: "Tradings",
    subcategories: [
      "Cargill",
      "ADM",
      "Bunge",
      "Louis Dreyfus",
      "COFCO",
      "Outros"
    ]
  },
  {
    value: "OUTROS",
    label: "Outros",
    subcategories: [
      "Empréstimos Pessoais",
      "Financiamentos Diversos",
      "Outros"
    ]
  }
]

export function DebtProjectionForm({
  organizationId,
  projecaoConfigId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = "create"
}: DebtProjectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProjecaoDividaFormValues>({
    resolver: zodResolver(projecaoDividaFormSchema),
    defaultValues: {
      organizacao_id: organizationId,
      projecao_config_id: projecaoConfigId,
      categoria: initialData?.categoria || "BANCOS",
      periodo: new Date().getFullYear().toString(),
      valor: initialData?.valor || 0,
      observacoes: initialData?.observacoes || "",
    }
  })

  const watchedCategory = form.watch("categoria")
  const selectedCategory = debtCategories.find(cat => cat.value === watchedCategory)

  const handleSubmit = async (data: ProjecaoDividaFormValues) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
    } catch (error) {
      console.error("Erro ao salvar projeção de dívida:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informações da Dívida
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Categoria <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {debtCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>

          <FormField
            control={form.control}
            name="periodo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Período <span className="text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Valor */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Valor da Dívida</h3>
          
          <CurrencyField
            name="valor"
            label="Valor da Dívida"
            control={form.control}
            placeholder="R$ 0,00"
          />
        </div>

        <Separator />

        {/* Observações */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observações adicionais sobre esta dívida..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Informações adicionais sobre condições, garantias, ou prazos específicos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === "create" ? "Criar Projeção" : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Form>
  )
}