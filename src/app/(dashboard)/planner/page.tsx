"use client";

import { useState, useEffect } from "react";
import { usePantryItems } from "@/hooks/usePantryItems";
import { usePantryContext } from "@/contexts/PantryContext";
import { useSavedRecipes } from "@/hooks/useSavedRecipes";
import { useMealPlans } from "@/hooks/useMealPlans";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { NutritionDisplay } from "@/components/recipes/NutritionDisplay";
import { MealPlanCalendar } from "@/components/planner/MealPlanCalendar";
import { MealPlanHistory } from "@/components/planner/MealPlanHistory";
import {
  CalendarDays,
  Loader2,
  Sparkles,
  Package,
  UtensilsCrossed,
  Clock,
  ShoppingCart,
  ChefHat,
  Eye,
  CheckCircle,
  Users,
  Flame,
  Play,
  ExternalLink,
  Grid3X3,
  List,
  RefreshCw,
  BarChart3,
  Copy,
  Share2,
  ClipboardCheck,
  Bookmark,
  BookmarkCheck,
  History,
} from "lucide-react";
import type {
  MealType,
  MealPlanConfig,
  MealPlan,
  PlannedMeal,
  ShoppingListItem,
  NutritionalInfo,
} from "@/types";

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: "desayuno", label: "Desayuno" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "once", label: "Once" },
  { value: "cena", label: "Cena" },
  { value: "merienda", label: "Merienda" },
];

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  once: "Once",
  cena: "Cena",
  merienda: "Merienda",
};

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function countDays(startDate: string, endDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function PlannerPage() {
  const { activePantryId, loading: pantryLoading } = usePantryContext();
  const { items: pantryItems, loading: itemsLoading } =
    usePantryItems(activePantryId);
  const { toast } = useToast();
  const { saveRecipe, isRecipeSaved } = useSavedRecipes();
  const { mealPlans, loading: plansLoading, saveMealPlan, deleteMealPlan } = useMealPlans();

  const today = getTodayISO();

  const [config, setConfig] = useState<MealPlanConfig>({
    startDate: today,
    endDate: addDays(today, 6),
    mealTypes: ["almuerzo", "cena"],
    servings: 2,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<PlannedMeal | null>(null);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Auto-load most recent plan on mount
  useEffect(() => {
    if (!plansLoading && !initialLoadDone) {
      setInitialLoadDone(true);
      if (mealPlans.length > 0) {
        const latest = mealPlans[0];
        loadPlanIntoState(latest);
      }
    }
  }, [plansLoading, initialLoadDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPlanIntoState = (plan: MealPlan) => {
    setConfig(plan.config);
    setMeals(plan.meals);
    setShoppingList(plan.shoppingList);
    setCheckedItems(new Set());
    setHasGenerated(true);
    setActivePlanId(plan.id);
  };

  const toggleMealType = (mealType: MealType) => {
    setConfig((prev) => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(mealType)
        ? prev.mealTypes.filter((m) => m !== mealType)
        : [...prev.mealTypes, mealType],
    }));
  };

  const isConfigValid =
    config.startDate &&
    config.endDate &&
    config.endDate >= config.startDate &&
    config.mealTypes.length > 0 &&
    config.servings >= 1 &&
    pantryItems.length > 0;

  const totalMeals =
    config.startDate && config.endDate && config.endDate >= config.startDate
      ? countDays(config.startDate, config.endDate) * config.mealTypes.length
      : 0;

  const requestGenerate = () => {
    if (!isConfigValid) return;
    if (hasGenerated && meals.length > 0) {
      setShowConfirmGenerate(true);
    } else {
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    if (!isConfigValid) return;
    setShowConfirmGenerate(false);

    setIsGenerating(true);
    try {
      const response = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pantryItems, config }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar el plan");
      }

      const data = await response.json();
      const newMeals = data.meals || [];
      const newShoppingList = data.shoppingList || [];

      setMeals(newMeals);
      setShoppingList(newShoppingList);
      setCheckedItems(new Set());
      setHasGenerated(true);

      // Auto-save to Firestore
      try {
        const planId = await saveMealPlan(config, newMeals, newShoppingList);
        setActivePlanId(planId);
      } catch {
        // Non-blocking: plan was generated but save failed
      }

      toast({
        title: "Plan generado",
        description: `Se generaron ${newMeals.length} comidas con lista de compras`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo generar el plan de comidas",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateMeal = async (meal: PlannedMeal) => {
    const key = `${meal.date}-${meal.mealType}`;
    setRegeneratingKey(key);
    try {
      const response = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pantryItems,
          config: {
            startDate: meal.date,
            endDate: meal.date,
            mealTypes: [meal.mealType],
            servings: config.servings,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al regenerar la comida");
      }

      const data = await response.json();
      const newMeal: PlannedMeal | undefined = data.meals?.[0];
      if (!newMeal) throw new Error("No se recibio la comida regenerada");

      setMeals((prev) =>
        prev.map((m) =>
          m.date === meal.date && m.mealType === meal.mealType ? newMeal : m
        )
      );

      toast({
        title: "Comida regenerada",
        description: `${MEAL_TYPE_LABELS[meal.mealType]} actualizada: ${newMeal.recipe.name}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo regenerar la comida",
      });
    } finally {
      setRegeneratingKey(null);
    }
  };

  const computeDailyNutrition = (dayMeals: PlannedMeal[]) => {
    const withNutrition = dayMeals.filter((m) => m.recipe.nutrition);
    if (withNutrition.length === 0) return null;
    return withNutrition.reduce(
      (acc, m) => {
        const n = m.recipe.nutrition as NutritionalInfo;
        return {
          calories: acc.calories + n.calories,
          protein: acc.protein + n.protein,
          carbs: acc.carbs + n.carbs.total,
          fat: acc.fat + n.fat.total,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const toggleCheckedItem = (idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const shoppingListToBuy = shoppingList.filter((item) => item.toBuy > 0);

  const handleCopyShoppingList = async () => {
    const text = shoppingListToBuy
      .map((item) => `- ${item.name}: ${item.toBuy} ${item.unit}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado", description: "Lista de compras copiada al portapapeles" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo copiar" });
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*Lista de compras*\n\n${shoppingListToBuy
      .map((item) => `- ${item.name}: ${item.toBuy} ${item.unit}`)
      .join("\n")}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleSaveRecipe = async (meal: PlannedMeal) => {
    try {
      await saveRecipe(meal.recipe);
      toast({
        title: "Receta guardada",
        description: `"${meal.recipe.name}" se agrego a tus recetas guardadas`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la receta",
      });
    }
  };

  // Group meals by date
  const mealsByDate = meals.reduce<Record<string, PlannedMeal[]>>(
    (acc, meal) => {
      if (!acc[meal.date]) {
        acc[meal.date] = [];
      }
      acc[meal.date].push(meal);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(mealsByDate).sort();

  if (pantryLoading || itemsLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-foreground">Planificador</h1>
        <p className="text-muted-foreground mt-1">
          Configura tu plan de comidas y genera sugerencias con IA
        </p>
      </div>

      {/* Empty pantry alert */}
      {pantryItems.length === 0 ? (
        <Alert className="border-border/60">
          <Package className="h-4 w-4" />
          <AlertTitle className="font-medium">Despensa vacia</AlertTitle>
          <AlertDescription>
            Agrega productos a tu despensa para poder generar un plan de comidas
            personalizado.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="p-4 bg-accent/50 rounded-xl border border-accent">
          <p className="text-sm text-accent-foreground">
            <strong>{pantryItems.length}</strong> ingredientes disponibles en tu
            despensa para planificar comidas.
          </p>
        </div>
      )}

      {/* Config card */}
      <Card className="border-border/60 rounded-xl">
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Configuracion del plan
          </CardTitle>
          <CardDescription>
            Selecciona las fechas, tipos de comida y porciones para tu plan
            semanal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={config.startDate}
                min={today}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                    endDate:
                      prev.endDate < e.target.value
                        ? e.target.value
                        : prev.endDate,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={config.endDate}
                min={config.startDate || today}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Meal types */}
          <div className="space-y-3">
            <Label>Tipos de comida</Label>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {MEAL_OPTIONS.map((meal) => (
                <div key={meal.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`meal-${meal.value}`}
                    checked={config.mealTypes.includes(meal.value)}
                    onCheckedChange={() => toggleMealType(meal.value)}
                  />
                  <Label
                    htmlFor={`meal-${meal.value}`}
                    className="cursor-pointer font-normal"
                  >
                    {meal.label}
                  </Label>
                </div>
              ))}
            </div>
            {config.mealTypes.length === 0 && (
              <p className="text-sm text-destructive">
                Selecciona al menos un tipo de comida
              </p>
            )}
          </div>

          {/* Servings */}
          <div className="space-y-2 max-w-[200px]">
            <Label htmlFor="servings">Porciones por comida</Label>
            <Input
              id="servings"
              type="number"
              min={1}
              max={12}
              value={config.servings}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  servings: Math.max(1, Math.min(12, Number(e.target.value))),
                }))
              }
            />
          </div>

          {/* Summary and generate */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border/60">
            {totalMeals > 0 && (
              <p className="text-sm text-muted-foreground">
                Se generaran <strong>{totalMeals} comidas</strong> para{" "}
                <strong>
                  {countDays(config.startDate, config.endDate)} dias
                </strong>
              </p>
            )}
            <Button
              onClick={requestGenerate}
              disabled={!isConfigValid || isGenerating}
              className="w-full sm:w-auto h-11 px-6 text-base font-medium shadow-sm sm:ml-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando plan...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generar plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results: Meals grouped by day */}
      {hasGenerated && meals.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            Tu plan de comidas
          </h2>

          <Tabs defaultValue="calendario">
            <TabsList>
              <TabsTrigger value="calendario" className="gap-1.5">
                <Grid3X3 className="h-4 w-4" />
                Calendario
              </TabsTrigger>
              <TabsTrigger value="lista" className="gap-1.5">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="historial" className="gap-1.5">
                <History className="h-4 w-4" />
                Historial
              </TabsTrigger>
            </TabsList>

            {/* Calendar view */}
            <TabsContent value="calendario">
              <div className="hidden md:block">
                <MealPlanCalendar
                  meals={meals}
                  config={config}
                  onViewRecipe={setSelectedMeal}
                  onRegenerateMeal={handleRegenerateMeal}
                  regeneratingKey={regeneratingKey}
                />
              </div>
              <div className="md:hidden">
                <Alert className="border-border/60">
                  <Grid3X3 className="h-4 w-4" />
                  <AlertTitle className="font-medium">
                    Solo disponible en escritorio
                  </AlertTitle>
                  <AlertDescription>
                    La vista de calendario requiere una pantalla mas amplia. Usa
                    la vista <strong>Lista</strong> para ver tu plan en este
                    dispositivo.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            {/* List view */}
            <TabsContent value="lista">
              <div className="space-y-8">
                {sortedDates.map((date) => {
                  const dayMeals = mealsByDate[date].sort(
                    (a, b) =>
                      config.mealTypes.indexOf(a.mealType) -
                      config.mealTypes.indexOf(b.mealType)
                  );
                  const dayNutrition = computeDailyNutrition(dayMeals);

                  return (
                    <div key={date} className="space-y-3">
                      <h3 className="font-display text-lg capitalize sticky top-0 bg-background/95 backdrop-blur py-2 z-10 border-b border-border/40">
                        {formatDateLabel(date)}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dayMeals.map((meal, idx) => {
                          const mealKey = `${meal.date}-${meal.mealType}`;
                          const isRegenerating = regeneratingKey === mealKey;

                          return (
                            <Card
                              key={`${date}-${meal.mealType}-${idx}`}
                              className="border-border/60 rounded-xl hover:shadow-md transition-shadow"
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {MEAL_TYPE_LABELS[meal.mealType] ||
                                      meal.mealType}
                                  </Badge>
                                  {meal.recipe.availablePercentage != null && (
                                    <span className="text-xs text-muted-foreground">
                                      {meal.recipe.availablePercentage}%
                                      disponible
                                    </span>
                                  )}
                                </div>
                                <CardTitle className="text-base mt-1">
                                  {meal.recipe.name}
                                </CardTitle>
                                {meal.recipe.description && (
                                  <CardDescription className="text-sm">
                                    {meal.recipe.description}
                                  </CardDescription>
                                )}
                              </CardHeader>
                              <CardContent className="pt-0 space-y-3">
                                {/* Time & difficulty */}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {meal.recipe.prepTime +
                                      meal.recipe.cookTime}{" "}
                                    min
                                  </span>
                                  {meal.recipe.difficulty && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs py-0"
                                    >
                                      {meal.recipe.difficulty === "easy"
                                        ? "Facil"
                                        : meal.recipe.difficulty === "medium"
                                          ? "Media"
                                          : "Dificil"}
                                    </Badge>
                                  )}
                                  {meal.recipe.servings && (
                                    <span>
                                      {meal.recipe.servings}{" "}
                                      {meal.recipe.servings === 1
                                        ? "porcion"
                                        : "porciones"}
                                    </span>
                                  )}
                                </div>

                                {/* Ingredients summary */}
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Ingredientes:
                                  </p>
                                  <p className="text-sm text-foreground/80">
                                    {meal.recipe.ingredients
                                      .map(
                                        (ing) =>
                                          `${ing.name} (${ing.quantity} ${ing.unit})`
                                      )
                                      .join(", ")}
                                  </p>
                                </div>

                                {/* Nutrition summary */}
                                {meal.recipe.nutrition && (
                                  <div className="flex gap-3 text-xs text-muted-foreground pt-1 border-t border-border/40">
                                    <span>
                                      {meal.recipe.nutrition.calories} kcal
                                    </span>
                                    <span>
                                      P: {meal.recipe.nutrition.protein}g
                                    </span>
                                    <span>
                                      C: {meal.recipe.nutrition.carbs.total}g
                                    </span>
                                    <span>
                                      G: {meal.recipe.nutrition.fat.total}g
                                    </span>
                                  </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-2 mt-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setSelectedMeal(meal)}
                                  >
                                    <Eye className="mr-2 h-3.5 w-3.5" />
                                    Ver receta
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    title={isRecipeSaved(meal.recipe.name) ? "Receta ya guardada" : "Guardar receta"}
                                    disabled={isRecipeSaved(meal.recipe.name)}
                                    onClick={() => handleSaveRecipe(meal)}
                                  >
                                    {isRecipeSaved(meal.recipe.name) ? (
                                      <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                                    ) : (
                                      <Bookmark className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    title="Regenerar comida"
                                    disabled={isRegenerating}
                                    onClick={() => handleRegenerateMeal(meal)}
                                  >
                                    {isRegenerating ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Daily nutrition summary */}
                      {dayNutrition && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                          <BarChart3 className="h-4 w-4 shrink-0" />
                          <span>
                            Total del dia:{" "}
                            <strong className="text-foreground">
                              {Math.round(dayNutrition.calories)} kcal
                            </strong>{" "}
                            · P: {Math.round(dayNutrition.protein)}g · C:{" "}
                            {Math.round(dayNutrition.carbs)}g · G:{" "}
                            {Math.round(dayNutrition.fat)}g
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* History view */}
            <TabsContent value="historial">
              <MealPlanHistory
                plans={mealPlans}
                loading={plansLoading}
                activePlanId={activePlanId}
                onLoadPlan={loadPlanIntoState}
                onDeletePlan={async (id) => {
                  await deleteMealPlan(id);
                  if (id === activePlanId) {
                    setActivePlanId(null);
                  }
                  toast({ title: "Plan eliminado", description: "El plan fue eliminado del historial" });
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Shopping list */}
      {hasGenerated && shoppingList.length > 0 && (
        <Card className="border-border/60 rounded-xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Lista de compras
                </CardTitle>
                <CardDescription className="mt-1">
                  {shoppingListToBuy.length > 0 ? (
                    <>
                      {checkedItems.size} de {shoppingListToBuy.length} items
                      marcados
                    </>
                  ) : (
                    "Tienes todos los ingredientes necesarios"
                  )}
                </CardDescription>
              </div>
              {shoppingListToBuy.length > 0 && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyShoppingList}
                    title="Copiar lista"
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareWhatsApp}
                    title="Compartir por WhatsApp"
                  >
                    <Share2 className="mr-1.5 h-3.5 w-3.5" />
                    Compartir
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress bar */}
            {shoppingListToBuy.length > 0 && checkedItems.size > 0 && (
              <div className="mb-4">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${(checkedItems.size / shoppingListToBuy.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left">
                    {shoppingListToBuy.length > 0 && (
                      <th className="py-2 pr-2 w-8" />
                    )}
                    <th className="py-2 pr-4 font-medium text-muted-foreground">
                      Ingrediente
                    </th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground text-right">
                      Necesario
                    </th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground text-right">
                      Disponible
                    </th>
                    <th className="py-2 font-medium text-muted-foreground text-right">
                      Por comprar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shoppingList.map((item, idx) => {
                    const needsToBuy = item.toBuy > 0;
                    const isChecked = checkedItems.has(idx);
                    return (
                      <tr
                        key={idx}
                        className={`border-b border-border/30 last:border-0 transition-colors ${
                          isChecked ? "bg-accent/20" : ""
                        }`}
                      >
                        {shoppingListToBuy.length > 0 && (
                          <td className="py-2 pr-2">
                            {needsToBuy && (
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleCheckedItem(idx)}
                              />
                            )}
                          </td>
                        )}
                        <td
                          className={`py-2 pr-4 ${isChecked ? "line-through text-muted-foreground" : ""}`}
                        >
                          {item.name}
                        </td>
                        <td className="py-2 pr-4 text-right text-muted-foreground">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 pr-4 text-right text-muted-foreground">
                          {item.available} {item.unit}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {needsToBuy ? (
                            <span
                              className={
                                isChecked
                                  ? "line-through text-muted-foreground"
                                  : "text-warning"
                              }
                            >
                              {item.toBuy} {item.unit}
                            </span>
                          ) : (
                            <span className="text-accent-foreground">
                              Suficiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* All checked message */}
            {shoppingListToBuy.length > 0 &&
              checkedItems.size === shoppingListToBuy.length && (
                <div className="mt-4 p-3 bg-accent/50 rounded-lg flex items-center gap-2 text-sm text-accent-foreground">
                  <ClipboardCheck className="h-4 w-4 shrink-0" />
                  Todos los items de la lista estan marcados como comprados
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Empty results state */}
      {hasGenerated && meals.length === 0 && (
        <Alert className="border-border/60">
          <UtensilsCrossed className="h-4 w-4" />
          <AlertTitle className="font-medium">Sin resultados</AlertTitle>
          <AlertDescription>
            No se pudieron generar comidas. Intenta ajustar la configuracion o
            agregar mas ingredientes a tu despensa.
          </AlertDescription>
        </Alert>
      )}

      {/* Empty state placeholder — only show before first generation */}
      {!hasGenerated && pantryItems.length > 0 && (
        <div className="space-y-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-display text-xl">Listo para planificar</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
              Configura tu plan y haz clic en &quot;Generar plan&quot; para
              obtener un menu semanal basado en tu despensa
            </p>
          </div>

          {/* Show history even when no active plan */}
          {mealPlans.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                Planes anteriores
              </h2>
              <MealPlanHistory
                plans={mealPlans}
                loading={plansLoading}
                activePlanId={activePlanId}
                onLoadPlan={loadPlanIntoState}
                onDeletePlan={async (id) => {
                  await deleteMealPlan(id);
                  toast({ title: "Plan eliminado", description: "El plan fue eliminado del historial" });
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Recipe detail dialog */}
      <Dialog
        open={selectedMeal !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMeal(null);
        }}
      >
        {selectedMeal && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display text-2xl">
                <ChefHat className="h-6 w-6 text-primary" />
                {selectedMeal.recipe.name}
              </DialogTitle>
              <DialogDescription className="text-base">
                {selectedMeal.recipe.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Info pills */}
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Prep: {selectedMeal.recipe.prepTime} min
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
                  <Flame className="h-4 w-4 text-muted-foreground" />
                  Coccion: {selectedMeal.recipe.cookTime} min
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {selectedMeal.recipe.servings} porciones
                </div>
                {selectedMeal.recipe.cuisine && (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1.5 text-sm font-normal"
                  >
                    {selectedMeal.recipe.cuisine}
                  </Badge>
                )}
                <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-sm font-normal">
                  {MEAL_TYPE_LABELS[selectedMeal.mealType]}
                </Badge>
              </div>

              {/* Dietary tags */}
              {selectedMeal.recipe.dietaryTags &&
                selectedMeal.recipe.dietaryTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMeal.recipe.dietaryTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-full">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

              {/* Ingredients */}
              <div>
                <h4 className="font-display text-lg mb-3">Ingredientes</h4>
                <ul className="space-y-2">
                  {selectedMeal.recipe.ingredients.map((ing, i) => {
                    const isMissing = selectedMeal.recipe.missingItems?.some(
                      (m) =>
                        m.name.toLowerCase() === ing.name.toLowerCase()
                    );
                    return (
                      <li
                        key={i}
                        className={`flex items-center gap-2.5 text-sm ${
                          isMissing ? "text-destructive" : ""
                        }`}
                      >
                        {isMissing ? (
                          <ShoppingCart className="h-4 w-4 shrink-0" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-accent-foreground shrink-0" />
                        )}
                        <span>
                          {ing.quantity} {ing.unit} de {ing.name}
                        </span>
                        {isMissing && (
                          <span className="text-xs text-destructive/70">
                            (falta)
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Missing items summary */}
              {selectedMeal.recipe.missingItems &&
                selectedMeal.recipe.missingItems.length > 0 && (
                  <div className="p-4 bg-destructive/5 border border-destructive/15 rounded-xl">
                    <p className="text-sm font-medium mb-1">
                      Ingredientes por comprar (
                      {selectedMeal.recipe.missingItems.length}):
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMeal.recipe.missingItems
                        .map(
                          (m) => `${m.quantity} ${m.unit} de ${m.name}`
                        )
                        .join(", ")}
                    </p>
                  </div>
                )}

              {/* Steps */}
              <div>
                <h4 className="font-display text-lg mb-3">Preparacion</h4>
                <ol className="space-y-3">
                  {selectedMeal.recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Nutrition */}
              {selectedMeal.recipe.nutrition && (
                <NutritionDisplay nutrition={selectedMeal.recipe.nutrition} />
              )}

              {/* YouTube */}
              <div className="p-4 bg-muted/50 rounded-xl border border-border/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Play className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">
                        Ver video de la receta
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Buscar en YouTube
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`receta ${selectedMeal.recipe.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-1.5">
                      Buscar
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row gap-2 sm:justify-between">
              <Button
                variant={isRecipeSaved(selectedMeal.recipe.name) ? "secondary" : "default"}
                disabled={isRecipeSaved(selectedMeal.recipe.name)}
                onClick={() => handleSaveRecipe(selectedMeal)}
                className="gap-2"
              >
                {isRecipeSaved(selectedMeal.recipe.name) ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" />
                    Guardada
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Guardar receta
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedMeal(null)}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Confirm generate new plan dialog */}
      <AlertDialog open={showConfirmGenerate} onOpenChange={setShowConfirmGenerate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generar nuevo plan</AlertDialogTitle>
            <AlertDialogDescription>
              Ya tienes un plan generado. ¿Quieres generar uno nuevo? El plan anterior se mantendra en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate}>
              Generar nuevo plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
