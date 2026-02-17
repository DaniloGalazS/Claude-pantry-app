type UnitGroup = "mass" | "volume";

const UNIT_CONFIG: Record<string, { group: UnitGroup; toBase: number }> = {
  // Mass → base unit: grams
  g: { group: "mass", toBase: 1 },
  kg: { group: "mass", toBase: 1000 },
  // Volume → base unit: milliliters
  ml: { group: "volume", toBase: 1 },
  l: { group: "volume", toBase: 1000 },
};

function normalizeUnitKey(unit: string): string {
  return unit.toLowerCase().trim();
}

export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const a = UNIT_CONFIG[normalizeUnitKey(unitA)];
  const b = UNIT_CONFIG[normalizeUnitKey(unitB)];
  if (!a || !b) return normalizeUnitKey(unitA) === normalizeUnitKey(unitB);
  return a.group === b.group;
}

export function normalizeQuantity(quantity: number, unit: string): { quantity: number; unit: string } {
  const config = UNIT_CONFIG[normalizeUnitKey(unit)];
  if (!config) return { quantity, unit };
  const baseUnit = config.group === "mass" ? "g" : "ml";
  return { quantity: quantity * config.toBase, unit: baseUnit };
}
