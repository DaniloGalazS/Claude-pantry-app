"use client";

import { useState } from "react";
import { usePantryContext } from "@/contexts/PantryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Warehouse, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Pantry } from "@/types";

export function PantryManagement() {
  const { pantries, addPantry, updatePantry, deletePantry } = usePantryContext();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPantry, setEditingPantry] = useState<Pantry | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Pantry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditingPantry(null);
    setName("");
    setDescription("");
    setFormOpen(true);
  };

  const openEdit = (pantry: Pantry) => {
    setEditingPantry(pantry);
    setName(pantry.name);
    setDescription(pantry.description || "");
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      if (editingPantry) {
        await updatePantry(editingPantry.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast({
          title: "Despensa actualizada",
          description: `"${name.trim()}" se ha actualizado`,
        });
      } else {
        await addPantry(name.trim(), description.trim() || undefined);
        toast({
          title: "Despensa creada",
          description: `"${name.trim()}" se ha creado correctamente`,
        });
      }
      setFormOpen(false);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: editingPantry
          ? "No se pudo actualizar la despensa"
          : "No se pudo crear la despensa",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deletePantry(deleteTarget.id);
      toast({
        title: "Despensa eliminada",
        description: "Los productos se movieron a tu despensa principal",
      });
      setDeleteTarget(null);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la despensa",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Warehouse className="h-4 w-4 text-primary" />
              </div>
              Despensas
            </CardTitle>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nueva
            </Button>
          </div>
          <CardDescription>
            Organiza tus productos en diferentes despensas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pantries.map((pantry) => (
              <div
                key={pantry.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{pantry.name}</span>
                    {pantry.isDefault && (
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        Principal
                      </span>
                    )}
                  </div>
                  {pantry.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {pantry.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(pantry)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!pantry.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(pantry)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPantry ? "Editar despensa" : "Nueva despensa"}
              </DialogTitle>
              <DialogDescription>
                {editingPantry
                  ? "Modifica los datos de tu despensa"
                  : "Crea una nueva despensa para organizar tus productos"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pantry-name">Nombre</Label>
                <Input
                  id="pantry-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Casa playa, Oficina..."
                  required
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pantry-description">
                  Descripcion (opcional)
                </Label>
                <Input
                  id="pantry-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ej. Despensa del apartamento de verano"
                  disabled={isSaving}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingPantry ? (
                  "Guardar"
                ) : (
                  "Crear"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar despensa</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que deseas eliminar &quot;{deleteTarget?.name}&quot;?
              Los productos se moveran a tu despensa principal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
