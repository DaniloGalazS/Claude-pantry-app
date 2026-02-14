import type { NutritionalInfo } from "@/types";

interface NutritionDisplayProps {
  nutrition: NutritionalInfo;
}

export function NutritionDisplay({ nutrition }: NutritionDisplayProps) {
  const proteinCal = nutrition.protein * 4;
  const carbsCal = nutrition.carbs.total * 4;
  const fatCal = nutrition.fat.total * 9;
  const totalMacroCal = proteinCal + carbsCal + fatCal;

  const proteinPct = totalMacroCal > 0 ? (proteinCal / totalMacroCal) * 100 : 0;
  const carbsPct = totalMacroCal > 0 ? (carbsCal / totalMacroCal) * 100 : 0;
  const fatPct = totalMacroCal > 0 ? (fatCal / totalMacroCal) * 100 : 0;

  return (
    <div className="space-y-4">
      <h4 className="font-display text-lg">Informacion nutricional</h4>

      {/* Calorie callout */}
      <div className="flex items-baseline gap-2 px-4 py-3 bg-primary/10 rounded-xl">
        <span className="text-3xl font-bold text-primary tabular-nums">
          {nutrition.calories}
        </span>
        <span className="text-sm text-muted-foreground">kcal / porcion</span>
      </div>

      {/* Macro bar */}
      <div className="h-3 rounded-full overflow-hidden flex" role="img" aria-label="Distribucion de macronutrientes">
        <div
          className="bg-blue-500 transition-all"
          style={{ width: `${proteinPct}%` }}
        />
        <div
          className="bg-amber-500 transition-all"
          style={{ width: `${carbsPct}%` }}
        />
        <div
          className="bg-rose-400 transition-all"
          style={{ width: `${fatPct}%` }}
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
          <div>
            <p className="font-medium">Proteina</p>
            <p className="text-muted-foreground tabular-nums">{nutrition.protein}g</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
          <div>
            <p className="font-medium">Carbos</p>
            <p className="text-muted-foreground tabular-nums">{nutrition.carbs.total}g</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0" />
          <div>
            <p className="font-medium">Grasa</p>
            <p className="text-muted-foreground tabular-nums">{nutrition.fat.total}g</p>
          </div>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-muted-foreground border-t border-border/40 pt-3">
        <div className="flex justify-between">
          <span>Fibra</span>
          <span className="tabular-nums">{nutrition.carbs.fiber}g</span>
        </div>
        <div className="flex justify-between">
          <span>Azucar</span>
          <span className="tabular-nums">{nutrition.carbs.sugar}g</span>
        </div>
        <div className="flex justify-between">
          <span>Grasa saturada</span>
          <span className="tabular-nums">{nutrition.fat.saturated}g</span>
        </div>
        <div className="flex justify-between">
          <span>Grasa insaturada</span>
          <span className="tabular-nums">{nutrition.fat.unsaturated}g</span>
        </div>
        <div className="flex justify-between">
          <span>Sodio</span>
          <span className="tabular-nums">{nutrition.sodium}mg</span>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground/70 italic">
        *Valores estimados por porcion. Generados por IA, pueden variar.
      </p>
    </div>
  );
}
