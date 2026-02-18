"use client";

import { useState, useEffect } from "react";
import { Timestamp, deleteField } from "firebase/firestore";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Camera, X } from "lucide-react";
import { Autocomplete } from "@/components/ui/autocomplete";
import { PhotoCapture } from "@/components/inventory/PhotoCapture";
import { compressImageForStorage } from "@/lib/imageUtils";
import type { PantryItem, FoodCategory } from "@/types";
import { FOOD_CATEGORIES } from "@/types";

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

interface EditItemDialogProps {
  item: PantryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Omit<PantryItem, "id">>) => Promise<void>;
  productNames?: string[];
}

export function EditItemDialog({
  item,
  open,
  onOpenChange,
  onSave,
  productNames,
}: EditItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<FoodCategory | "">("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("unidades");
  const [expirationDate, setExpirationDate] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setBrand(item.brand || "");
      setCategory(item.category || "");
      setQuantity(item.quantity.toString());
      setUnit(item.unit);
      setImageUrl(item.imageUrl || null);
      setImageRemoved(false);
      if (item.expirationDate) {
        const date = item.expirationDate.toDate();
        setExpirationDate(date.toISOString().split("T")[0]);
      } else {
        setExpirationDate("");
      }
    }
  }, [item]);

  const handlePhotoCapture = async (base64: string) => {
    const compressed = await compressImageForStorage(base64);
    setImageUrl(compressed);
    setImageRemoved(false);
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImageRemoved(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setIsLoading(true);

    try {
      const updates: Partial<Omit<PantryItem, "id">> = {
        name,
        quantity: parseFloat(quantity),
        unit,
        expirationDate: expirationDate
          ? Timestamp.fromDate(new Date(expirationDate))
          : null,
      };

      // Use deleteField() for optional fields when empty — passing undefined to updateDoc causes a Firestore internal error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updates as any).brand = brand.trim() || deleteField();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updates as any).category = category || deleteField();

      if (imageUrl && imageUrl !== item.imageUrl) {
        updates.imageUrl = imageUrl;
      } else if (imageRemoved) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updates as any).imageUrl = deleteField();
      }

      await onSave(item.id, updates);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
            <DialogDescription>
              Modifica los datos del producto
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Image section */}
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Producto"
                    className="h-20 w-20 rounded-lg object-cover border border-border/60"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null}
              <PhotoCapture
                onCapture={handlePhotoCapture}
                isProcessing={false}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    {imageUrl ? "Cambiar foto" : "Agregar foto"}
                  </Button>
                }
                title="Foto del producto"
                description="Toma una foto o sube una imagen del producto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del producto</Label>
              <Autocomplete
                id="edit-name"
                value={name}
                onChange={setName}
                suggestions={productNames || []}
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-brand">Marca (opcional)</Label>
                <Input
                  id="edit-brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="ej. Colun, Carozzi..."
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as FoodCategory | "")} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOOD_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Cantidad</Label>
                <Input
                  id="edit-quantity"
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
                <Label htmlFor="edit-unit">Unidad</Label>
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
              <Label htmlFor="edit-expiration">
                Fecha de caducidad (opcional)
              </Label>
              <Input
                id="edit-expiration"
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
              onClick={() => onOpenChange(false)}
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
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
