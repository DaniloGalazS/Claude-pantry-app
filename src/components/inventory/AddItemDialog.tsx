"use client";

import { useState, useEffect } from "react";
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
import { Plus, Loader2, Camera, X } from "lucide-react";
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

interface AddItemDialogProps {
  onAdd: (item: Omit<PantryItem, "id" | "addedAt" | "pantryId">) => Promise<string>;
  initialData?: {
    name?: string;
    brand?: string;
    category?: FoodCategory;
    quantity?: number;
    unit?: string;
    imageUrl?: string;
  };
  defaultOpen?: boolean;
  onClose?: () => void;
  trigger?: React.ReactNode;
  productNames?: string[];
  getImageForProduct?: (name: string) => string | undefined;
}

export function AddItemDialog({ onAdd, initialData, defaultOpen, onClose, trigger, productNames, getImageForProduct }: AddItemDialogProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      onClose?.();
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || "");
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [category, setCategory] = useState<FoodCategory | "">(initialData?.category || "");
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "1");
  const [unit, setUnit] = useState(initialData?.unit || "unidades");
  const [expirationDate, setExpirationDate] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [autoImageApplied, setAutoImageApplied] = useState(false);

  // Auto-associate image when product name matches a known product
  useEffect(() => {
    if (!getImageForProduct || !name.trim() || autoImageApplied) return;
    // Only auto-suggest if there's no manually set image and no initialData image
    if (imageUrl && !autoImageApplied) return;

    const suggestedImage = getImageForProduct(name);
    if (suggestedImage) {
      setImageUrl(suggestedImage);
      setAutoImageApplied(true);
    }
  }, [name, getImageForProduct, imageUrl, autoImageApplied]);

  const resetForm = () => {
    setName(initialData?.name || "");
    setBrand(initialData?.brand || "");
    setCategory(initialData?.category || "");
    setQuantity(initialData?.quantity?.toString() || "1");
    setUnit(initialData?.unit || "unidades");
    setExpirationDate("");
    setImageUrl(initialData?.imageUrl || null);
    setAutoImageApplied(false);
  };

  const handlePhotoCapture = async (base64: string) => {
    const compressed = await compressImageForStorage(base64);
    setImageUrl(compressed);
    setAutoImageApplied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalImageUrl: string | undefined;
      if (imageUrl) {
        // If it's already compressed (auto-associated or from PhotoCapture), use as-is
        // If from initialData, compress it
        if (initialData?.imageUrl && imageUrl === initialData.imageUrl) {
          finalImageUrl = await compressImageForStorage(imageUrl);
        } else {
          finalImageUrl = imageUrl;
        }
      }

      await onAdd({
        name,
        ...(brand.trim() && { brand: brand.trim() }),
        ...(category && { category }),
        quantity: parseFloat(quantity),
        unit,
        expirationDate: expirationDate
          ? Timestamp.fromDate(new Date(expirationDate))
          : null,
        ...(finalImageUrl && { imageUrl: finalImageUrl }),
      });
      setOpen(false);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                    onClick={() => { setImageUrl(null); setAutoImageApplied(false); }}
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
              <Label htmlFor="name">Nombre del producto</Label>
              <Autocomplete
                id="name"
                value={name}
                onChange={(val) => {
                  setName(val);
                  setAutoImageApplied(false);
                }}
                suggestions={productNames || []}
                placeholder="ej. Leche, Arroz, Tomates..."
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca (opcional)</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="ej. Colun, Carozzi..."
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
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
