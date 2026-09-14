import { Product } from "@/lib/catalog";
import { getStoreProducts } from "@/lib/store-data";

export type ChatAction = {
  type: "add_to_cart" | "navigate" | "view_product";
  productId?: string;
  size?: string;
  color?: string;
  quantity?: number;
  url?: string;
};

export type ChatbotResponse = {
  reply: string;
  products: Product[];
  action?: ChatAction | null;
  suggestions?: string[];
};

export type ExtractedQuery = {
  category?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  color?: string | null;
  size?: string | null;
  style?: string | null;
  isNew?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  inStockOnly?: boolean;
  sortBy?: "price_asc" | "price_desc" | "newest" | null;
  searchTerm?: string | null;
  isGeneralQuestion?: "shipping" | "return" | "contact" | "orders" | "coupons" | "categories" | null;
  isCartAction?: boolean;
  cartTarget?: {
    reference?: "first" | "second" | "third" | "this" | "that" | null;
    productNameOrId?: string | null;
    size?: string | null;
    quantity?: number;
  } | null;
  isComparative?: "cheapest" | "expensive" | "sizes" | "colors" | null;
};

/**
 * Normalizes user text for flexible NLP matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[₹,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts structured shopping intent from natural language input
 */
export function extractShoppingIntent(
  userText: string,
  currentProduct?: Product | null,
  previousProducts?: Product[]
): ExtractedQuery {
  const norm = normalizeText(userText);
  const result: ExtractedQuery = {};

  // 1. General FAQs & Brand Knowledge
  if (
    norm.includes("shipping") ||
    norm.includes("delivery") ||
    norm.includes("dispatch") ||
    norm.includes("how long to deliver") ||
    norm.includes("shipping cost")
  ) {
    result.isGeneralQuestion = "shipping";
    return result;
  }

  if (
    norm.includes("return") ||
    norm.includes("exchange") ||
    norm.includes("refund") ||
    norm.includes("replacement")
  ) {
    result.isGeneralQuestion = "return";
    return result;
  }

  if (
    norm.includes("contact") ||
    norm.includes("support") ||
    norm.includes("phone") ||
    norm.includes("email") ||
    norm.includes("help desk") ||
    norm.includes("customer care")
  ) {
    result.isGeneralQuestion = "contact";
    return result;
  }

  if (
    norm.includes("track") ||
    norm.includes("where is my order") ||
    norm.includes("order status") ||
    norm.includes("my orders")
  ) {
    result.isGeneralQuestion = "orders";
    return result;
  }

  if (
    norm.includes("coupon") ||
    norm.includes("discount code") ||
    norm.includes("promo") ||
    norm.includes("offer") ||
    norm.includes("voucher")
  ) {
    result.isGeneralQuestion = "coupons";
    return result;
  }

  if (
    norm.includes("what categories") ||
    norm.includes("list categories") ||
    norm.includes("what do you sell") ||
    norm.includes("what products do you have")
  ) {
    result.isGeneralQuestion = "categories";
    return result;
  }

  // 2. Add to Cart Actions
  const isAddCart =
    /\b(add|put|buy)\b.*?\b(to cart|in cart|to my cart|in my cart|to bag|in bag)\b/i.test(norm) ||
    norm.includes("add to cart") ||
    norm.includes("add this to cart") ||
    norm.includes("add to my cart") ||
    norm.includes("buy this") ||
    norm.includes("add that to cart") ||
    norm.includes("add this") ||
    norm.includes("add that");

  if (isAddCart) {
    result.isCartAction = true;
    let size: string | null = null;
    let qty = 1;

    // Detect size
    const sizeMatch = norm.match(/\b(xs|s|m|l|xl|xxl|extra large|large|medium|small)\b/i);
    if (sizeMatch) {
      const s = sizeMatch[1].toUpperCase();
      if (s === "EXTRA LARGE") size = "XL";
      else if (s === "LARGE") size = "L";
      else if (s === "MEDIUM") size = "M";
      else if (s === "SMALL") size = "S";
      else size = s;
    }

    // Detect quantity
    const qtyMatch = norm.match(/\b(\d+)\s*(piece|pieces|items|units)?\b/);
    if (qtyMatch && Number(qtyMatch[1]) > 0 && Number(qtyMatch[1]) <= 10) {
      qty = Number(qtyMatch[1]);
    } else if (norm.includes("two") || norm.includes("pair")) {
      qty = 2;
    } else if (norm.includes("three")) {
      qty = 3;
    }

    // Target reference
    let reference: "first" | "second" | "third" | "this" | "that" | null = null;
    if (norm.includes("first") || norm.includes("1st")) reference = "first";
    else if (norm.includes("second") || norm.includes("2nd")) reference = "second";
    else if (norm.includes("third") || norm.includes("3rd")) reference = "third";
    else if (norm.includes("this")) reference = "this";
    else if (norm.includes("that")) reference = "that";

    // Extract named item if user specified (e.g. "add urban grey hoodie to cart" -> "urban grey hoodie")
    let productNameOrId: string | null = null;
    const nameMatch = norm.match(/\b(?:add|put|buy)\s+(?:the\s+)?(.+?)\s+(?:to cart|in cart|to my cart|in my cart|to bag|in bag)\b/i);
    if (nameMatch) {
      const rawExtracted = nameMatch[1].trim();
      if (!["this", "that", "it", "first", "second", "third", "one"].includes(rawExtracted)) {
        productNameOrId = rawExtracted;
      }
    }

    result.cartTarget = {
      reference,
      productNameOrId,
      size,
      quantity: qty,
    };
    return result;
  }

  // 3. Comparative Queries
  if (
    norm.includes("cheapest") ||
    norm.includes("lowest price") ||
    norm.includes("least expensive")
  ) {
    result.isComparative = "cheapest";
    result.sortBy = "price_asc";
  } else if (
    norm.includes("most expensive") ||
    norm.includes("highest price") ||
    norm.includes("premium piece")
  ) {
    result.isComparative = "expensive";
    result.sortBy = "price_desc";
  } else if (norm.includes("which one is cheaper") || norm.includes("which is cheaper")) {
    result.isComparative = "cheapest";
    result.sortBy = "price_asc";
  }

  // 4. Categories Detection
  if (
    norm.includes("tee") ||
    norm.includes("t-shirt") ||
    norm.includes("tshirt") ||
    norm.includes("t shirt") ||
    norm.includes("tees")
  ) {
    result.category = "t-shirts";
  } else if (
    norm.includes("hoodie") ||
    norm.includes("hoodies") ||
    norm.includes("sweatshirt") ||
    norm.includes("fleece")
  ) {
    result.category = "hoodies";
  } else if (
    norm.includes("pant") ||
    norm.includes("pants") ||
    norm.includes("cargo") ||
    norm.includes("cargos") ||
    norm.includes("trouser") ||
    norm.includes("trousers")
  ) {
    result.category = "pants";
  } else if (
    norm.includes("cap") ||
    norm.includes("caps") ||
    norm.includes("hat") ||
    norm.includes("hats") ||
    norm.includes("beanie")
  ) {
    result.category = "caps";
  } else if (
    norm.includes("bag") ||
    norm.includes("bags") ||
    norm.includes("tote") ||
    norm.includes("crossbody")
  ) {
    result.category = "bags";
  } else if (
    norm.includes("accessories") ||
    norm.includes("accessory") ||
    norm.includes("chain") ||
    norm.includes("chains") ||
    norm.includes("jewelry") ||
    norm.includes("sock")
  ) {
    result.category = "accessories";
  }

  // 5. Price Extraction (Natural Language Variations)
  // "under 1500", "below 1500", "less than 1500", "under ₹2000", "< 1500", "max 1500"
  const underMatch = norm.match(
    /(?:under|below|less than|within|max|budget of|maximum|<=?)\s*(\d{3,6})/i
  );
  if (underMatch) {
    result.maxPrice = Number(underMatch[1]);
  }

  // "above 2000", "more than 1500", "starting from 1000", "min 1000", ">= 1000"
  const aboveMatch = norm.match(
    /(?:above|more than|over|greater than|starting from|min|minimum|>=?)\s*(\d{3,6})/i
  );
  if (aboveMatch) {
    result.minPrice = Number(aboveMatch[1]);
  }

  // "between 1000 and 2500", "1000 to 2500"
  const betweenMatch = norm.match(/(\d{3,6})\s*(?:to|and|-)\s*(\d{3,6})/i);
  if (betweenMatch) {
    const p1 = Number(betweenMatch[1]);
    const p2 = Number(betweenMatch[2]);
    result.minPrice = Math.min(p1, p2);
    result.maxPrice = Math.max(p1, p2);
  }

  // "around 1500", "approx 2000"
  const aroundMatch = norm.match(/(?:around|approx|approximately|about)\s*(\d{3,6})/i);
  if (aroundMatch && !result.maxPrice) {
    const center = Number(aroundMatch[1]);
    result.minPrice = Math.max(0, center - 500);
    result.maxPrice = center + 500;
  }

  // 6. Colors Detection
  const colorMatches = norm.match(/\b(black|white|grey|gray|green|beige|brown|blue|red|charcoal|olive|pink|purple|orange|yellow|navy)\b/i);
  if (colorMatches) {
    let col = colorMatches[1].toUpperCase();
    if (col === "GRAY") col = "GREY";
    result.color = col;
  }

  // 7. Size Detection
  const sizeMatches = norm.match(/\b(xs|s|m|l|xl|xxl|extra large|large|medium|small)\b/i);
  if (sizeMatches) {
    const s = sizeMatches[1].toUpperCase();
    if (s === "EXTRA LARGE") result.size = "XL";
    else if (s === "LARGE") result.size = "L";
    else if (s === "MEDIUM") result.size = "M";
    else if (s === "SMALL") result.size = "S";
    else result.size = s;
  }

  // 8. Style & Fabric Keywords
  if (norm.includes("oversized") || norm.includes("baggy") || norm.includes("relaxed") || norm.includes("box fit")) {
    result.style = "oversized";
  } else if (norm.includes("heavyweight") || norm.includes("cotton") || norm.includes("fleece")) {
    result.style = "heavyweight";
  }

  // 9. Drop / Collection Tags
  if (norm.includes("new in") || norm.includes("new arrivals") || norm.includes("latest drop") || norm.includes("new drop")) {
    result.isNew = true;
  }
  if (norm.includes("trending") || norm.includes("popular") || norm.includes("bestseller") || norm.includes("hot")) {
    result.isTrending = true;
  }
  if (norm.includes("featured") || norm.includes("exclusive") || norm.includes("curated")) {
    result.isFeatured = true;
  }

  // 10. General search terms (stripping keywords already matched)
  result.searchTerm = norm
    .replace(/\b(show me|find|search for|do you have|i want|looking for|i need|products|clothes|streetwear|items|pieces|under|below|less than|above|more than|\d{3,6})\b/g, "")
    .trim();

  return result;
}

/**
 * Filters the LIVE product catalog using multi-condition rules
 */
export async function filterLiveProducts(intent: ExtractedQuery): Promise<Product[]> {
  const all = await getStoreProducts(true);

  let filtered = all.filter((p) => {
    if (!p || !p.id) return false;

    // 1. Stock / Availability: Must be available if stock check needed
    const totalStock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 50;
    if (intent.inStockOnly && totalStock <= 0) return false;

    // 2. Category match
    if (intent.category) {
      const c = intent.category.toLowerCase();
      const pCatSlug = (p.category_slug || "").toLowerCase();
      const pCatName = (p.category_name || "").toLowerCase();
      const pId = p.id.toLowerCase();
      const pName = p.name.toLowerCase();

      const catMatches =
        pCatSlug === c ||
        pCatName.includes(c) ||
        (c === "t-shirts" && (pId.includes("tee") || pName.includes("tee") || pCatSlug.includes("tee"))) ||
        (c === "hoodies" && (pId.includes("hoodie") || pName.includes("hoodie") || pCatSlug.includes("hoodie"))) ||
        (c === "pants" && (pId.includes("pant") || pName.includes("pant") || pId.includes("cargo") || pName.includes("cargo"))) ||
        (c === "caps" && (pId.includes("cap") || pName.includes("cap") || pId.includes("hat"))) ||
        (c === "bags" && (pId.includes("bag") || pName.includes("bag"))) ||
        (c === "accessories" && (pId.includes("chain") || pName.includes("chain") || pCatSlug.includes("accessories")));

      if (!catMatches) return false;
    }

    // 3. Price constraint (min & max)
    const price = Number(p.price) || 0;
    if (intent.maxPrice !== null && intent.maxPrice !== undefined && price > intent.maxPrice) {
      return false;
    }
    if (intent.minPrice !== null && intent.minPrice !== undefined && price < intent.minPrice) {
      return false;
    }

    // 4. Color match
    if (intent.color) {
      const reqCol = intent.color.toUpperCase();
      const pCol = (p.color || "").toUpperCase();
      const pCols = Array.isArray(p.colors) ? p.colors.map((c) => c.toUpperCase()) : [];
      const pName = p.name.toUpperCase();
      const hasColor = pCol === reqCol || pCols.includes(reqCol) || pName.includes(reqCol);
      if (!hasColor) return false;
    }

    // 5. Size match (verifying size stock if size_stock object exists)
    if (intent.size) {
      const reqSize = intent.size.toUpperCase();
      if (p.size_stock && typeof p.size_stock === "object") {
        const sizeQty = p.size_stock[reqSize];
        if (sizeQty !== undefined && Number(sizeQty) <= 0) {
          return false;
        }
      }
    }

    // 6. Style keyword match (e.g. "oversized", "heavyweight")
    if (intent.style) {
      const s = intent.style.toLowerCase();
      const searchable = `${p.name} ${p.description || ""} ${p.fit || ""} ${p.fabric || ""}`.toLowerCase();
      if (!searchable.includes(s)) return false;
    }

    // 7. Drop tags
    if (intent.isNew && !p.is_new) return false;
    if (intent.isTrending && !p.is_trending) return false;
    if (intent.isFeatured && !p.is_featured) return false;

    // 8. Specific Search Term Keywords (ensures no hallucination on nonexistent items like "tuxedo")
    if (intent.searchTerm && intent.searchTerm.length > 0) {
      const stopWords = new Set([
        // fillers, grammar & verbs
        "show", "me", "find", "search", "for", "do", "you", "have", "i", "want",
        "looking", "need", "products", "clothes", "streetwear", "items", "pieces",
        "the", "a", "an", "in", "with", "under", "below", "above", "over", "around",
        "of", "to", "is", "are", "any", "something", "can", "get", "give", "display",
        "what", "which", "how", "much", "our", "all", "some", "please", "my", "your",
        "this", "that", "these", "those", "one", "ones", "available", "stock", "buy",
        // comparatives & superlatives
        "cheapest", "cheaper", "expensive", "best", "least", "lowest", "highest",
        "affordable", "price", "cost", "budget", "rate",
        // categories & synonyms
        "tee", "tees", "tshirt", "tshirts", "t-shirt", "t-shirts", "shirt", "shirts",
        "hoodie", "hoodies", "sweatshirt", "sweatshirts", "fleece",
        "pant", "pants", "cargo", "cargos", "trouser", "trousers",
        "cap", "caps", "hat", "hats", "beanie", "beanies",
        "bag", "bags", "tote", "totes", "crossbody",
        "accessory", "accessories", "chain", "chains", "jewelry", "sock", "socks",
        // colors
        "black", "white", "grey", "gray", "green", "blue", "red", "charcoal",
        "olive", "navy", "pink", "purple", "orange", "yellow", "beige", "brown",
        // sizes
        "xs", "small", "medium", "large", "xl", "xxl", "extra",
        // styles & fits
        "oversized", "baggy", "relaxed", "heavyweight", "knit", "cotton", "fit",
        "trending", "featured", "drop", "collection", "new", "curated", "exclusive"
      ]);

      const queryWords = intent.searchTerm
        .split(/\s+/)
        .map((w) => w.replace(/[^a-z0-9]/g, "").trim())
        .filter((w) => w.length > 1 && !stopWords.has(w));

      if (queryWords.length > 0) {
        const searchableText = `${p.name} ${p.description || ""} ${p.category_name || ""} ${p.category_slug || ""} ${p.color || ""}`.toLowerCase();
        const matchesAll = queryWords.every((w) => searchableText.includes(w));
        if (!matchesAll) return false;
      }
    }

    return true;
  });

  // Sorting
  if (intent.sortBy === "price_asc") {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (intent.sortBy === "price_desc") {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
  }

  return filtered;
}

/**
 * Built-in GreenO Natural Language Shopping Engine
 * Acts as the authoritative response generator using real live product data.
 */
export async function generateGreenOResponse(
  userText: string,
  currentProduct?: Product | null,
  previousProducts?: Product[]
): Promise<ChatbotResponse> {
  const intent = extractShoppingIntent(userText, currentProduct, previousProducts);

  // 1. General FAQ Answers
  if (intent.isGeneralQuestion === "shipping") {
    return {
      reply:
        "We offer **complimentary express shipping** on all orders above ₹5,000 across India! For orders below ₹5,000, standard express delivery is flat ₹199. Orders placed before 4 PM are dispatched within 24 hours.",
      products: [],
      suggestions: ["Show me new arrivals", "Find hoodies under ₹3000", "What is your return policy?"],
    };
  }

  if (intent.isGeneralQuestion === "return") {
    return {
      reply:
        "GreenO provides a **7-day hassle-free return and exchange policy** on all delivered pieces, provided the garments are unworn and retain original security tags. You can initiate a return directly from your [Orders](/account/orders) page.",
      products: [],
      suggestions: ["Track my order", "Show me hoodies", "Explore T-shirts"],
    };
  }

  if (intent.isGeneralQuestion === "contact") {
    return {
      reply:
        "You can reach our GreenO Concierge team anytime via email at **concierge@greeno.in** or call/WhatsApp at **+91 98765 43210** (Monday – Saturday, 10 AM to 7 PM IST).",
      products: [],
      suggestions: ["View collections", "Show me new arrivals", "Check coupons"],
    };
  }

  if (intent.isGeneralQuestion === "orders") {
    return {
      reply:
        "You can view and track all your active orders, real-time dispatch progress, and delivery timelines directly in your [Order History](/account/orders).",
      products: [],
      suggestions: ["View my orders", "Show me hoodies", "Trending drops"],
    };
  }

  if (intent.isGeneralQuestion === "coupons") {
    return {
      reply:
        "Here are our active discount codes you can apply at checkout:\n• **GREENO10**: 10% off your entire order (min. ₹1,000)\n• **WELCOME15**: 15% off first order (min. ₹1,500)\n• **STREET500**: ₹500 flat off (min. ₹2,500)\n• **FREESHIP**: Complimentary express shipping",
      products: [],
      suggestions: ["Show me oversized tees", "Find hoodies", "Products under ₹1500"],
    };
  }

  if (intent.isGeneralQuestion === "categories") {
    return {
      reply:
        "GreenO features signature streetwear across 6 curated categories:\n1. **T-Shirts** (Oversized & Heavyweight 240+ GSM)\n2. **Hoodies** (Fleece & Boxy Street Drops)\n3. **Pants & Cargos** (Utility Tailoring)\n4. **Caps & Headwear** (Structured Vintage 6-Panels)\n5. **Utility Bags** (Crossbodies & Modular Totes)\n6. **Accessories** (Stainless Steel Chains & Socks)",
      products: [],
      suggestions: ["Show me T-Shirts", "Show me Hoodies", "Show me Cargos", "Products under ₹2000"],
    };
  }

  // 2. Add to Cart Actions
  if (intent.isCartAction) {
    let targetProduct: Product | null = null;
    const allStore = await getStoreProducts(true);

    // If user specified a product name (e.g. "add urban grey hoodie to cart")
    if (intent.cartTarget?.productNameOrId) {
      const targetQuery = intent.cartTarget.productNameOrId.toLowerCase();
      targetProduct =
        allStore.find((p) => {
          const pName = p.name.toLowerCase();
          const pId = p.id.toLowerCase();
          return (
            pName.includes(targetQuery) ||
            targetQuery.includes(pName) ||
            pId.includes(targetQuery.replace(/\s+/g, "-")) ||
            targetQuery.split(/\s+/).every((w) => pName.includes(w) || pId.includes(w))
          );
        }) || null;
    }

    // Check if user refers to currently viewed product
    if (!targetProduct) {
      if (intent.cartTarget?.reference === "this" && currentProduct) {
        targetProduct = currentProduct;
      } else if (intent.cartTarget?.reference === "first" && previousProducts && previousProducts.length > 0) {
        targetProduct = previousProducts[0];
      } else if (intent.cartTarget?.reference === "second" && previousProducts && previousProducts.length > 1) {
        targetProduct = previousProducts[1];
      } else if (intent.cartTarget?.reference === "third" && previousProducts && previousProducts.length > 2) {
        targetProduct = previousProducts[2];
      } else if (currentProduct) {
        targetProduct = currentProduct;
      } else if (previousProducts && previousProducts.length > 0) {
        targetProduct = previousProducts[0];
      }
    }

    if (targetProduct) {
      const selectedSize = intent.cartTarget?.size || "M";
      const totalStock = targetProduct.stock !== undefined && targetProduct.stock !== null ? Number(targetProduct.stock) : 50;

      // Validate stock
      if (totalStock <= 0) {
        return {
          reply: `Sorry, **${targetProduct.name}** is currently out of stock. Would you like me to recommend similar pieces in your size?`,
          products: [],
          suggestions: ["Show similar pieces", "Find other hoodies", "New in drops"],
        };
      }

      // Validate size stock if tracked
      if (targetProduct.size_stock && typeof targetProduct.size_stock === "object") {
        const sizeStock = targetProduct.size_stock[selectedSize];
        if (sizeStock !== undefined && Number(sizeStock) <= 0) {
          const availableSizes = Object.entries(targetProduct.size_stock)
            .filter(([_, qty]) => Number(qty) > 0)
            .map(([s]) => s);
          return {
            reply: `Size **${selectedSize}** for **${targetProduct.name}** is currently out of stock. Available sizes are: ${availableSizes.join(", ") || "None"}.`,
            products: [targetProduct],
            suggestions: availableSizes.map((s) => `Add in size ${s}`),
          };
        }
      }

      return {
        reply: `Added **${targetProduct.name}** (Size: ${selectedSize}) to your bag for ₹${Number(targetProduct.price).toLocaleString("en-IN")}.`,
        products: [targetProduct],
        action: {
          type: "add_to_cart",
          productId: targetProduct.id,
          size: selectedSize,
          color: targetProduct.color || "BLACK",
          quantity: intent.cartTarget?.quantity || 1,
        },
        suggestions: ["View my cart", "Show more like this", "Checkout"],
      };
    } else {
      return {
        reply: "Which item would you like to add to your cart? Please specify the product name or click 'Add to Cart' on any piece below.",
        products: [],
        suggestions: ["Show me new arrivals", "Find hoodies", "Oversized tees"],
      };
    }
  }

  // 3. Product Page Context Questions (e.g. "Is this available in XL?", "What material is this?")
  const lowerNorm = normalizeText(userText);
  if (
    currentProduct &&
    (lowerNorm.includes("is this available") ||
      lowerNorm.includes("do you have this") ||
      lowerNorm.includes("what material") ||
      lowerNorm.includes("fabric") ||
      lowerNorm.includes("how much is this") ||
      lowerNorm.includes("price of this") ||
      (lowerNorm.includes("in xl") && !intent.category) ||
      (lowerNorm.includes("in s") && !intent.category) ||
      (lowerNorm.includes("in m") && !intent.category) ||
      (lowerNorm.includes("in l") && !intent.category))
  ) {
    const requestedSize = intent.size || (lowerNorm.includes("xl") ? "XL" : lowerNorm.includes("large") ? "L" : lowerNorm.includes("small") ? "S" : null);

    if (requestedSize) {
      let isSizeAvailable = true;
      if (currentProduct.size_stock && typeof currentProduct.size_stock === "object") {
        const sizeQty = currentProduct.size_stock[requestedSize];
        if (sizeQty !== undefined && Number(sizeQty) <= 0) {
          isSizeAvailable = false;
        }
      }

      if (isSizeAvailable) {
        return {
          reply: `Yes, the **${currentProduct.name}** is currently in stock in size **${requestedSize}** at ₹${Number(currentProduct.price).toLocaleString("en-IN")}. Would you like me to add it to your bag?`,
          products: [currentProduct],
          suggestions: [`Add this in ${requestedSize}`, "Show size chart", "View cart"],
        };
      } else {
        const availableSizes = currentProduct.size_stock
          ? Object.entries(currentProduct.size_stock)
              .filter(([_, q]) => Number(q) > 0)
              .map(([s]) => s)
          : [];
        return {
          reply: `Size **${requestedSize}** for **${currentProduct.name}** is currently sold out. Available sizes are: ${availableSizes.join(", ") || "None"}.`,
          products: [currentProduct],
          suggestions: availableSizes.map((s) => `Add in size ${s}`),
        };
      }
    }

    if (lowerNorm.includes("material") || lowerNorm.includes("fabric") || lowerNorm.includes("fit")) {
      return {
        reply: `**${currentProduct.name}** is made of **${currentProduct.material || "100% Combed Cotton"}** (${currentProduct.fabric || "Heavyweight Knit"}), cut in a **${currentProduct.fit || "Relaxed Oversized Fit"}**.`,
        products: [currentProduct],
        suggestions: ["Add this to cart", "Check available sizes", "View similar pieces"],
      };
    }

    return {
      reply: `The **${currentProduct.name}** is available for **₹${Number(currentProduct.price).toLocaleString("en-IN")}**. Total stock available: ${currentProduct.stock ?? 50} units.`,
      products: [currentProduct],
      suggestions: ["Add this to cart", "Check sizes", "Show more hoodies"],
    };
  }

  // 4. Filter live catalog products
  let matchingProducts = await filterLiveProducts(intent);

  // If user asks comparative question like "which one is cheaper" on previously displayed products
  if (intent.isComparative && (!intent.category && !intent.color) && previousProducts && previousProducts.length > 1) {
    matchingProducts = [...previousProducts];
    if (intent.isComparative === "cheapest") {
      matchingProducts.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (intent.isComparative === "expensive") {
      matchingProducts.sort((a, b) => Number(b.price) - Number(a.price));
    }
  }

  // 5. Build friendly, intelligent responses based on matches
  if (matchingProducts.length === 0) {
    const allStore = await getStoreProducts();
    const suggested = allStore.slice(0, 3);

    let reason = "I couldn't find any products matching those exact specifications.";
    if (intent.maxPrice) {
      reason = `We currently don't have pieces under ₹${intent.maxPrice.toLocaleString("en-IN")} matching your criteria.`;
    } else if (intent.category && intent.color) {
      reason = `We don't currently have ${intent.color.toLowerCase()} ${intent.category.toLowerCase()} in stock.`;
    }

    return {
      reply: `${reason} Here are some of our popular statement pieces you might love:`,
      products: suggested,
      suggestions: ["Show me new arrivals", "Find hoodies", "Products under ₹2500", "Show all T-Shirts"],
    };
  }

  // 6. Natural Language Response Crafting with live data
  let replyIntro = "Here are the pieces matching your request:";

  if (intent.isComparative === "cheapest") {
    const cheapest = matchingProducts[0];
    replyIntro = `The most affordable option is **${cheapest.name}** at **₹${Number(cheapest.price).toLocaleString("en-IN")}**:`;
  } else if (intent.category && intent.maxPrice && intent.color) {
    replyIntro = `Found ${matchingProducts.length} ${intent.color.toLowerCase()} ${intent.category.toLowerCase()} under ₹${intent.maxPrice.toLocaleString("en-IN")}:`;
  } else if (intent.category && intent.maxPrice) {
    replyIntro = `Found ${matchingProducts.length} ${intent.category.toLowerCase()} under ₹${intent.maxPrice.toLocaleString("en-IN")}:`;
  } else if (intent.category && intent.color) {
    replyIntro = `Here are our ${intent.color.toLowerCase()} ${intent.category.toLowerCase()}:`;
  } else if (intent.category) {
    replyIntro = `Here are our latest ${intent.category.toLowerCase()}:`;
  } else if (intent.maxPrice) {
    replyIntro = `Here are our top pieces under ₹${intent.maxPrice.toLocaleString("en-IN")}:`;
  } else if (intent.isNew) {
    replyIntro = `Check out our newest drops:`;
  } else if (intent.isTrending) {
    replyIntro = `Here are the currently trending GreenO pieces:`;
  }

  // Cap product cards to top 4 for a clean chat UI
  const displayProducts = matchingProducts.slice(0, 4);

  return {
    reply: replyIntro,
    products: displayProducts,
    suggestions: [
      displayProducts[0] ? `Add ${displayProducts[0].name.slice(0, 18)}... to cart` : "View cart",
      "Which one is cheaper?",
      "Products under ₹2000",
      "Show me new arrivals",
    ],
  };
}
