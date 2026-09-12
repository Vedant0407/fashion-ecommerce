"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
};

export type AppliedCoupon = {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  description: string;
  discountAmount: number;
};

type CartContextType = {
  cart: CartProduct[];
  addToCart: (
    product: Omit<CartProduct, "quantity">,
    quantity?: number
  ) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

function getCartStorageKey(email: string | null): string {
  if (!email || !email.trim() || !email.includes("@")) {
    return "greeno_cart_guest";
  }
  return `greeno_cart_${email.trim().toLowerCase()}`;
}

function getCouponStorageKey(email: string | null): string {
  if (!email || !email.trim() || !email.includes("@")) {
    return "greeno_coupon_guest";
  }
  return `greeno_coupon_${email.trim().toLowerCase()}`;
}

function getCurrentUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("greeno_user_email");
    if (stored && stored.trim().includes("@")) {
      return stored.trim().toLowerCase();
    }
  } catch {
    // Ignore
  }
  return null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartProduct[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const activeEmailRef = useRef<string | null>(null);
  const isLoadedRef = useRef(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  // Global open/close cart events
  useEffect(() => {
    const handleOpen = () => setIsCartOpen(true);
    const handleClose = () => setIsCartOpen(false);
    window.addEventListener("greeno_open_cart", handleOpen);
    window.addEventListener("greeno_close_cart", handleClose);
    return () => {
      window.removeEventListener("greeno_open_cart", handleOpen);
      window.removeEventListener("greeno_close_cart", handleClose);
    };
  }, []);

  // Sync cart state to backend persistent storage
  const syncToServer = async (
    email: string | null,
    cartList: CartProduct[],
    coupon: AppliedCoupon | null
  ) => {
    if (!email || !email.includes("@")) return;
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cart: cartList, coupon }),
      });
    } catch (err) {
      console.warn("Notice: Cart server sync error:", err);
    }
  };

  // Load cart for a specific user email
  const loadCartForAccount = async (email: string | null) => {
    activeEmailRef.current = email;
    setActiveEmail(email);

    const cartKey = getCartStorageKey(email);
    const couponKey = getCouponStorageKey(email);

    let items: CartProduct[] = [];
    let savedCouponObj: AppliedCoupon | null = null;

    try {
      const saved = localStorage.getItem(cartKey);
      if (saved) {
        items = JSON.parse(saved);
      } else {
        // Migration: If user previously had an un-scoped legacy greeno_cart
        const legacy = localStorage.getItem("greeno_cart");
        if (legacy) {
          try {
            const parsedLegacy = JSON.parse(legacy);
            if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
              items = parsedLegacy;
              localStorage.setItem(cartKey, JSON.stringify(items));
            }
          } catch {}
          localStorage.removeItem("greeno_cart");
        } else if (email) {
          // If guest added items before logging in, transfer them to this account
          const guestCart = localStorage.getItem("greeno_cart_guest");
          if (guestCart) {
            try {
              const parsedGuest = JSON.parse(guestCart);
              if (Array.isArray(parsedGuest) && parsedGuest.length > 0) {
                items = parsedGuest;
                localStorage.setItem(cartKey, JSON.stringify(items));
                localStorage.removeItem("greeno_cart_guest");
              }
            } catch {}
          }
        }
      }
    } catch {
      items = [];
    }

    try {
      const savedCoupon = localStorage.getItem(couponKey);
      if (savedCoupon) {
        savedCouponObj = JSON.parse(savedCoupon);
      }
    } catch {
      savedCouponObj = null;
    }

    setCart(Array.isArray(items) ? items : []);
    setAppliedCoupon(savedCouponObj);
    isLoadedRef.current = true;

    // Cross-device backend synchronization for logged in accounts
    if (email && email.includes("@")) {
      try {
        const res = await fetch(`/api/cart?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.cart) && data.cart.length > 0 && items.length === 0) {
            setCart(data.cart);
            localStorage.setItem(cartKey, JSON.stringify(data.cart));
            if (data.coupon) {
              setAppliedCoupon(data.coupon);
              localStorage.setItem(couponKey, JSON.stringify(data.coupon));
            }
          } else if (items.length > 0) {
            syncToServer(email, items, savedCouponObj);
          }
        }
      } catch (err) {
        console.warn("Notice: Cart server fetch error:", err);
      }
    }
  };

  // On mount: initialize for current user and listen to account switches
  useEffect(() => {
    const initialEmail = getCurrentUserEmail();
    loadCartForAccount(initialEmail);

    const handleAccountChange = () => {
      const current = getCurrentUserEmail();
      if (current !== activeEmailRef.current) {
        loadCartForAccount(current);
      }
    };

    window.addEventListener("storage", handleAccountChange);
    window.addEventListener("greeno_auth_change", handleAccountChange);
    window.addEventListener("greeno_account_switched", handleAccountChange);

    return () => {
      window.removeEventListener("storage", handleAccountChange);
      window.removeEventListener("greeno_auth_change", handleAccountChange);
      window.removeEventListener("greeno_account_switched", handleAccountChange);
    };
  }, []);

  // Save cart changes
  useEffect(() => {
    if (!isLoadedRef.current) return;
    const currentEmail = activeEmailRef.current;
    const cartKey = getCartStorageKey(currentEmail);
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch {}
    if (currentEmail) {
      syncToServer(currentEmail, cart, appliedCoupon);
    }
  }, [cart]);

  // Save coupon changes
  useEffect(() => {
    if (!isLoadedRef.current) return;
    const currentEmail = activeEmailRef.current;
    const couponKey = getCouponStorageKey(currentEmail);
    try {
      if (appliedCoupon) {
        localStorage.setItem(couponKey, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(couponKey);
      }
    } catch {}
    if (currentEmail) {
      syncToServer(currentEmail, cart, appliedCoupon);
    }
  }, [appliedCoupon]);

  const addToCart = (
    product: Omit<CartProduct, "quantity">,
    quantity = 1
  ) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) =>
          item.id === product.id &&
          item.size === product.size &&
          item.color === product.color
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id &&
          item.size === product.size &&
          item.color === product.color
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    const currentEmail = activeEmailRef.current;
    const cartKey = getCartStorageKey(currentEmail);
    const couponKey = getCouponStorageKey(currentEmail);
    try {
      localStorage.removeItem(cartKey);
      localStorage.removeItem(couponKey);
      localStorage.removeItem("greeno_cart");
      localStorage.removeItem("greeno_coupon");
    } catch {}
    if (currentEmail) {
      syncToServer(currentEmail, [], null);
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const rawShipping = subtotal > 5000 || subtotal === 0 ? 0 : 199;
  const isFreeShippingCoupon = appliedCoupon?.type === "free_shipping";
  const shipping = isFreeShippingCoupon ? 0 : rawShipping;

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      discount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else if (appliedCoupon.type === "fixed") {
      discount = Math.min(subtotal, appliedCoupon.value);
    } else if (appliedCoupon.type === "free_shipping") {
      discount = rawShipping;
    }
  }

  const total = Math.max(0, subtotal + shipping - (isFreeShippingCoupon ? 0 : discount));

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });

      const data = await res.json();
      if (!data.success) {
        return { success: false, message: data.message || "Invalid coupon" };
      }

      setAppliedCoupon(data.coupon);
      return { success: true, message: `Coupon "${code.toUpperCase()}" applied!` };
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to apply coupon" };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const cartCount = cart.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
        shipping,
        discount,
        total,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}