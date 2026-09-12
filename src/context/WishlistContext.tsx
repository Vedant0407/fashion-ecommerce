"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string | null;
};

type WishlistContextType = {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  wishlistCount: number;
};

function getStorageKey(email: string | null): string {
  if (!email || !email.trim() || !email.includes("@")) {
    return "greeno_wishlist_guest";
  }
  return `greeno_wishlist_${email.trim().toLowerCase()}`;
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

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const activeEmailRef = useRef<string | null>(null);
  const isLoadedRef = useRef(false);

  // Sync wishlist state to backend persistent storage
  const syncToServer = async (email: string | null, list: WishlistItem[]) => {
    if (!email || !email.includes("@")) return;
    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, wishlist: list }),
      });
    } catch (err) {
      console.warn("Notice: Wishlist server sync:", err);
    }
  };

  // Load wishlist for a specific user email
  const loadWishlistForAccount = async (email: string | null) => {
    activeEmailRef.current = email;
    setActiveEmail(email);

    const key = getStorageKey(email);
    let items: WishlistItem[] = [];

    // 1. Read from localStorage scoped to this account
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        items = JSON.parse(saved);
      } else {
        // One-time migration for legacy un-scoped wishlist
        const legacy = localStorage.getItem("greeno_wishlist");
        if (legacy) {
          try {
            const parsedLegacy = JSON.parse(legacy);
            if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
              items = parsedLegacy;
              localStorage.setItem(key, JSON.stringify(items));
            }
          } catch {}
          localStorage.removeItem("greeno_wishlist");
        }
      }
    } catch {
      items = [];
    }

    setWishlist(Array.isArray(items) ? items : []);
    isLoadedRef.current = true;

    // 2. Fetch from backend to ensure cross-device permanence for logged in accounts
    if (email && email.includes("@")) {
      try {
        const res = await fetch(`/api/wishlist?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.wishlist)) {
          // If server has items, take server list (or merge unique)
          if (data.wishlist.length > 0 && items.length === 0) {
            setWishlist(data.wishlist);
            localStorage.setItem(key, JSON.stringify(data.wishlist));
          } else if (items.length > 0) {
            // Keep server updated with latest local
            syncToServer(email, items);
          }
        }
      } catch (err) {
        console.warn("Notice: wishlist load error:", err);
      }
    }
  };

  // On mount: initialize for current user and listen to account switches
  useEffect(() => {
    const initialEmail = getCurrentUserEmail();
    loadWishlistForAccount(initialEmail);

    // Listen to localStorage changes (e.g. login, logout, account switch)
    const handleStorageChange = () => {
      const current = getCurrentUserEmail();
      if (current !== activeEmailRef.current) {
        loadWishlistForAccount(current);
      } else {
        // Reload current user's wishlist in case it was modified in another tab
        const key = getStorageKey(current);
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            setWishlist(JSON.parse(raw));
          } else {
            setWishlist([]);
          }
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("greeno_auth_change", handleStorageChange);

    // Supabase auth state listener
    let unsubscribeSupabase = () => {};
    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        const sbEmail = session?.user?.email?.trim().toLowerCase() || getCurrentUserEmail();
        if (sbEmail !== activeEmailRef.current) {
          loadWishlistForAccount(sbEmail);
        }
      });
      unsubscribeSupabase = () => subscription.unsubscribe();
    } catch {
      // Ignore
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("greeno_auth_change", handleStorageChange);
      unsubscribeSupabase();
    };
  }, []);

  // Save current wishlist to storage whenever it updates
  const persistWishlist = (newList: WishlistItem[]) => {
    const currentEmail = activeEmailRef.current;
    const key = getStorageKey(currentEmail);
    try {
      localStorage.setItem(key, JSON.stringify(newList));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Storage quota or error
    }
    syncToServer(currentEmail, newList);
  };

  const addToWishlist = (item: WishlistItem) => {
    setWishlist((current) => {
      if (current.some((i) => i.id === item.id)) return current;
      const updated = [...current, item];
      persistWishlist(updated);
      return updated;
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((current) => {
      const updated = current.filter((item) => item.id !== id);
      persistWishlist(updated);
      return updated;
    });
  };

  const toggleWishlist = (item: WishlistItem) => {
    setWishlist((current) => {
      let updated: WishlistItem[];
      if (current.some((i) => i.id === item.id)) {
        updated = current.filter((i) => i.id !== item.id);
      } else {
        updated = [...current, item];
      }
      persistWishlist(updated);
      return updated;
    });
  };

  const isInWishlist = (id: string) => {
    return wishlist.some((item) => item.id === id);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}

