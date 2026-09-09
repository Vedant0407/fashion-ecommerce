import fs from "fs";
import path from "path";
import { Product, Category, FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from "./catalog";

export type OrderItem = {
  id?: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
};

export type StoreOrder = {
  id: string;
  created_at: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_method: string;
  payment_status: "pending" | "paid" | "failed";
  notes?: string;
};

export type StoreCoupon = {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrder: number;
  description: string;
  active: boolean;
  usage_count?: number;
};

export type StoreSettings = {
  announcementText: string;
  storeNotice: string;
  supportPhone: string;
  supportEmail: string;
  adminPasskey: string;
  currency: string;
  smsApiKey?: string;
  smsProvider?: "fast2sms" | "2factor" | "twilio";
  twilioSid?: string;
  twilioToken?: string;
  twilioFrom?: string;
};

export type StoreData = {
  products: Product[];
  categories: Category[];
  orders: StoreOrder[];
  coupons: StoreCoupon[];
  settings: StoreSettings;
};

const DATA_DIR = path.join(process.cwd(), "src", "data");
const DATA_FILE = path.join(DATA_DIR, "store-data.json");
const TMP_FILE = path.join(
  typeof process !== "undefined" && process.platform === "win32"
    ? DATA_DIR
    : "/tmp",
  "store-data-cache.json"
);

const DEFAULT_COUPONS: StoreCoupon[] = [
  {
    code: "GREENO10",
    type: "percentage",
    value: 10,
    minOrder: 1000,
    description: "10% off on your entire streetwear order",
    active: true,
    usage_count: 14,
  },
  {
    code: "WELCOME15",
    type: "percentage",
    value: 15,
    minOrder: 1500,
    description: "15% off welcome discount for first-time buyers",
    active: true,
    usage_count: 28,
  },
  {
    code: "STREET500",
    type: "fixed",
    value: 500,
    minOrder: 2500,
    description: "₹500 flat off on orders above ₹2,500",
    active: true,
    usage_count: 9,
  },
  {
    code: "FREESHIP",
    type: "free_shipping",
    value: 199,
    minOrder: 0,
    description: "Free express shipping across India",
    active: true,
    usage_count: 42,
  },
];

const DEFAULT_SETTINGS: StoreSettings = {
  announcementText: "COMPLIMENTARY SHIPPING ACROSS INDIA • COD AVAILABLE • NEW DROP IS LIVE",
  storeNotice: "All orders placed today are dispatched within 24 hours.",
  supportPhone: "+91 98765 43210",
  supportEmail: "concierge@greeno.in",
  adminPasskey: "greeno2026",
  currency: "INR",
};

const DEFAULT_ORDERS: StoreOrder[] = [
  {
    id: "GO-9482-A1",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    customer: {
      fullName: "Arjun Sharma",
      email: "arjun.sharma@example.com",
      phone: "+91 98201 12345",
      address: "Flat 402, Signature Heights, Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
    },
    items: [
      {
        product_id: "oversized-black-tee",
        name: "Oversized Black Tee",
        price: 2499,
        quantity: 1,
        image: "/black-tee.jfif",
        size: "L",
        color: "BLACK",
      },
      {
        product_id: "urban-grey-hoodie",
        name: "Urban Grey Hoodie",
        price: 3999,
        quantity: 1,
        image: "/grey-hoodie.jfif",
        size: "XL",
        color: "GREY",
      },
    ],
    subtotal: 6498,
    shipping: 0,
    discount: 650,
    total: 5848,
    status: "processing",
    payment_method: "Prepaid / UPI",
    payment_status: "paid",
  },
  {
    id: "GO-8231-K9",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    customer: {
      fullName: "Priya Nair",
      email: "priya.nair@example.com",
      phone: "+91 94471 98765",
      address: "12/4 Lotus Villa, Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
    },
    items: [
      {
        product_id: "cargo-street-pants",
        name: "Cargo Street Pants",
        price: 3499,
        quantity: 1,
        image: "/cargo-pants.jfif",
        size: "32",
        color: "OLIVE",
      },
    ],
    subtotal: 3499,
    shipping: 199,
    discount: 0,
    total: 3698,
    status: "shipped",
    payment_method: "COD",
    payment_status: "pending",
  },
  {
    id: "GO-7104-M3",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    customer: {
      fullName: "Kabir Mehta",
      email: "kabir.mehta@example.com",
      phone: "+91 99100 55432",
      address: "House 88, Sector 15",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122001",
    },
    items: [
      {
        product_id: "classic-white-tee",
        name: "Classic White Tee",
        price: 1999,
        quantity: 2,
        image: "/white-tee.jfif",
        size: "M",
        color: "WHITE",
      },
    ],
    subtotal: 3998,
    shipping: 199,
    discount: 500,
    total: 3697,
    status: "delivered",
    payment_method: "Credit Card",
    payment_status: "paid",
  },
];

let memoryData: StoreData | null = null;

export function getInitialData(): StoreData {
  return {
    products: FALLBACK_PRODUCTS,
    categories: FALLBACK_CATEGORIES,
    orders: DEFAULT_ORDERS,
    coupons: DEFAULT_COUPONS,
    settings: DEFAULT_SETTINGS,
  };
}

export async function readStoreData(): Promise<StoreData> {
  if (memoryData) {
    return memoryData;
  }

  try {
    // Check tmp file first (updated during runtime)
    if (fs.existsSync(TMP_FILE)) {
      const raw = await fs.promises.readFile(TMP_FILE, "utf-8");
      memoryData = JSON.parse(raw);
      return memoryData!;
    }

    if (fs.existsSync(DATA_FILE)) {
      const raw = await fs.promises.readFile(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      const initial = getInitialData();
      memoryData = {
        products: parsed.products && parsed.products.length ? parsed.products : initial.products,
        categories: parsed.categories && parsed.categories.length ? parsed.categories : initial.categories,
        orders: parsed.orders || initial.orders,
        coupons: parsed.coupons || initial.coupons,
        settings: { ...initial.settings, ...(parsed.settings || {}) },
      };
      return memoryData;
    }
  } catch (error) {
    console.warn("Could not read persistent store-data, using defaults:", error);
  }

  memoryData = getInitialData();
  return memoryData;
}

export async function writeStoreData(data: StoreData): Promise<void> {
  memoryData = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    // If writing to repo root failed (e.g. read-only filesystem on Vercel), persist to /tmp
    try {
      await fs.promises.writeFile(TMP_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch {
      // Memory state is retained in memoryData
    }
  }
}

// ----------------- Product Helpers -----------------

export async function getStoreProducts(): Promise<Product[]> {
  const data = await readStoreData();
  return data.products;
}

export async function saveStoreProduct(product: Product): Promise<Product> {
  const data = await readStoreData();
  const index = data.products.findIndex((p) => p.id === product.id);

  if (index >= 0) {
    data.products[index] = { ...data.products[index], ...product };
  } else {
    data.products.unshift(product);
  }

  await writeStoreData(data);
  return product;
}

export async function deleteStoreProduct(productId: string): Promise<boolean> {
  const data = await readStoreData();
  const initialLen = data.products.length;
  data.products = data.products.filter((p) => p.id !== productId);
  if (data.products.length !== initialLen) {
    await writeStoreData(data);
    return true;
  }
  return false;
}

// ----------------- Category Helpers -----------------

export async function getStoreCategories(): Promise<Category[]> {
  const data = await readStoreData();
  return data.categories;
}

export async function saveStoreCategory(category: Category): Promise<Category> {
  const data = await readStoreData();
  const index = data.categories.findIndex(
    (c) => c.id === category.id || c.slug === category.slug
  );

  if (index >= 0) {
    data.categories[index] = { ...data.categories[index], ...category };
  } else {
    data.categories.push(category);
  }

  await writeStoreData(data);
  return category;
}

export async function deleteStoreCategory(categoryIdOrSlug: string): Promise<boolean> {
  const data = await readStoreData();
  const initialLen = data.categories.length;
  data.categories = data.categories.filter(
    (c) => c.id !== categoryIdOrSlug && c.slug !== categoryIdOrSlug
  );
  if (data.categories.length !== initialLen) {
    await writeStoreData(data);
    return true;
  }
  return false;
}

// ----------------- Order Helpers -----------------

export async function getStoreOrders(): Promise<StoreOrder[]> {
  const data = await readStoreData();
  return data.orders.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function addStoreOrder(order: StoreOrder): Promise<StoreOrder> {
  const data = await readStoreData();
  data.orders.unshift(order);
  await writeStoreData(data);
  return order;
}

export async function updateStoreOrderStatus(
  orderId: string,
  status: StoreOrder["status"],
  payment_status?: StoreOrder["payment_status"]
): Promise<StoreOrder | null> {
  const data = await readStoreData();
  const order = data.orders.find((o) => o.id === orderId);
  if (!order) return null;

  order.status = status;
  if (payment_status) {
    order.payment_status = payment_status;
  }

  await writeStoreData(data);
  return order;
}

// ----------------- Coupon Helpers -----------------

export async function getStoreCoupons(): Promise<StoreCoupon[]> {
  const data = await readStoreData();
  return data.coupons;
}

export async function saveStoreCoupon(coupon: StoreCoupon): Promise<StoreCoupon> {
  const data = await readStoreData();
  const index = data.coupons.findIndex(
    (c) => c.code.toUpperCase() === coupon.code.toUpperCase()
  );

  const cleanCoupon: StoreCoupon = {
    ...coupon,
    code: coupon.code.trim().toUpperCase(),
  };

  if (index >= 0) {
    data.coupons[index] = { ...data.coupons[index], ...cleanCoupon };
  } else {
    data.coupons.push(cleanCoupon);
  }

  await writeStoreData(data);
  return cleanCoupon;
}

export async function deleteStoreCoupon(code: string): Promise<boolean> {
  const data = await readStoreData();
  const clean = code.trim().toUpperCase();
  const initialLen = data.coupons.length;
  data.coupons = data.coupons.filter((c) => c.code.toUpperCase() !== clean);
  if (data.coupons.length !== initialLen) {
    await writeStoreData(data);
    return true;
  }
  return false;
}

// ----------------- Settings Helpers -----------------

export async function getStoreSettings(): Promise<StoreSettings> {
  const data = await readStoreData();
  return data.settings;
}

export async function saveStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const data = await readStoreData();
  data.settings = { ...data.settings, ...settings };
  await writeStoreData(data);
  return data.settings;
}
