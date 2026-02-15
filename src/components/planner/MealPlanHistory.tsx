"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarDays, Eye, Trash2, ChefHat, Loader2 } from "lucide-react";
import type { MealPlan } from "@/types";

function formatDate(timestamp: { toDate?: () => Date } | Date): string {
  const date = "toDate" in timestamp && timestamp.toDate ? timestamp.toDate() : timestamp as Date;
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("es-CL", opts)} - ${end.toLocaleDateString("es-CL", opts)}`;
}

interface MealPlanHistoryProps {
  plans: MealPlan[];
  loading: boolean;
  activePlanId: string | null;
  onLoadPlan: (plan: MealPlan) => void;
  onDeletePlan: (id: string) => Promise<void>;
}

export function MealPlanHistory({
  plans,
  loading,
  activePlanId,
  onLoadPlan,
  onDeletePlan,
}: MealPlanHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeletePlan(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
          <CalendarDays className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 font-display text-lg">Sin historial</h3>
        <p className="text-muted-foreground mt-1 text-sm max-w-xs mx-auto">
          Los planes que generes se guardaran automaticamente aqui
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {plans.map((plan) => {
          const isActive = plan.id === activePlanId;
          return (
            <Card
              key={plan.id}
              className={`border-border/60 rounded-xl transition-shadow hover:shadow-md ${isActive ? "ring-2 ring-primary/30" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ChefHat className="h-4 w-4 text-primary shrink-0" />
                      {formatDateRange(plan.config.startDate, plan.config.endDate)}
                      {isActive && (
                        <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Activo
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Generado el {formatDate(plan.generatedAt)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => onLoadPlan(plan)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title="Eliminar plan"
                      disabled={deletingId === plan.id}
                      onClick={() => setConfirmDeleteId(plan.id)}
                    >
                      {deletingId === plan.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{plan.meals.length} comidas</span>
                  <span>{plan.config.servings} porciones</span>
                  <span>
                    {plan.config.mealTypes
                      .map((t) =>
                        t === "desayuno" ? "Desayuno"
                          : t === "almuerzo" ? "Almuerzo"
                          : t === "once" ? "Once"
                          : t === "cena" ? "Cena"
                          : "Merienda"
                      )
                      .join(", ")}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar plan de comidas</AlertDialogTitle>
            <AlertDialogDescription>
              Este plan se eliminara permanentemente. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
