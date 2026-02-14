import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/anthropic";
import type { PantryItem, RecipeFilters } from "@/types";

interface GenerateRequest {
  pantryItems: PantryItem[];
  filters?: RecipeFilters;
  maxMissingPercentage?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { pantryItems, filters, maxMissingPercentage = 20 }: GenerateRequest =
      await request.json();

    if (!pantryItems || pantryItems.length === 0) {
      return NextResponse.json(
        { error: "Pantry items are required" },
        { status: 400 }
      );
    }

    const client = getAnthropicClient();

    // Build the prompt
    const ingredientsList = pantryItems
      .map((item) => `- ${item.name}: ${item.quantity} ${item.unit}`)
      .join("\n");

    let filterInstructions = "";
    if (filters) {
      if (filters.maxPrepTime) {
        filterInstructions += `- Tiempo de preparacion maximo: ${filters.maxPrepTime} minutos\n`;
      }
      if (filters.difficulty) {
        const difficultyMap = { easy: "facil", medium: "media", hard: "dificil" };
        filterInstructions += `- Dificultad: ${difficultyMap[filters.difficulty]}\n`;
      }
      if (filters.cuisine) {
        filterInstructions += `- Tipo de cocina: ${filters.cuisine}\n`;
      }
      if (filters.dietaryTags && filters.dietaryTags.length > 0) {
        filterInstructions += `- Restricciones dieteticas: ${filters.dietaryTags.join(", ")}\n`;
      }
    }

    console.log("Generating recipes with model:", CLAUDE_MODEL);
    console.log("Ingredients:", ingredientsList);

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 6000,
      messages: [
        {
          role: "user",
          content: `Eres un chef experto y nutricionista. Genera 3 recetas basandote en los ingredientes disponibles.

INGREDIENTES DISPONIBLES:
${ingredientsList}

REGLAS IMPORTANTES:
1. Al menos el ${100 - maxMissingPercentage}% de los ingredientes de cada receta deben estar disponibles
2. Como maximo, el ${maxMissingPercentage}% de los ingredientes pueden faltar (para comprar)
3. Prioriza recetas que usen la mayor cantidad de ingredientes disponibles
4. Considera las cantidades disponibles al sugerir las recetas
5. Incluye informacion nutricional estimada POR PORCION para cada receta

${filterInstructions ? `FILTROS:\n${filterInstructions}` : ""}

Responde en formato JSON con la siguiente estructura:
{
  "recipes": [
    {
      "id": "string unico",
      "name": "nombre de la receta",
      "description": "breve descripcion",
      "ingredients": [
        { "name": "ingrediente", "quantity": numero, "unit": "unidad" }
      ],
      "steps": ["paso 1", "paso 2", ...],
      "prepTime": numero en minutos,
      "cookTime": numero en minutos,
      "difficulty": "easy" | "medium" | "hard",
      "servings": numero de porciones,
      "cuisine": "tipo de cocina (mexicana, italiana, etc.)",
      "dietaryTags": ["vegetariano", "sin gluten", etc.] o [],
      "missingItems": [
        { "name": "ingrediente faltante", "quantity": numero, "unit": "unidad" }
      ],
      "availablePercentage": numero del 0 al 100 indicando que porcentaje de ingredientes estan disponibles,
      "nutrition": {
        "calories": numero de kcal por porcion,
        "protein": gramos de proteina por porcion,
        "carbs": {
          "total": gramos totales de carbohidratos,
          "fiber": gramos de fibra,
          "sugar": gramos de azucar
        },
        "fat": {
          "total": gramos totales de grasa,
          "saturated": gramos de grasa saturada,
          "unsaturated": gramos de grasa insaturada
        },
        "sodium": miligramos de sodio
      }
    }
  ]
}

Responde SOLO con el JSON, sin texto adicional ni bloques de codigo markdown.`,
        },
      ],
    });

    console.log("API Response received");

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      console.error("No text content in response");
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: 500 }
      );
    }

    console.log("Raw response text:", textContent.text.substring(0, 200));

    try {
      // Clean the response - remove markdown code blocks if present
      let jsonText = textContent.text.trim();
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      }

      const result = JSON.parse(jsonText);
      console.log("Successfully parsed", result.recipes?.length, "recipes");
      return NextResponse.json(result);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Text that failed to parse:", textContent.text);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Recipe generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recipes" },
      { status: 500 }
    );
  }
}
