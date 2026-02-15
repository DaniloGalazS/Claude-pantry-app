import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/anthropic";

export const maxDuration = 45;

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    const client = getAnthropicClient();

    // Extract base64 data and media type
    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    const mediaType = matches[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const base64Data = matches[2];

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `Analiza este ticket de compra y extrae todos los productos alimenticios que puedas identificar. Responde en formato JSON:

{
  "items": [
    {
      "name": "nombre del producto en espanol, limpio y legible",
      "quantity": numero de unidades (usa 1 si no se especifica),
      "unit": "unidad (unidades, kg, g, L, ml, paquetes, latas, botellas)"
    }
  ],
  "confidence": numero del 0 al 1 indicando tu nivel de confianza general,
  "totalItemsFound": numero total de productos encontrados
}

Reglas:
- Ignora productos no alimenticios (bolsas, productos de limpieza, etc.)
- Normaliza los nombres de productos (ej: "LECHE ENTERA 1L" -> "Leche entera")
- Si ves cantidad y peso, usa el peso como cantidad y la unidad correspondiente
- Si no es un ticket de compra o no hay productos alimenticios:

{
  "items": [],
  "confidence": 0,
  "error": "descripcion del problema"
}

Responde SOLO con el JSON, sin texto adicional.`,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: 500 }
      );
    }

    try {
      // Claude sometimes wraps JSON in markdown code blocks
      let jsonText = textContent.text.trim();
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      }
      const result = JSON.parse(jsonText);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Receipt scan API error:", error);
    return NextResponse.json(
      { error: "Failed to process receipt" },
      { status: 500 }
    );
  }
}
