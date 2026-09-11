"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const router = useRouter();
  const { openCart } = useCart();

  useEffect(() => {
    openCart();
    router.replace("/shop");
  }, [openCart, router]);

  return null;
}