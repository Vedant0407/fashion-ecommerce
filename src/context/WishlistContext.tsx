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
    return "greeno_wishlist_guest_v2";
  }
  return `greeno_wishlist_v2_${email.trim().toLowerCase()}`;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const activeEmailRef = useRef<string | null>(null);
  const isLoadedRef = useRef(false);
  const serverReadyRef = useRef(false);

  // Sync wishlist state to backend persistent storage
  const syncToServer = async (email: string | null, list: WishlistItem[]) => {
    if (!email || !email.includes("@")) return;
    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlist: list }),
      });
    } catch (err) {
      console.warn("Notice: Wishlist server sync:", err);
    }
  };

  // Load wishlist for a specific user email
  const loadWishlistForAccount = async (email: string | null) => {
    isLoadedRef.current = false;
    serverReadyRef.current = false;
    activeEmailRef.current = email;
    setActiveEmail(email);
    const key = getStorageKey(email);
    if (email) {
      try {
        const response = await fetch("/api/wishlist", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.wishlist)) throw new Error("Could not load saved wishlist.");
        setWishlist(data.wishlist);
        localStorage.setItem(key, JSON.stringify(data.wishlist));
        serverReadyRef.current = true;
      } catch (error) {
        console.warn("Saved wishlist unavailable:", error);
        setWishlist([]);
      }
      isLoadedRef.current = true;
      return;
    }
    try {
      const saved = localStorage.getItem(key);
      setWishlist(saved ? JSON.parse(saved) : []);
    } catch {
      setWishlist([]);
    }
    isLoadedRef.current = true;
  };

  // On mount: initialize for current user and listen to account switches
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    const loadVerifiedAccount = async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) await loadWishlistForAccount(data.user?.email?.trim().toLowerCase() || null);
    };
    void loadVerifiedAccount();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (mounted) void loadWishlistForAccount(session?.user?.email?.trim().toLowerCase() || null);
      }, 0);
    });
    const handleAccountChange = () => { void loadVerifiedAccount(); };
    window.addEventListener("storage", handleAccountChange);
    window.addEventListener("greeno_auth_change", handleAccountChange);
    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("storage", handleAccountChange);
      window.removeEventListener("greeno_auth_change", handleAccountChange);
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
    if (currentEmail && serverReadyRef.current) syncToServer(currentEmail, newList);
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
