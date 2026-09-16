"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  ShoppingBag,
  RotateCcw,
  Check,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Product, getProductByIdOrSlug } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/client";

const MetalFx = dynamic(
  () => import("metal-fx").then((m) => m.MetalFx),
  { ssr: false }
);


type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  suggestions?: string[];
  timestamp: string;
};

const INITIAL_SUGGESTIONS = [
  "Track my last order",
  "Show me new arrivals",
  "Find hoodies",
  "Products under ₹1500",
];

export default function ChatbotAssistant() {
  const pathname = usePathname();
  const { addToCart, openCart } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content: "Hey! 👋 I'm the GreenO Assistant. What are you looking for today?",
      suggestions: INITIAL_SUGGESTIONS,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [addedItemMap, setAddedItemMap] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize authenticated email on mount if missing from localStorage
  useEffect(() => {
    async function syncAuth() {
      if (typeof window === "undefined") return;
      if (!localStorage.getItem("greeno_user_email")) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user?.email) {
            localStorage.setItem("greeno_user_email", user.email.trim().toLowerCase());
          }
        } catch {}
      }
    }
    syncAuth();
  }, []);

  // Track currently viewed product if user is on /products/[slug]
  useEffect(() => {
    let isMounted = true;
    if (pathname && pathname.startsWith("/products/")) {
      const slug = pathname.replace("/products/", "").split("/")[0].split("?")[0];
      if (slug) {
        getProductByIdOrSlug(slug).then((prod) => {
          if (isMounted) setCurrentProduct(prod);
        });
      }
    } else {
      setCurrentProduct(null);
    }
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Lock body & hide mobile dock when chatbot is open on small screens
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("chatbot-open");
      // Auto-focus input on desktop
      if (typeof window !== "undefined" && window.innerWidth > 768) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    } else {
      document.body.classList.remove("chatbot-open");
    }
    return () => {
      document.body.classList.remove("chatbot-open");
    };
  }, [isOpen]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Extract all recently displayed products for conversational context
  const getContextProducts = (): Product[] => {
    const list: Product[] = [];
    const seen = new Set<string>();
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.products && Array.isArray(m.products)) {
        for (const p of m.products) {
          if (p && p.id && !seen.has(p.id)) {
            seen.add(p.id);
            list.push(p);
          }
        }
      }
    }
    return list;
  };

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const recentProducts = getContextProducts();
      const payloadMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let storedEmail =
        typeof window !== "undefined"
          ? localStorage.getItem("greeno_user_email")
          : null;

      // Auto-detect email from greeno_orders_* localStorage keys if greeno_user_email is empty
      if (!storedEmail && typeof window !== "undefined") {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith("greeno_orders_")) {
              const detected = k.replace("greeno_orders_", "").trim();
              if (detected && detected.includes("@")) {
                storedEmail = detected;
                localStorage.setItem("greeno_user_email", detected);
                break;
              }
            }
          }
        } catch {}
      }

      // Collect all orders stored in the browser (from Account page / Order history)
      const clientOrders: any[] = [];
      if (typeof window !== "undefined") {
        if (storedEmail) {
          try {
            const rawScoped = localStorage.getItem(`greeno_orders_${storedEmail.trim().toLowerCase()}`);
            if (rawScoped) {
              const list = JSON.parse(rawScoped);
              if (Array.isArray(list)) clientOrders.push(...list);
            }
          } catch {}
        }

        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith("greeno_orders_")) {
              const raw = localStorage.getItem(k);
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  for (const ord of list) {
                    if (ord?.id && !clientOrders.some((co) => co.id === ord.id)) {
                      clientOrders.push(ord);
                    }
                  }
                }
              }
            }
          }
        } catch {}

        try {
          const rawCust = localStorage.getItem("greeno_customer_orders");
          if (rawCust) {
            const list = JSON.parse(rawCust);
            if (Array.isArray(list)) {
              for (const ord of list) {
                if (ord?.id && !clientOrders.some((co) => co.id === ord.id)) {
                  clientOrders.push(ord);
                }
              }
            }
          }
        } catch {}

        try {
          const rawLast = localStorage.getItem("greeno_last_order");
          if (rawLast) {
            const last = JSON.parse(rawLast);
            if (last?.id && !clientOrders.some((co) => co.id === last.id)) {
              clientOrders.push(last);
            }
          }
        } catch {}
      }

      let lastOrderParsed: any = null;
      try {
        const rawLast =
          typeof window !== "undefined"
            ? localStorage.getItem("greeno_last_order")
            : null;
        if (rawLast) lastOrderParsed = JSON.parse(rawLast);
      } catch {}

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          currentProductId: currentProduct?.id || null,
          previousProducts: recentProducts,
          userEmail: storedEmail,
          clientOrders,
          lastOrder: lastOrderParsed,
        }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "I'm here to help you find your next statement piece.",
        products: data.products || [],
        suggestions: data.suggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Execute Cart Action if returned
      if (data.action?.type === "add_to_cart" && data.action.productId) {
        const prod =
          (data.products && data.products.find((p: Product) => p.id === data.action.productId)) ||
          (currentProduct?.id === data.action.productId ? currentProduct : null) ||
          recentProducts.find((p) => p.id === data.action.productId);

        if (prod) {
          const size = data.action.size || "M";
          addToCart(
            {
              id: prod.id,
              name: prod.name,
              price: Number(prod.price),
              image: prod.image || "/black-tee.jfif",
              size,
              color: prod.color || "BLACK",
            },
            data.action.quantity || 1
          );

          setAddedItemMap((prev) => ({ ...prev, [prod.id]: true }));
          setTimeout(() => {
            setAddedItemMap((prev) => ({ ...prev, [prod.id]: false }));
          }, 3000);
        }
      }
    } catch (err) {
      console.error("Failed to send message to GreenO assistant:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I ran into a connection glitch. Please feel free to try again!",
          suggestions: INITIAL_SUGGESTIONS,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "Hey! 👋 I'm the GreenO Assistant. What are you looking for today?",
        suggestions: INITIAL_SUGGESTIONS,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleQuickAdd = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const defaultSize =
      product.size_stock && typeof product.size_stock === "object"
        ? Object.keys(product.size_stock).find((k) => Number(product.size_stock?.[k]) > 0) || "M"
        : "M";

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image || "/black-tee.jfif",
        size: defaultSize,
        color: product.color || "BLACK",
      },
      1
    );

    setAddedItemMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemMap((prev) => ({ ...prev, [product.id]: false }));
    }, 2500);
  };

  return (
    <>
      {/* Floating Chatbot Launcher Button with Liquid Metal Chrome Effect */}
      <div className="chatbot-launcher-wrapper">
        <MetalFx
          variant="circle"
          preset="chromatic"
          theme="dark"
          innerShadow={true}
          strength={1}
          scale={1}
        >
          <button
            type="button"
            className={`chatbot-launcher ${isOpen ? "open" : ""}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close GreenO Assistant" : "Open GreenO Assistant"}
            title="GreenO Assistant"
          >
            <span className="chatbot-launcher-inner">
              {isOpen ? (
                <X size={20} color="#ffffff" strokeWidth={2.4} className="launcher-icon-close" />
              ) : (
                <Sparkles size={22} color="#ffffff" strokeWidth={2.2} className="launcher-icon-sparkle" />
              )}
            </span>
          </button>
        </MetalFx>
      </div>

      {/* Modern Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-window-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="chatbot-window"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 25, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Header */}
              <div className="chatbot-header">
                <div className="chatbot-header-left">
                  <div className="chatbot-avatar">
                    <span className="chatbot-avatar-text">GO</span>
                    <span className="chatbot-online-status" />
                  </div>
                  <div className="chatbot-title-group">
                    <div className="chatbot-title-row">
                      <span className="chatbot-title">GreenO Assistant</span>
                      <span className="chatbot-badge">CONCIERGE</span>
                    </div>
                    <span className="chatbot-subtitle">Luxury Streetwear Concierge</span>
                  </div>
                </div>

                <div className="chatbot-header-actions">
                  <button
                    type="button"
                    className="chatbot-header-btn"
                    onClick={handleResetChat}
                    title="Start fresh conversation"
                    aria-label="Restart chat"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    type="button"
                    className="chatbot-header-btn"
                    onClick={() => setIsOpen(false)}
                    title="Close Assistant"
                    aria-label="Close chat"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Product Page Context Banner */}
              {currentProduct && (
                <div className="chatbot-context-banner">
                  <span className="context-pill">ACTIVE PIECE</span>
                  <span className="context-name" title={currentProduct.name}>
                    {currentProduct.name} (₹{Number(currentProduct.price).toLocaleString("en-IN")})
                  </span>
                </div>
              )}

              {/* Messages Container */}
              <div className="chatbot-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chatbot-msg-row ${msg.role}`}>
                    {msg.role === "assistant" && (
                      <div className="chatbot-msg-avatar">
                        <span>GO</span>
                      </div>
                    )}

                    <div className="chatbot-msg-content">
                      {/* Bubble Text */}
                      <div className="chatbot-bubble">
                        <div className="chatbot-bubble-text">
                          {msg.content.split("\n").map((line, i) => (
                            <p key={i}>
                              {line.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
                                if (part.startsWith("**") && part.endsWith("**")) {
                                  return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
                                }
                                return part;
                              })}
                            </p>
                          ))}
                        </div>
                        <span className="chatbot-msg-time">{msg.timestamp}</span>
                      </div>

                      {/* Product Recommendations */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="chatbot-products-grid">
                          {msg.products.map((prod) => {
                            const isAdded = Boolean(addedItemMap[prod.id]);
                            const stockNum = prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 50;
                            const isOut = stockNum <= 0;

                            return (
                              <div key={prod.id} className="chatbot-product-card">
                                <Link
                                  href={`/products/${prod.id}?from=assistant`}
                                  className="chatbot-product-img-wrap"
                                  onClick={() => {
                                    if (typeof window !== "undefined" && window.innerWidth <= 768) {
                                      setIsOpen(false);
                                    }
                                  }}
                                >
                                  <img
                                    src={prod.image || "/black-tee.jfif"}
                                    alt={prod.name}
                                    className="chatbot-product-img"
                                  />
                                  {isOut ? (
                                    <span className="chatbot-tag-soldout">SOLD OUT</span>
                                  ) : (
                                    <span className="chatbot-tag-instock">IN STOCK</span>
                                  )}
                                </Link>

                                <div className="chatbot-product-info">
                                  <Link
                                    href={`/products/${prod.id}?from=assistant`}
                                    className="chatbot-product-title"
                                    onClick={() => {
                                      if (typeof window !== "undefined" && window.innerWidth <= 768) {
                                        setIsOpen(false);
                                      }
                                    }}
                                  >
                                    {prod.name}
                                  </Link>

                                  <div className="chatbot-product-price-row">
                                    <span className="chatbot-product-price">
                                      ₹{Number(prod.price).toLocaleString("en-IN")}
                                    </span>
                                    {prod.color && (
                                      <span className="chatbot-product-color">{prod.color}</span>
                                    )}
                                  </div>

                                  <div className="chatbot-product-actions">
                                    <Link
                                      href={`/products/${prod.id}?from=assistant`}
                                      className="chatbot-btn-view"
                                      onClick={() => {
                                        if (typeof window !== "undefined" && window.innerWidth <= 768) {
                                          setIsOpen(false);
                                        }
                                      }}
                                    >
                                      <span>VIEW</span>
                                      <ExternalLink size={11} />
                                    </Link>

                                    {!isOut && (
                                      <button
                                        type="button"
                                        className={`chatbot-btn-add ${isAdded ? "added" : ""}`}
                                        onClick={(e) => handleQuickAdd(prod, e)}
                                        aria-label={`Add ${prod.name} to cart`}
                                      >
                                        {isAdded ? (
                                          <>
                                            <Check size={12} />
                                            <span>ADDED</span>
                                          </>
                                        ) : (
                                          <>
                                            <ShoppingBag size={12} />
                                            <span>ADD</span>
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Quick Follow-up Suggestions */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="chatbot-suggestions-wrap">
                          {msg.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              className="chatbot-suggestion-pill"
                              onClick={() => handleSendMessage(sug)}
                            >
                              <span>{sug}</span>
                              <ChevronRight size={12} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="chatbot-msg-row assistant">
                    <div className="chatbot-msg-avatar">
                      <span>GO</span>
                    </div>
                    <div className="chatbot-bubble typing">
                      <div className="typing-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form
                className="chatbot-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about pieces, sizes, price..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  className="chatbot-input"
                  aria-label="Message GreenO Assistant"
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="chatbot-send-btn"
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
