"use client";

import { useState } from "react";
import { PhotoCapture } from "./PhotoCapture";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Loader2 } from "lucide-react";
import type { PantryItem } from "@/types";

interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
  selected: boolean;
}

interface ScanReceiptButtonProps {
  onAddMultiple: (items: Omit<PantryItem, "id" | "addedAt" | "pantryId">[]) => Promise<void>;
}

export function ScanReceiptButton({ onAddMultiple }: ScanReceiptButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleCapture = async (imageBase64: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/vision/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
      });

      const data = await response.json();

      if (data.error || !data.items || data.items.length === 0) {
        toast({
          variant: "destructive",
          title: "No se encontraron productos",
          description: data.error || "No se detectaron productos en el ticket",
        });
        return;
      }

      setScannedItems(
        data.items.map((item: { name: string; quantity: number; unit: string }) => ({
          ...item,
          selected: true,
        }))
      );
      setShowDialog(true);

      toast({
        title: "Ticket escaneado",
        description: `${data.items.length} productos encontrados`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar el ticket",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleItem = (index: number) => {
    setScannedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSave = async () => {
    const selectedItems = scannedItems
      .filter((item) => item.selected)
      .map(({ name, quantity, unit }) => ({
        name,
        quantity,
        unit,
        expirationDate: null,
      }));

    if (selectedItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona al menos un producto",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onAddMultiple(selectedItems);
      setShowDialog(false);
      setScannedItems([]);
      toast({
        title: "Productos agregados",
        description: `${selectedItems.length} productos se han agregado a tu despensa`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron agregar los productos",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PhotoCapture
        onCapture={handleCapture}
        isProcessing={isProcessing}
        title="Escanear ticket"
        description="Toma una foto del ticket de compra para extraer los productos"
        trigger={
          <Button variant="outline">
            <Receipt className="mr-2 h-4 w-4" />
            Escanear ticket
          </Button>
        }
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Productos encontrados</DialogTitle>
            <DialogDescription>
              Selecciona los productos que deseas agregar a tu despensa
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {scannedItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleItem(index)}
              >
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={() => toggleItem(index)}
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                `Agregar ${scannedItems.filter((i) => i.selected).length} productos`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
