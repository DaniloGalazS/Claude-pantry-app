"use client";

import { useState } from "react";
import { PhotoCapture } from "./PhotoCapture";
import { AddItemDialog } from "./AddItemDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import type { PantryItem } from "@/types";

interface ScanProductButtonProps {
  onAdd: (item: Omit<PantryItem, "id" | "addedAt" | "pantryId">) => Promise<string>;
}

export function ScanProductButton({ onAdd }: ScanProductButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedData, setScannedData] = useState<{
    name: string;
    quantity: number;
    unit: string;
    imageUrl?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleCapture = async (imageBase64: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/vision/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
      });

      const data = await response.json();

      if (data.error || !data.name) {
        toast({
          variant: "destructive",
          title: "No se pudo identificar",
          description: data.error || "No se detecto ningun producto alimenticio",
        });
        return;
      }

      setScannedData({
        name: data.name,
        quantity: data.suggestedQuantity || 1,
        unit: data.suggestedUnit || "unidades",
        imageUrl: imageBase64,
      });

      toast({
        title: "Producto identificado",
        description: `${data.name} detectado con ${Math.round(data.confidence * 100)}% de confianza`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar la imagen",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (scannedData) {
    return (
      <AddItemDialog
        onAdd={async (item) => {
          const id = await onAdd(item);
          setScannedData(null);
          return id;
        }}
        initialData={scannedData}
        defaultOpen
        onClose={() => setScannedData(null)}
        trigger={
          <Button variant="outline">
            <Camera className="mr-2 h-4 w-4" />
            Escanear producto
          </Button>
        }
      />
    );
  }

  return (
    <PhotoCapture
      onCapture={handleCapture}
      isProcessing={isProcessing}
      title="Escanear producto"
      description="Toma una foto del producto para identificarlo automaticamente"
      trigger={
        <Button variant="outline">
          <Camera className="mr-2 h-4 w-4" />
          Escanear producto
        </Button>
      }
    />
  );
}
