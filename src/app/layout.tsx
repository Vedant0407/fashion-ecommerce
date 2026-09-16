import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import Header from "@/components/Header";
import ChatbotAssistant from "@/components/ui/ChatbotAssistant";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GreenO Atelier | Crafted for Those Who Know",
  description: "Modern luxury atelier, heavyweight oversized silhouettes, and refined essentials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <CartProvider>
          <WishlistProvider>
            <Header />
            {children}
            <ChatbotAssistant />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}