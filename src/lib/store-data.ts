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
  status: "confirmed" | "processing" | "shipped" | "delivered" | "reached" | "cancelled";
  payment_method: string;
  payment_status: "pending" | "paid" | "failed";
  notes?: string;
};

export type ReturnExchangeItem = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
  exchange_size?: string;
  exchange_color?: string;
  reason?: string;
};

export type ReturnExchangeRequest = {
  id: string;
  order_id: string;
  created_at: string;
  type: "return" | "exchange";
  status: "pending" | "approved" | "pickup_scheduled" | "received" | "completed" | "rejected";
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: ReturnExchangeItem[];
  reason_category: string;
  customer_notes?: string;
  admin_notes?: string;
  pickup_address?: string;
  resolved_at?: string;
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
  // Email Gateway Settings
  emailProvider?: "gmail" | "smtp" | "brevo" | "resend" | "supabase";
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  brevoApiKey?: string;
  resendApiKey?: string;
};

export type StoreData = {
  products: Product[];
  categories: Category[];
  orders: StoreOrder[];
  returns: ReturnExchangeRequest[];
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
  adminPasskey: "aman2026",
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

const DEFAULT_RETURNS: ReturnExchangeRequest[] = [
  {
    id: "EXC-9482-1",
    order_id: "GO-9482-A1",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    type: "exchange",
    status: "pending",
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
        size: "L",
        color: "BLACK",
        image: "/black-tee.jfif",
        exchange_size: "XL",
        reason: "Need a looser fit in the chest",
      },
    ],
    reason_category: "Size too small / tight",
    customer_notes: "Please arrange an exchange for size XL. Tee is unworn with original tags intact.",
    pickup_address: "Flat 402, Signature Heights, Bandra West, Mumbai, Maharashtra - 400050",
  },
];

let memoryData: StoreData | null = null;

export function getInitialData(): StoreData {
  return {
    products: FALLBACK_PRODUCTS,
    categories: FALLBACK_CATEGORIES,
    orders: DEFAULT_ORDERS,
    returns: DEFAULT_RETURNS,
    coupons: DEFAULT_COUPONS,
    settings: DEFAULT_SETTINGS,
  };
}

export async function readStoreData(): Promise<StoreData> {
  if (memoryData) {
    return memoryData;
  }

  const initial = getInitialData();
  let fileData: Partial<StoreData> | null = null;
  let tmpData: Partial<StoreData> | null = null;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = await fs.promises.readFile(DATA_FILE, "utf-8");
      fileData = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Notice: could not read DATA_FILE:", err);
  }

  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = await fs.promises.readFile(TMP_FILE, "utf-8");
      tmpData = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Notice: could not read TMP_FILE:", err);
  }

  // Merge products so custom products created by admin are preserved AT THE FRONT
  const initialIds = new Set(initial.products.map((p) => p.id));
  const productMap = new Map<string, Product>();

  // 1. First add any custom products found in tmpData or fileData
  const allStored = [
    ...(tmpData?.products && Array.isArray(tmpData.products) ? tmpData.products : []),
    ...(fileData?.products && Array.isArray(fileData.products) ? fileData.products : []),
  ];

  for (const p of allStored) {
    if (p?.id && !initialIds.has(p.id) && !productMap.has(p.id)) {
      productMap.set(p.id, p);
    }
  }

  // 2. Then add initial products (overwritten by any fileData/tmpData updates to stock/flags)
  for (const p of initial.products) {
    if (p?.id && !productMap.has(p.id)) {
      const stored = allStored.find((s) => s?.id === p.id);
      productMap.set(p.id, stored ? { ...p, ...stored } : p);
    }
  }

  // Merge categories
  const categoryMap = new Map<string, Category>();
  for (const c of initial.categories) {
    const key = c?.id || c?.slug;
    if (key) categoryMap.set(key, c);
  }
  if (fileData?.categories && Array.isArray(fileData.categories)) {
    for (const c of fileData.categories) {
      const key = c?.id || c?.slug;
      if (key) categoryMap.set(key, c);
    }
  }
  if (tmpData?.categories && Array.isArray(tmpData.categories)) {
    for (const c of tmpData.categories) {
      const key = c?.id || c?.slug;
      if (key) categoryMap.set(key, c);
    }
  }

  // Merge orders from all sources non-destructively so no order details or items are lost
  const orderMap = new Map<string, StoreOrder>();
  const mergeOrderIntoMap = (o: StoreOrder) => {
    if (!o || !o.id) return;
    const existing = orderMap.get(o.id);
    if (!existing) {
      orderMap.set(o.id, o);
    } else {
      const items =
        Array.isArray(o.items) && o.items.length > 0
          ? o.items
          : Array.isArray(existing.items) && existing.items.length > 0
          ? existing.items
          : [];
      const customer = {
        fullName:
          o.customer?.fullName && o.customer.fullName !== "Customer"
            ? o.customer.fullName
            : existing.customer?.fullName || o.customer?.fullName || "Customer",
        address: o.customer?.address || existing.customer?.address || "",
        city: o.customer?.city || existing.customer?.city || "",
        state: o.customer?.state || existing.customer?.state || "",
        pincode: o.customer?.pincode || existing.customer?.pincode || "",
        phone: o.customer?.phone || existing.customer?.phone || "",
        email: o.customer?.email || existing.customer?.email || "",
      };
      orderMap.set(o.id, {
        ...existing,
        ...o,
        items,
        customer,
        subtotal: o.subtotal > 0 ? o.subtotal : existing.subtotal || 0,
        total: o.total > 0 ? o.total : existing.total || 0,
        status: o.status || existing.status,
      });
    }
  };

  for (const o of initial.orders) mergeOrderIntoMap(o);
  if (fileData?.orders && Array.isArray(fileData.orders)) {
    for (const o of fileData.orders) mergeOrderIntoMap(o);
  }
  if (tmpData?.orders && Array.isArray(tmpData.orders)) {
    for (const o of tmpData.orders) mergeOrderIntoMap(o);
  }

  // Merge return/exchange requests so no request is ever lost
  const returnMap = new Map<string, ReturnExchangeRequest>();
  for (const r of initial.returns) {
    returnMap.set(r.id, r);
  }
  if (fileData?.returns && Array.isArray(fileData.returns)) {
    for (const r of fileData.returns) {
      returnMap.set(r.id, r);
    }
  }
  if (tmpData?.returns && Array.isArray(tmpData.returns)) {
    for (const r of tmpData.returns) {
      returnMap.set(r.id, r);
    }
  }

  const base = tmpData || fileData || {};
  memoryData = {
    products: Array.from(productMap.values()),
    categories: Array.from(categoryMap.values()),
    orders: Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    returns: Array.from(returnMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    coupons: base.coupons || fileData?.coupons || initial.coupons,
    settings: { ...initial.settings, ...(fileData?.settings || {}), ...(tmpData?.settings || {}) },
  };

  return memoryData;
}

export async function writeStoreData(data: StoreData): Promise<void> {
  memoryData = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // In read-only environments (e.g. Vercel deployment), root write fails safely
  }

  try {
    const tmpDir = path.dirname(TMP_FILE);
    if (!fs.existsSync(tmpDir)) {
      await fs.promises.mkdir(tmpDir, { recursive: true });
    }
    await fs.promises.writeFile(TMP_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Memory state is retained in memoryData
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

export async function syncStoreProducts(clientProducts: Product[]): Promise<Product[]> {
  if (!Array.isArray(clientProducts) || clientProducts.length === 0) {
    return getStoreProducts();
  }

  const data = await readStoreData();
  const existingMap = new Map(data.products.map((p) => [p.id, p]));
  const updatedClientProducts: Product[] = [];

  for (const cp of clientProducts) {
    if (!cp || !cp.id) continue;
    const existing = existingMap.get(cp.id);
    if (!existing) {
      updatedClientProducts.push(cp);
    } else {
      const merged = {
        ...existing,
        ...cp,
        stock: cp.stock !== undefined ? cp.stock : existing.stock,
        size_stock: cp.size_stock || existing.size_stock,
        is_new: cp.is_new !== undefined ? cp.is_new : existing.is_new,
        is_trending: cp.is_trending !== undefined ? cp.is_trending : existing.is_trending,
        is_featured: cp.is_featured !== undefined ? cp.is_featured : existing.is_featured,
      };
      existingMap.set(cp.id, merged);
      updatedClientProducts.push(merged);
    }
  }

  const clientIds = new Set(updatedClientProducts.map((p) => p.id));
  const remainingExisting = data.products.filter((p) => p?.id && !clientIds.has(p.id));

  data.products = [...updatedClientProducts, ...remainingExisting];
  await writeStoreData(data);
  return data.products;
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
  // Avoid duplicate entries
  const existingIdx = data.orders.findIndex((o) => o.id === order.id);
  if (existingIdx >= 0) {
    data.orders[existingIdx] = { ...data.orders[existingIdx], ...order };
  } else {
    data.orders.unshift(order);
  }
  await writeStoreData(data);
  return order;
}

export async function updateStoreOrderStatus(
  orderId: string,
  status: StoreOrder["status"],
  payment_status?: StoreOrder["payment_status"],
  fallbackOrder?: Partial<StoreOrder>
): Promise<StoreOrder | null> {
  const data = await readStoreData();
  let order = data.orders.find((o) => o.id === orderId);

  if (!order) {
    if (
      fallbackOrder &&
      fallbackOrder.customer &&
      fallbackOrder.items &&
      fallbackOrder.items.length > 0
    ) {
      order = {
        id: orderId,
        created_at: fallbackOrder.created_at || new Date().toISOString(),
        customer: fallbackOrder.customer as any,
        items: fallbackOrder.items as any,
        subtotal: fallbackOrder.subtotal || 0,
        shipping: fallbackOrder.shipping !== undefined ? fallbackOrder.shipping : 0,
        discount: fallbackOrder.discount || 0,
        total: fallbackOrder.total || 0,
        status,
        payment_method: fallbackOrder.payment_method || "COD",
        payment_status: payment_status || fallbackOrder.payment_status || "pending",
      };
      data.orders.unshift(order);
    } else {
      // Never create a hollow 0-item stub order that destroys real order records
      return null;
    }
  } else {
    order.status = status;
    if (payment_status) {
      order.payment_status = payment_status;
    }

    // If order was previously missing items or customer details, heal it from fallbackOrder
    if (
      (!order.items || order.items.length === 0) &&
      fallbackOrder?.items &&
      fallbackOrder.items.length > 0
    ) {
      order.items = fallbackOrder.items as any;
      if (fallbackOrder.subtotal) order.subtotal = fallbackOrder.subtotal;
      if (fallbackOrder.total) order.total = fallbackOrder.total;
    }
    if (
      (!order.customer || order.customer.fullName === "Customer") &&
      fallbackOrder?.customer
    ) {
      order.customer = fallbackOrder.customer as any;
    }
  }

  await writeStoreData(data);
  return order;
}

export async function syncStoreOrders(clientOrders: StoreOrder[]): Promise<StoreOrder[]> {
  if (!Array.isArray(clientOrders) || clientOrders.length === 0) {
    return getStoreOrders();
  }

  const data = await readStoreData();
  const existingMap = new Map(data.orders.map((o) => [o.id, o]));

  for (const co of clientOrders) {
    if (!co.id) continue;
    const existing = existingMap.get(co.id);
    if (!existing) {
      existingMap.set(co.id, co);
    } else {
      // Intelligently merge: NEVER let empty items replace real items!
      const resolvedItems =
        Array.isArray(co.items) && co.items.length > 0
          ? co.items
          : Array.isArray(existing.items) && existing.items.length > 0
          ? existing.items
          : [];

      const resolvedCustomer =
        co.customer?.address || (co.customer?.fullName && co.customer.fullName !== "Customer")
          ? co.customer
          : existing.customer || co.customer;

      existingMap.set(co.id, {
        ...existing,
        ...co,
        items: resolvedItems,
        customer: resolvedCustomer,
        subtotal: co.subtotal > 0 ? co.subtotal : existing.subtotal || 0,
        total: co.total > 0 ? co.total : existing.total || 0,
        status: existing.status || co.status,
        payment_status: existing.payment_status || co.payment_status,
      });
    }
  }

  data.orders = Array.from(existingMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  await writeStoreData(data);
  return data.orders;
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

// ----------------- Return & Exchange Helpers -----------------

export async function getStoreReturns(): Promise<ReturnExchangeRequest[]> {
  const data = await readStoreData();
  return (data.returns || []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function addStoreReturn(
  returnReq: ReturnExchangeRequest
): Promise<ReturnExchangeRequest> {
  const data = await readStoreData();
  if (!data.returns) data.returns = [];
  const existingIdx = data.returns.findIndex((r) => r.id === returnReq.id);
  if (existingIdx >= 0) {
    data.returns[existingIdx] = { ...data.returns[existingIdx], ...returnReq };
  } else {
    data.returns.unshift(returnReq);
  }
  await writeStoreData(data);
  return returnReq;
}

export async function updateStoreReturnStatus(
  id: string,
  status: ReturnExchangeRequest["status"],
  admin_notes?: string
): Promise<ReturnExchangeRequest | null> {
  const data = await readStoreData();
  if (!data.returns) data.returns = [];
  const returnReq = data.returns.find((r) => r.id === id);
  if (!returnReq) return null;

  returnReq.status = status;
  if (admin_notes !== undefined) {
    returnReq.admin_notes = admin_notes;
  }
  if (status === "completed" || status === "rejected") {
    returnReq.resolved_at = new Date().toISOString();
  }

  await writeStoreData(data);
  return returnReq;
}

export async function syncStoreReturns(
  clientReturns: ReturnExchangeRequest[]
): Promise<ReturnExchangeRequest[]> {
  if (!Array.isArray(clientReturns) || clientReturns.length === 0) {
    return getStoreReturns();
  }

  const data = await readStoreData();
  if (!data.returns) data.returns = [];
  const existingMap = new Map(data.returns.map((r) => [r.id, r]));

  for (const cr of clientReturns) {
    if (!cr.id) continue;
    const existing = existingMap.get(cr.id);
    if (!existing) {
      existingMap.set(cr.id, cr);
    } else {
      existingMap.set(cr.id, {
        ...existing,
        ...cr,
        status: cr.status || existing.status,
        admin_notes: cr.admin_notes || existing.admin_notes,
      });
    }
  }

  data.returns = Array.from(existingMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  await writeStoreData(data);
  return data.returns;
}

export async function deleteStoreReturn(id: string): Promise<boolean> {
  const data = await readStoreData();
  if (!data.returns) return false;
  const initialLen = data.returns.length;
  data.returns = data.returns.filter((r) => r.id !== id);
  if (data.returns.length !== initialLen) {
    await writeStoreData(data);
    return true;
  }
  return false;
}
