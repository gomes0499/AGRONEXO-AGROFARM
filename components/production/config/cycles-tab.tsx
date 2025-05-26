"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Plus, Edit2Icon, Trash2, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cycle, CycleFormValues, cycleFormSchema } from "@/schemas/production";
import { createCycle, updateCycle, deleteCycle } from "@/lib/actions/production-actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CyclesTabProps {
  initialCycles: Cycle[];
  organizationId: string;
}

export const CyclesTab = forwardRef<any, CyclesTabProps>(function CyclesTab({ initialCycles, organizationId }, ref) {
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  
  const form = useForm<CycleFormValues>({
    resolver: zodResolver(cycleFormSchema),
    defaultValues: {
      nome: "",
    },
  });

  useImperativeHandle(ref, () => ({
    handleCreate,
  }));
  
  // Função para abrir o diálogo de edição
  const handleEdit = (cycle: Cycle) => {
    setEditingCycle(cycle);
    form.reset({ nome: cycle.nome });
    setOpenDialog(true);
  };
  
  // Função para abrir o diálogo de criação
  const handleCreate = () => {
    setEditingCycle(null);
    form.reset({ nome: "" });
    setOpenDialog(true);
  };
  
  // Função para salvar (criar ou atualizar)
  const onSubmit = async (values: CycleFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (editingCycle) {
        // Atualizar ciclo existente
        const updated = await updateCycle(editingCycle.id!, values);
        setCycles(cycles.map(c => c.id === editingCycle.id ? updated : c));
        toast.success("Ciclo atualizado com sucesso!");
      } else {
        // Criar novo ciclo
        const created = await createCycle(organizationId, values);
        setCycles([...cycles, created]);
        toast.success("Ciclo criado com sucesso!");
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error("Erro ao salvar ciclo:", error);
      toast.error("Ocorreu um erro ao salvar o ciclo.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para excluir
  const handleDelete = async (id: string) => {
    try {
      await deleteCycle(id);
      setCycles(cycles.filter(c => c.id !== id));
      toast.success("Ciclo excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir ciclo:", error);
      toast.error("Ocorreu um erro ao excluir o ciclo.");
    }
  };
  
  return (
    <div className="space-y-4">
      {cycles.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Nenhum ciclo cadastrado.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Nome</TableHead>
                <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="font-medium">{cycle.nome}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(cycle)}>
                          <Edit2Icon className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Ciclo</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o ciclo "{cycle.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => handleDelete(cycle.id!)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCycle ? "Editar Ciclo" : "Novo Ciclo"}
            </DialogTitle>
            <DialogDescription>
              {editingCycle
                ? "Edite os detalhes do ciclo selecionado."
                : "Adicione um novo ciclo de produção."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Ciclo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1ª Safra, 2ª Safra" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingCycle ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
});