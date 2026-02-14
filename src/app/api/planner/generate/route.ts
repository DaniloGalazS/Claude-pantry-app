import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/anthropic";
import type { PantryItem, MealPlanConfig, MealType } from "@/types";

interface GenerateRequest {
  pantryItems: PantryItem[];
  config: MealPlanConfig;
}

const VALID_MEAL_TYPES: MealType[] = [
  "desayuno",
  "almuerzo",
  "once",
  "cena",
  "merienda",
];

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  once: "Once",
  cena: "Cena",
  merienda: "Merienda",
};

function countDays(startDate: string, endDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function parseClaudeJSON(text: string): unknown {
  let jsonText = text.trim();
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }
  return JSON.parse(jsonText);
}

function buildPrompt(
  ingredientsList: string,
  config: MealPlanConfig,
  dates: string[],
  mealTypeLabels: string
): string {
  return `Eres un chef experto y nutricionista. Genera un plan de comidas completo.

INGREDIENTES DISPONIBLES:
${ingredientsList}

CONFIGURACION:
- Periodo: ${config.startDate} al ${config.endDate} (${dates.length} dias)
- Comidas por dia: ${mealTypeLabels}
- Porciones por comida: ${config.servings}
- Fechas exactas: ${dates.join(", ")}

REGLAS:
1. Genera exactamente una receta por tipo de comida por dia
2. Prioriza ingredientes disponibles — al menos 80% de ingredientes de cada receta deben estar disponibles
3. Varia recetas — no repetir el mismo plato en el periodo
4. Ajusta cantidades segun las porciones indicadas
5. Genera una lista de compras consolidada con los ingredientes faltantes y sus cantidades totales necesarias
6. Incluye informacion nutricional estimada por porcion para cada receta

Responde en formato JSON con esta estructura exacta:
{
  "meals": [
    {
      "date": "YYYY-MM-DD",
      "mealType": "${config.mealTypes[0]}",
      "recipe": {
        "id": "string unico",
        "name": "nombre de la receta",
        "description": "breve descripcion",
        "ingredients": [
          { "name": "ingrediente", "quantity": numero, "unit": "unidad" }
        ],
        "steps": ["paso 1", "paso 2"],
        "prepTime": numero en minutos,
        "cookTime": numero en minutos,
        "difficulty": "easy" | "medium" | "hard",
        "servings": ${config.servings},
        "cuisine": "tipo de cocina",
        "dietaryTags": [],
        "missingItems": [
          { "name": "ingrediente faltante", "quantity": numero, "unit": "unidad" }
        ],
        "availablePercentage": numero del 0 al 100,
        "nutrition": {
          "calories": numero,
          "protein": numero,
          "carbs": { "total": numero, "fiber": numero, "sugar": numero },
          "fat": { "total": numero, "saturated": numero, "unsaturated": numero },
          "sodium": numero
        }
      }
    }
  ],
  "shoppingList": [
    {
      "name": "ingrediente",
      "quantity": cantidad total necesaria,
      "unit": "unidad",
      "available": cantidad disponible en despensa,
      "toBuy": cantidad por comprar
    }
  ]
}

Los valores validos para mealType son: ${config.mealTypes.map((t) => `"${t}"`).join(", ")}
Las fechas deben ser exactamente las listadas arriba.
Responde SOLO con el JSON, sin texto adicional ni bloques de codigo markdown.`;
}

export async function POST(request: NextRequest) {
  try {
    const { pantryItems, config }: GenerateRequest = await request.json();

    // Validation
    if (!pantryItems || pantryItems.length === 0) {
      return NextResponse.json(
        { error: "Se requieren productos en la despensa" },
        { status: 400 }
      );
    }

    if (!config || !config.startDate || !config.endDate) {
      return NextResponse.json(
        { error: "Configuracion de fechas requerida" },
        { status: 400 }
      );
    }

    if (config.endDate < config.startDate) {
      return NextResponse.json(
        { error: "La fecha de fin debe ser posterior a la de inicio" },
        { status: 400 }
      );
    }

    if (
      !config.mealTypes ||
      config.mealTypes.length === 0 ||
      !config.mealTypes.every((t) => VALID_MEAL_TYPES.includes(t))
    ) {
      return NextResponse.json(
        { error: "Tipos de comida invalidos" },
        { status: 400 }
      );
    }

    const days = countDays(config.startDate, config.endDate);
    if (days > 14) {
      return NextResponse.json(
        { error: "El plan no puede superar 14 dias" },
        { status: 400 }
      );
    }

    const client = getAnthropicClient();
    const dates = getDatesInRange(config.startDate, config.endDate);
    const totalMeals = dates.length * config.mealTypes.length;

    const ingredientsList = pantryItems
      .map((item) => `- ${item.name}: ${item.quantity} ${item.unit}`)
      .join("\n");

    const mealTypeLabels = config.mealTypes
      .map((t) => MEAL_TYPE_LABELS[t])
      .join(", ");

    console.log("Generating meal plan with model:", CLAUDE_MODEL);
    console.log(
      `Plan: ${days} days, ${config.mealTypes.length} meals/day = ${totalMeals} total meals`
    );

    // For large plans (>15 meals), split into weekly chunks
    if (totalMeals > 15) {
      const chunkSize = 7;
      const allMeals: unknown[] = [];
      const shoppingMap = new Map<
        string,
        { quantity: number; unit: string; available: number; toBuy: number }
      >();

      for (let i = 0; i < dates.length; i += chunkSize) {
        const chunkDates = dates.slice(i, i + chunkSize);
        const chunkConfig = {
          ...config,
          startDate: chunkDates[0],
          endDate: chunkDates[chunkDates.length - 1],
        };

        const prompt = buildPrompt(
          ingredientsList,
          chunkConfig,
          chunkDates,
          mealTypeLabels
        );

        const response = await client.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 16000,
          messages: [{ role: "user", content: prompt }],
        });

        const textContent = response.content.find((c) => c.type === "text");
        if (!textContent || textContent.type !== "text") {
          return NextResponse.json(
            { error: "No se recibio respuesta de la IA" },
            { status: 500 }
          );
        }

        const chunkResult = parseClaudeJSON(textContent.text) as {
          meals: unknown[];
          shoppingList: {
            name: string;
            quantity: number;
            unit: string;
            available: number;
            toBuy: number;
          }[];
        };

        allMeals.push(...chunkResult.meals);

        // Merge shopping lists
        for (const item of chunkResult.shoppingList) {
          const existing = shoppingMap.get(item.name);
          if (existing) {
            existing.quantity += item.quantity;
            existing.toBuy += item.toBuy;
          } else {
            shoppingMap.set(item.name, { ...item });
          }
        }
      }

      const mergedShoppingList = Array.from(shoppingMap.entries()).map(
        ([name, data]) => ({ name, ...data })
      );

      console.log(
        "Successfully generated chunked plan:",
        allMeals.length,
        "meals"
      );
      return NextResponse.json({
        meals: allMeals,
        shoppingList: mergedShoppingList,
      });
    }

    // Single request for smaller plans
    const prompt = buildPrompt(ingredientsList, config, dates, mealTypeLabels);

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No se recibio respuesta de la IA" },
        { status: 500 }
      );
    }

    console.log("Raw response length:", textContent.text.length);

    try {
      const result = parseClaudeJSON(textContent.text) as {
        meals: unknown[];
        shoppingList: unknown[];
      };
      console.log(
        "Successfully parsed plan:",
        result.meals?.length,
        "meals,",
        result.shoppingList?.length,
        "shopping items"
      );
      return NextResponse.json(result);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error(
        "Text that failed to parse:",
        textContent.text.substring(0, 500)
      );
      return NextResponse.json(
        { error: "Error al procesar la respuesta de la IA" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Meal plan generation error:", error);
    return NextResponse.json(
      { error: "Error al generar el plan de comidas" },
      { status: 500 }
    );
  }
}
