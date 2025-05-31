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
import {
  System,
  SystemFormValues,
  systemFormSchema,
} from "@/schemas/production";
import {
  createSystem,
  updateSystem,
  deleteSystem,
} from "@/lib/actions/production-actions";
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

interface SystemsTabProps {
  initialSystems: System[];
  organizationId: string;
}

export const SystemsTab = forwardRef<any, SystemsTabProps>(function SystemsTab({
  initialSystems,
  organizationId,
}, ref) {
  const [systems, setSystems] = useState<System[]>(initialSystems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);

  const form = useForm<SystemFormValues>({
    resolver: zodResolver(systemFormSchema),
    defaultValues: {
      nome: "",
    },
  });

  useImperativeHandle(ref, () => ({
    handleCreate,
  }));

  // Função para abrir o diálogo de edição
  const handleEdit = (system: System) => {
    setEditingSystem(system);
    form.reset({ nome: system.nome });
    setOpenDialog(true);
  };

  // Função para abrir o diálogo de criação
  const handleCreate = () => {
    setEditingSystem(null);
    form.reset({ nome: "" });
    setOpenDialog(true);
  };

  // Função para salvar (criar ou atualizar)
  const onSubmit = async (values: SystemFormValues) => {
    try {
      setIsSubmitting(true);

      if (editingSystem) {
        // Atualizar sistema existente
        const updated = await updateSystem(editingSystem.id!, values);
        setSystems(
          systems.map((s) => (s.id === editingSystem.id ? updated : s))
        );
        toast.success("Sistema atualizado com sucesso!");
      } else {
        // Criar novo sistema
        const created = await createSystem(organizationId, values);
        setSystems([...systems, created]);
        toast.success("Sistema criado com sucesso!");
      }

      setOpenDialog(false);
    } catch (error) {
      console.error("Erro ao salvar sistema:", error);
      toast.error("Ocorreu um erro ao salvar o sistema.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para excluir
  const handleDelete = async (id: string) => {
    try {
      await deleteSystem(id);
      setSystems(systems.filter((s) => s.id !== id));
      toast.success("Sistema excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir sistema:", error);
      toast.error("Ocorreu um erro ao excluir o sistema.");
    }
  };

  return (
    <div className="space-y-4">
      {systems.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Nenhum sistema cadastrado.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="font-medium text-primary-foreground rounded-tl-md">Nome</TableHead>
                <TableHead className="font-medium text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systems.map((system) => (
                <TableRow key={system.id}>
                  <TableCell className="font-medium">{system.nome}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEdit(system)}>
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
                              <AlertDialogTitle>Excluir Sistema</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o sistema "
                                {system.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => handleDelete(system.id!)}
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
              {editingSystem ? "Editar Sistema" : "Novo Sistema"}
            </DialogTitle>
            <DialogDescription>
              {editingSystem
                ? "Edite os detalhes do sistema selecionado."
                : "Adicione um novo sistema de produção."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Sistema</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Sequeiro, Irrigado" {...field} />
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
                  {editingSystem ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
});
