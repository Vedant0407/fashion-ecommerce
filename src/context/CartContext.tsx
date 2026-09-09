"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
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
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartProduct[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load saved cart and coupon
  useEffect(() => {
    const savedCart = localStorage.getItem("greeno_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem("greeno_cart");
      }
    }

    const savedCoupon = localStorage.getItem("greeno_coupon");
    if (savedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(savedCoupon));
      } catch {
        localStorage.removeItem("greeno_coupon");
      }
    }

    setLoaded(true);
  }, []);

  // Save cart
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("greeno_cart", JSON.stringify(cart));
    }
  }, [cart, loaded]);

  // Save coupon
  useEffect(() => {
    if (loaded) {
      if (appliedCoupon) {
        localStorage.setItem("greeno_coupon", JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem("greeno_coupon");
      }
    }
  }, [appliedCoupon, loaded]);

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
    localStorage.removeItem("greeno_cart");
    localStorage.removeItem("greeno_coupon");
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