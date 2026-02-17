import { normalizeQuantity, areUnitsCompatible } from "@/lib/unitConversion";
import type { RecipeIngredient, PantryItem } from "@/types";

/**
 * Agrega cantidades de pantryItems con el mismo nombre (case-insensitive),
 * normalizando unidades compatibles a su unidad base.
 */
function aggregatePantryItems(
  pantryItems: PantryItem[]
): Map<string, { quantity: number; unit: string }> {
  const aggregated = new Map<string, { quantity: number; unit: string }>();

  for (const item of pantryItems) {
    const key = item.name.toLowerCase();
    const normalized = normalizeQuantity(item.quantity, item.unit);
    const existing = aggregated.get(key);

    if (existing && areUnitsCompatible(existing.unit, normalized.unit)) {
      existing.quantity += normalized.quantity;
    } else if (!existing) {
      aggregated.set(key, { ...normalized });
    }
    // If units are incompatible with existing entry, we keep the first one
    // (edge case: same product with incompatible units)
  }

  return aggregated;
}

export function calculateAvailability(
  ingredients: RecipeIngredient[],
  pantryItems: PantryItem[]
): { missingItems: RecipeIngredient[]; availablePercentage: number } {
  const pantryMap = aggregatePantryItems(pantryItems);
  const missing: RecipeIngredient[] = [];

  for (const ing of ingredients) {
    const key = ing.name.toLowerCase();
    const pantryEntry = pantryMap.get(key);

    if (!pantryEntry) {
      missing.push(ing);
      continue;
    }

    if (areUnitsCompatible(pantryEntry.unit, ing.unit)) {
      const normalizedIng = normalizeQuantity(ing.quantity, ing.unit);
      if (pantryEntry.quantity < normalizedIng.quantity) {
        missing.push(ing);
      }
    } else {
      // Incompatible units → can't compare, mark as missing
      missing.push(ing);
    }
  }

  const total = ingredients.length;
  const available = total - missing.length;
  return {
    missingItems: missing,
    availablePercentage: total > 0 ? Math.round((available / total) * 100) : 0,
  };
}
