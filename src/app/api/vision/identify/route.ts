import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/anthropic";

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
      max_tokens: 1024,
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
              text: `Analiza esta imagen de un producto alimenticio y proporciona la siguiente informacion en formato JSON:

{
  "name": "nombre del producto en espanol",
  "suggestedQuantity": numero sugerido de cantidad,
  "suggestedUnit": "unidad sugerida (unidades, kg, g, L, ml, paquetes, latas, botellas)",
  "confidence": numero del 0 al 1 indicando tu nivel de confianza
}

Si no puedes identificar el producto o no es un alimento, responde con:
{
  "name": null,
  "suggestedQuantity": null,
  "suggestedUnit": null,
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
      const result = JSON.parse(textContent.text);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Vision API error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
