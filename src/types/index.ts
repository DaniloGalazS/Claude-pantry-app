import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Timestamp;
}

export interface Pantry {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: Timestamp;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // "unidades", "kg", "L", "g", etc.
  expirationDate: Timestamp | null;
  addedAt: Timestamp;
  imageUrl?: string;
  pantryId: string;
}

export interface CookedRecipe {
  id: string;
  recipeName: string;
  ingredients: RecipeIngredient[];
  cookedAt: Timestamp;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: {
    total: number;
    fiber: number;
    sugar: number;
  };
  fat: {
    total: number;
    saturated: number;
    unsaturated: number;
  };
  sodium: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  difficulty: "easy" | "medium" | "hard";
  servings: number;
  cuisine?: string;
  dietaryTags?: string[];
  missingItems: RecipeIngredient[];
  availablePercentage: number;
  nutrition?: NutritionalInfo;
}

export interface SavedRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  prepTime: number;
  cookTime: number;
  difficulty: "easy" | "medium" | "hard";
  servings: number;
  cuisine?: string;
  dietaryTags?: string[];
  nutrition?: NutritionalInfo;
  savedAt: Timestamp;
}

export interface RecipeFilters {
  maxPrepTime?: number;
  difficulty?: "easy" | "medium" | "hard";
  cuisine?: string;
  dietaryTags?: string[];
  maxMissingPercentage?: number;
}

export interface VisionIdentifyResponse {
  name: string;
  suggestedQuantity: number;
  suggestedUnit: string;
  confidence: number;
}

export interface ReceiptScanResponse {
  items: {
    name: string;
    quantity: number;
    unit: string;
  }[];
}

export type MealType = "desayuno" | "almuerzo" | "once" | "cena" | "merienda";

export interface MealPlanConfig {
  startDate: string;       // ISO date string "YYYY-MM-DD"
  endDate: string;         // ISO date string "YYYY-MM-DD"
  mealTypes: MealType[];   // tipos de comida seleccionados
  servings: number;        // porciones por comida
}

export interface PlannedMeal {
  recipe: Recipe;
  mealType: MealType;
  date: string;            // ISO date string
}

export interface MealPlan {
  id: string;
  config: MealPlanConfig;
  meals: PlannedMeal[];
  shoppingList: ShoppingListItem[];
  generatedAt: Timestamp;
}

export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  available: number;
  toBuy: number;
}
