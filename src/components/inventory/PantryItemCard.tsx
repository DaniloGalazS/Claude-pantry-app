"use client";

import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, AlertTriangle, Clock, CalendarDays, Package } from "lucide-react";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import type { PantryItem } from "@/types";

interface PantryItemCardProps {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (id: string) => void;
}

function getExpirationStatus(expirationDate: Timestamp | null): {
  status: "ok" | "warning" | "expired" | "none";
  daysLeft: number | null;
} {
  if (!expirationDate) return { status: "none", daysLeft: null };

  const now = new Date();
  const expDate = expirationDate.toDate();
  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: "expired", daysLeft: diffDays };
  if (diffDays <= 3) return { status: "warning", daysLeft: diffDays };
  return { status: "ok", daysLeft: diffDays };
}

export function PantryItemCard({ item, onEdit, onDelete }: PantryItemCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const { status, daysLeft } = getExpirationStatus(item.expirationDate);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const borderClass =
    status === "expired"
      ? "border-destructive/40 bg-destructive/3"
      : status === "warning"
      ? "border-warning/40 bg-warning/3"
      : "border-border/60";

  return (
    <>
    <Card className={`${borderClass} hover:shadow-md transition-all duration-200 group`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          {item.imageUrl ? (
            <button
              onClick={() => setShowImage(true)}
              className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-border/60 hover:ring-2 hover:ring-primary/30 transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-base truncate">{item.name}</h3>
              {status === "expired" && (
                <Badge variant="destructive" className="text-xs shrink-0">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Caducado
                </Badge>
              )}
              {status === "warning" && (
                <Badge variant="warning" className="text-xs shrink-0">
                  <Clock className="mr-1 h-3 w-3" />
                  {daysLeft === 0
                    ? "Caduca hoy"
                    : daysLeft === 1
                    ? "Caduca manana"
                    : `${daysLeft} dias`}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-primary">
                {item.quantity} {item.unit}
              </span>
            </div>
            {item.expirationDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                Caduca: {formatDate(item.expirationDate)}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isDeleting}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
    {item.imageUrl && (
      <ImagePreviewDialog
        imageUrl={item.imageUrl}
        productName={item.name}
        open={showImage}
        onOpenChange={setShowImage}
      />
    )}
    </>
  );
}
