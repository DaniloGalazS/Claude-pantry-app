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
import { MoreVertical, Pencil, Trash2, AlertTriangle } from "lucide-react";
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

  return (
    <Card className={status === "expired" ? "border-destructive" : status === "warning" ? "border-yellow-500" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{item.name}</h3>
              {status === "expired" && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Caducado
                </Badge>
              )}
              {status === "warning" && (
                <Badge variant="warning" className="text-xs">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {daysLeft === 0
                    ? "Caduca hoy"
                    : daysLeft === 1
                    ? "Caduca manana"
                    : `${daysLeft} dias`}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {item.quantity} {item.unit}
            </p>
            {item.expirationDate && (
              <p className="text-xs text-muted-foreground">
                Caduca: {formatDate(item.expirationDate)}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isDeleting}>
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
  );
}
