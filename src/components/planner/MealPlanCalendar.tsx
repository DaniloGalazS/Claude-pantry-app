"use client";

import { Button } from "@/components/ui/button";
import { Eye, RefreshCw, Loader2 } from "lucide-react";
import type { PlannedMeal, MealPlanConfig, MealType, NutritionalInfo } from "@/types";

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  once: "Once",
  cena: "Cena",
  merienda: "Merienda",
};

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const weekday = date.toLocaleDateString("es-CL", { weekday: "short" });
  const day = date.getDate();
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day}`;
}

interface DailyNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function computeDailyNutrition(
  meals: PlannedMeal[],
  date: string
): DailyNutrition | null {
  const dayMeals = meals.filter((m) => m.date === date);
  const withNutrition = dayMeals.filter((m) => m.recipe.nutrition);
  if (withNutrition.length === 0) return null;

  return withNutrition.reduce<DailyNutrition>(
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
}

interface MealPlanCalendarProps {
  meals: PlannedMeal[];
  config: MealPlanConfig;
  onViewRecipe: (meal: PlannedMeal) => void;
  onRegenerateMeal: (meal: PlannedMeal) => void;
  regeneratingKey: string | null;
}

export function MealPlanCalendar({
  meals,
  config,
  onViewRecipe,
  onRegenerateMeal,
  regeneratingKey,
}: MealPlanCalendarProps) {
  // Build sorted unique dates
  const dates = Array.from(new Set(meals.map((m) => m.date))).sort();

  // Build lookup: "date-mealType" -> PlannedMeal
  const mealMap = new Map<string, PlannedMeal>();
  for (const meal of meals) {
    mealMap.set(`${meal.date}-${meal.mealType}`, meal);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30">
            <th className="text-left py-3 px-3 font-medium text-muted-foreground sticky left-0 bg-muted/30 z-10 min-w-[100px]">
              Comida
            </th>
            {dates.map((date) => (
              <th
                key={date}
                className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[140px]"
              >
                {formatDateShort(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {config.mealTypes.map((mealType) => (
            <tr key={mealType} className="border-b border-border/40">
              <td className="py-3 px-3 font-medium text-sm sticky left-0 bg-muted/50 z-10">
                {MEAL_TYPE_LABELS[mealType]}
              </td>
              {dates.map((date) => {
                const key = `${date}-${mealType}`;
                const meal = mealMap.get(key);
                const isRegenerating = regeneratingKey === key;

                if (!meal) {
                  return (
                    <td
                      key={key}
                      className="py-3 px-2 text-center text-muted-foreground/50"
                    >
                      —
                    </td>
                  );
                }

                return (
                  <td
                    key={key}
                    className="py-2 px-2 align-top group hover:bg-accent/20 transition-colors"
                  >
                    <div className="space-y-1">
                      <p
                        className="text-sm font-medium leading-tight line-clamp-2"
                        title={meal.recipe.name}
                      >
                        {meal.recipe.name}
                      </p>
                      {meal.recipe.nutrition && (
                        <p className="text-xs text-muted-foreground">
                          {meal.recipe.nutrition.calories} kcal
                        </p>
                      )}
                      <div className="flex items-center gap-1 pt-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Ver receta"
                          onClick={() => onViewRecipe(meal)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Regenerar comida"
                          disabled={isRegenerating}
                          onClick={() => onRegenerateMeal(meal)}
                        >
                          {isRegenerating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-accent/30">
            <td className="py-3 px-3 font-medium text-xs text-muted-foreground sticky left-0 bg-accent/30 z-10">
              Total diario
            </td>
            {dates.map((date) => {
              const nutrition = computeDailyNutrition(meals, date);
              if (!nutrition) {
                return (
                  <td
                    key={date}
                    className="py-3 px-2 text-center text-xs text-muted-foreground/50"
                  >
                    —
                  </td>
                );
              }
              return (
                <td key={date} className="py-3 px-2 text-xs text-muted-foreground">
                  <div className="space-y-0.5 text-center">
                    <p className="font-medium text-foreground">
                      {Math.round(nutrition.calories)} kcal
                    </p>
                    <p>
                      P: {Math.round(nutrition.protein)}g · C:{" "}
                      {Math.round(nutrition.carbs)}g · G:{" "}
                      {Math.round(nutrition.fat)}g
                    </p>
                  </div>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
