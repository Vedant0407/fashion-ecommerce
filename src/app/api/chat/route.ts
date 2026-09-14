import { NextRequest, NextResponse } from "next/server";
import { getStoreProducts } from "@/lib/store-data";
import { Product, getProductByIdOrSlug } from "@/lib/catalog";
import {
  extractShoppingIntent,
  filterLiveProducts,
  generateGreenOResponse,
  ChatbotResponse,
} from "@/lib/chatbot-search";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages = [],
      currentProductId = null,
      previousProducts = [],
      userEmail = null,
      lastOrder = null,
    } = body;

    const cookieEmail = request.cookies.get("greeno_session")?.value
      ? decodeURIComponent(request.cookies.get("greeno_session")!.value).trim().toLowerCase()
      : null;

    const effectiveEmail = (userEmail ? String(userEmail).trim().toLowerCase() : null) || cookieEmail;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, message: "Messages array is required." },
        { status: 400 }
      );
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUserMessage || !lastUserMessage.content?.trim()) {
      return NextResponse.json(
        { success: false, message: "Valid user message required." },
        { status: 400 }
      );
    }

    const userText = lastUserMessage.content.trim();

    // 1. Resolve current product context if user is viewing a product page
    let currentProduct: Product | null = null;
    if (currentProductId) {
      currentProduct = await getProductByIdOrSlug(currentProductId);
    }

    // 2. Resolve previously mentioned products for conversational context ("which one is cheaper", "add the first one")
    let prevList: Product[] = [];
    if (Array.isArray(previousProducts) && previousProducts.length > 0) {
      prevList = previousProducts;
    }

    // 3. Check for external AI API Keys (Modular integration)
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const groqKey = process.env.GROQ_API_KEY?.trim();

    // If an external key is available, attempt LLM completion with live product injection
    if (geminiKey || openaiKey || groqKey) {
      try {
        const liveProducts = await getStoreProducts();
        const intent = extractShoppingIntent(userText, currentProduct, prevList);
        const filtered = await filterLiveProducts(intent);

        // Prepare verified context for LLM
        const catalogContext = filtered.slice(0, 8).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category_name,
          color: p.color,
          colors: p.colors,
          stock: p.stock,
          size_stock: p.size_stock,
          description: p.description,
          fit: p.fit,
          fabric: p.fabric,
        }));

        const systemPrompt = `You are the GreenO Assistant, a friendly and knowledgeable luxury streetwear shopping assistant for GreenO.
GreenO brand aesthetic: Minimalist, heavyweight oversized silhouettes, drop shoulders, 240+ GSM combed cotton, streetwear culture.

STRICT ACCURACY RULES:
1. NEVER hallucinate or invent products, prices, stock, or sizes.
2. Only recommend products from the provided REAL LIVE CATALOG: ${JSON.stringify(catalogContext)}.
3. Currently viewed product: ${currentProduct ? JSON.stringify({ id: currentProduct.id, name: currentProduct.name, price: currentProduct.price, size_stock: currentProduct.size_stock }) : "None"}.
4. Previously shown products: ${prevList.map((p) => p.name).join(", ") || "None"}.
5. If the user asks for an unavailable item, clearly say it's not found and suggest available alternatives.
6. Keep responses concise, helpful, and brand-aligned (2-4 sentences max).
7. If user wants to add to cart, specify action type "add_to_cart" with productId and size.

Respond with valid JSON in this exact schema:
{
  "reply": "string message to user",
  "product_ids": ["array", "of", "matching", "ids"],
  "action": null or { "type": "add_to_cart", "productId": "id", "size": "M", "quantity": 1 },
  "suggestions": ["short suggestion 1", "short suggestion 2", "short suggestion 3"]
}`;

        // Attempt Gemini API if key is present
        if (geminiKey) {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  { role: "user", parts: [{ text: systemPrompt }] },
                  ...messages.slice(-4).map((m: any) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    parts: [{ text: m.content }],
                  })),
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.2,
                },
              }),
              signal: AbortSignal.timeout(8000),
            }
          );

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              const matchedProducts = (parsed.product_ids || [])
                .map((id: string) => liveProducts.find((p) => p.id === id))
                .filter(Boolean);

              return NextResponse.json({
                success: true,
                reply: parsed.reply,
                products: matchedProducts.length > 0 ? matchedProducts : filtered.slice(0, 4),
                action: parsed.action || null,
                suggestions: parsed.suggestions || ["Show hoodies", "New in drops", "Under ₹2000"],
              });
            }
          }
        }
      } catch (llmErr) {
        console.warn("External AI call fallback to GreenO native engine:", llmErr);
      }
    }

    // 4. Default / Built-in High Performance Engine (Guaranteed 0 downtime, accurate live data)
    const nativeResponse: ChatbotResponse = await generateGreenOResponse(
      userText,
      currentProduct,
      prevList,
      {
        email: effectiveEmail,
        lastOrder,
      }
    );

    return NextResponse.json({
      success: true,
      ...nativeResponse,
    });
  } catch (err: any) {
    console.error("POST /api/chat error:", err);
    return NextResponse.json(
      {
        success: false,
        reply: "I'm having a brief moment connecting to our catalog. Please try asking again in a second!",
        products: [],
        suggestions: ["Show me new arrivals", "Find hoodies", "Products under ₹1500"],
      },
      { status: 500 }
    );
  }
}
