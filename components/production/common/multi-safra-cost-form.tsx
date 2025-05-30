'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, DollarSign, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { CurrencyField } from '@/components/shared/currency-field'

const multiSafraCostSchema = z.object({
  propriedade_id: z.string().min(1, "Propriedade é obrigatória"),
  cultura_id: z.string().min(1, "Cultura é obrigatória"),
  sistema_id: z.string().min(1, "Sistema é obrigatório"),
  categoria: z.enum([
    'CALCARIO', 'FERTILIZANTE', 'SEMENTES', 'TRATAMENTO_SEMENTES',
    'HERBICIDA', 'INSETICIDA', 'FUNGICIDA', 'OUTROS',
    'BENEFICIAMENTO', 'SERVICOS', 'ADMINISTRATIVO'
  ]),
  custos_por_safra: z.array(z.object({
    safra_id: z.string().min(1, "Safra é obrigatória"),
    valor: z.coerce.number().min(0.01, "Valor deve ser maior que 0"),
  })).min(1, "Adicione pelo menos um custo por safra"),
})

type MultiSafraCostFormData = z.infer<typeof multiSafraCostSchema>

interface MultiSafraCostFormProps {
  properties: { id: string; nome: string }[]
  cultures: { id: string; nome: string }[]
  systems: { id: string; nome: string }[]
  safras: { id: string; nome: string }[]
  onSubmit: (data: MultiSafraCostFormData) => Promise<void>
  trigger?: React.ReactNode
}

const COST_CATEGORIES = {
  // Insumos
  CALCARIO: 'Calcário',
  FERTILIZANTE: 'Fertilizante',
  SEMENTES: 'Sementes',
  TRATAMENTO_SEMENTES: 'Tratamento de Sementes',
  
  // Defensivos
  HERBICIDA: 'Herbicida',
  INSETICIDA: 'Inseticida',
  FUNGICIDA: 'Fungicida',
  OUTROS: 'Outros Defensivos',
  
  // Operações
  BENEFICIAMENTO: 'Beneficiamento',
  SERVICOS: 'Serviços',
  
  // Gestão
  ADMINISTRATIVO: 'Administrativo'
}

const CATEGORY_GROUPS = {
  'Insumos': ['CALCARIO', 'FERTILIZANTE', 'SEMENTES', 'TRATAMENTO_SEMENTES'],
  'Defensivos': ['HERBICIDA', 'INSETICIDA', 'FUNGICIDA', 'OUTROS'],
  'Operações': ['BENEFICIAMENTO', 'SERVICOS'],
  'Gestão': ['ADMINISTRATIVO']
}

const CATEGORY_COLORS = {
  'Insumos': 'bg-green-100 text-green-800',
  'Defensivos': 'bg-red-100 text-red-800',
  'Operações': 'bg-blue-100 text-blue-800',
  'Gestão': 'bg-purple-100 text-purple-800'
}

export function MultiSafraCostForm({
  properties,
  cultures,
  systems,
  safras,
  onSubmit,
  trigger
}: MultiSafraCostFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MultiSafraCostFormData>({
    resolver: zodResolver(multiSafraCostSchema),
    defaultValues: {
      propriedade_id: '',
      cultura_id: '',
      sistema_id: '',
      categoria: 'FERTILIZANTE',
      custos_por_safra: [{ safra_id: '', valor: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'custos_por_safra',
  })

  const watchedCosts = form.watch('custos_por_safra')
  const watchedCategory = form.watch('categoria')

  const handleSubmit = async (data: MultiSafraCostFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      toast.success(`${data.custos_por_safra.length} custo(s) adicionado(s) com sucesso!`)
      form.reset()
      setOpen(false)
    } catch (error) {
      toast.error('Erro ao adicionar custos')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addCost = () => {
    append({ safra_id: '', valor: 0 })
  }

  const removeCost = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const getUsedSafras = () => {
    return watchedCosts.map(c => c.safra_id).filter(Boolean)
  }

  const getAvailableSafras = (currentIndex: number) => {
    const usedSafras = getUsedSafras()
    const currentSafra = watchedCosts[currentIndex]?.safra_id
    return safras.filter(safra => !usedSafras.includes(safra.id) || safra.id === currentSafra)
  }

  const getTotalCost = () => {
    return watchedCosts.reduce((sum, cost) => sum + (cost.valor || 0), 0)
  }

  const getAverageCost = () => {
    const validCosts = watchedCosts.filter(c => c.valor > 0)
    if (validCosts.length === 0) return 0
    return getTotalCost() / validCosts.length
  }

  const getCategoryGroup = (category: string) => {
    for (const [group, categories] of Object.entries(CATEGORY_GROUPS)) {
      if (categories.includes(category)) {
        return group
      }
    }
    return 'Outros'
  }

  const getCategoryColor = (category: string) => {
    const group = getCategoryGroup(category)
    return CATEGORY_COLORS[group as keyof typeof CATEGORY_COLORS] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Múltiplos Custos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Adicionar Custos por Safra
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Fixed Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuração Base</CardTitle>
                <CardDescription>
                  Estas configurações serão aplicadas para todas as safras
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propriedade_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propriedade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a propriedade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.nome}
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
                    name="cultura_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cultura</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a cultura" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cultures.map((culture) => (
                              <SelectItem key={culture.id} value={culture.id}>
                                {culture.nome}
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
                    name="sistema_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sistema</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o sistema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {systems.map((system) => (
                              <SelectItem key={system.id} value={system.id}>
                                {system.nome}
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
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Categoria
                          <Badge className={getCategoryColor(field.value)}>
                            {getCategoryGroup(field.value)}
                          </Badge>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(CATEGORY_GROUPS).map(([group, categories]) => (
                              <div key={group}>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                  {group}
                                </div>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {COST_CATEGORIES[category as keyof typeof COST_CATEGORIES] || category}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Cost Fields */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Custos por Safra</CardTitle>
                  <CardDescription>
                    Adicione os custos para cada safra desejada
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addCost}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => {
                  const availableSafras = getAvailableSafras(index)

                  return (
                    <div key={field.id} className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Custo #{index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCost(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`custos_por_safra.${index}.safra_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Safra</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a safra" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableSafras.map((safra) => (
                                    <SelectItem key={safra.id} value={safra.id}>
                                      {safra.nome}
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
                          name={`custos_por_safra.${index}.valor`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor (R$)</FormLabel>
                              <FormControl>
                                <CurrencyField
                                  name={`custos_por_safra.${index}.valor`}
                                  onChange={(value) => field.onChange(value)}
                                  placeholder="R$ 0,00"
                                  defaultValue={field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Summary */}
            {watchedCosts.some(c => c.valor > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Resumo Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {watchedCosts.filter(c => c.valor > 0).length}
                      </div>
                      <div className="text-sm text-green-700">Safras com custo</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(getTotalCost())}
                      </div>
                      <div className="text-sm text-blue-700">Total geral</div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(getAverageCost())}
                      </div>
                      <div className="text-sm text-amber-700">Média por safra</div>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="mt-4 flex justify-center">
                    <Badge className={`${getCategoryColor(watchedCategory)} text-base px-3 py-1`}>
                      {COST_CATEGORIES[watchedCategory as keyof typeof COST_CATEGORIES] || watchedCategory}
                      <span className="ml-2 text-xs opacity-75">
                        {getCategoryGroup(watchedCategory)}
                      </span>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : `Salvar ${fields.length} Custo(s)`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}