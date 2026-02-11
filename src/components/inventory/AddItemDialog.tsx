"use client";

import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { compressImageForStorage } from "@/lib/imageUtils";
import type { PantryItem } from "@/types";

const UNITS = [
  { value: "unidades", label: "Unidades" },
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "g", label: "Gramos (g)" },
  { value: "L", label: "Litros (L)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "paquetes", label: "Paquetes" },
  { value: "latas", label: "Latas" },
  { value: "botellas", label: "Botellas" },
];

interface AddItemDialogProps {
  onAdd: (item: Omit<PantryItem, "id" | "addedAt" | "pantryId">) => Promise<string>;
  initialData?: {
    name?: string;
    quantity?: number;
    unit?: string;
    imageUrl?: string;
  };
  trigger?: React.ReactNode;
}

export function AddItemDialog({ onAdd, initialData, trigger }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || "");
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "1");
  const [unit, setUnit] = useState(initialData?.unit || "unidades");
  const [expirationDate, setExpirationDate] = useState("");

  const resetForm = () => {
    setName(initialData?.name || "");
    setQuantity(initialData?.quantity?.toString() || "1");
    setUnit(initialData?.unit || "unidades");
    setExpirationDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl: string | undefined;
      if (initialData?.imageUrl) {
        imageUrl = await compressImageForStorage(initialData.imageUrl);
      }

      await onAdd({
        name,
        quantity: parseFloat(quantity),
        unit,
        expirationDate: expirationDate
          ? Timestamp.fromDate(new Date(expirationDate))
          : null,
        ...(imageUrl && { imageUrl }),
      });
      setOpen(false);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agregar producto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar producto</DialogTitle>
            <DialogDescription>
              Agrega un nuevo producto a tu despensa
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {initialData?.imageUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={initialData.imageUrl}
                  alt="Producto escaneado"
                  className="h-24 w-24 rounded-lg object-cover border border-border/60"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del producto</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Leche, Arroz, Tomates..."
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidad</Label>
                <Select value={unit} onValueChange={setUnit} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration">Fecha de caducidad (opcional)</Label>
              <Input
                id="expiration"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
