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
      projecao_config_id: projecaoConfigId,
      categoria: initialData?.categoria || "",
      subcategoria: initialData?.subcategoria || "",
      ano: initialData?.ano || new Date().getFullYear(),
      valor: initialData?.valor || 0,
      moeda: initialData?.moeda || "BRL",
      taxa_juros: initialData?.taxa_juros || undefined,
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
                  <Select onValueChange={(value) => {
                    field.onChange(value)
                    form.setValue("subcategoria", "") // Reset subcategoria when category changes
                  }} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="subcategoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategoria</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!selectedCategory}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a subcategoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedCategory?.subcategories.map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Especifique melhor o tipo de dívida (ex: Banco do Brasil, Cargill)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <YearFilter
              control={form.control}
              name="ano"
              label="Ano da Dívida"
              placeholder="Selecione o ano"
              required
              startYear={new Date().getFullYear() - 5}
              endYear={new Date().getFullYear() + 15}
            />

            <FormField
              control={form.control}
              name="moeda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moeda</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Valores e Taxas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Valores e Condições</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <CurrencyField
              name="valor"
              label="Valor da Dívida"
              control={form.control}
              placeholder="R$ 0,00"
              required
              description="Valor total da dívida neste ano"
            />

            <FormField
              control={form.control}
              name="taxa_juros"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Juros (% a.a.)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0,00"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Taxa de juros anual, se aplicável
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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