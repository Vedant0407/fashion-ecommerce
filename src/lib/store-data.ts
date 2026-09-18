import fs from "fs";
import path from "path";
import { Product, Category, FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from "./catalog";
import { prisma } from "@/lib/prisma";
import type { StoreStory } from "./story-constants";
import { DEFAULT_STORIES } from "./story-constants";

export type { StoreStory };
export { DEFAULT_STORIES };

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

export type StoreReview = {
  id: string;
  product_id: string;
  product_name?: string;
  author: string;
  location?: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  sizePurchased?: string;
  fitFeedback?: "Runs Small" | "True to Size" | "Runs Large";
  helpfulCount: number;
  is_featured?: boolean;
  created_at: string;
};



export type StoreData = {
  products: Product[];
  categories: Category[];
  orders: StoreOrder[];
  returns: ReturnExchangeRequest[];
  coupons: StoreCoupon[];
  settings: StoreSettings;
  reviews?: StoreReview[];
  stories?: StoreStory[];
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
const inMemoryOrderStatusOverrides = new Map<
  string,
  { status: StoreOrder["status"]; payment_status?: StoreOrder["payment_status"] }
>();

const OVERRIDES_FILE = path.join(
  typeof process !== "undefined" && process.platform === "win32"
    ? DATA_DIR
    : "/tmp",
  "order-status-overrides.json"
);
const DATA_OVERRIDES_FILE = path.join(DATA_DIR, "order-status-overrides.json");

export function loadOrderStatusOverrides() {
  try {
    const fileToRead = fs.existsSync(DATA_OVERRIDES_FILE)
      ? DATA_OVERRIDES_FILE
      : fs.existsSync(OVERRIDES_FILE)
      ? OVERRIDES_FILE
      : null;
    if (fileToRead) {
      const content = fs.readFileSync(fileToRead, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        for (const [k, v] of Object.entries(parsed)) {
          if (v && typeof v === "object" && (v as any).status) {
            inMemoryOrderStatusOverrides.set(k, {
              status: (v as any).status,
              payment_status: (v as any).payment_status,
            });
          }
        }
      }
    }
  } catch {}
}

export function setOrderStatusOverride(
  orderId: string,
  status: StoreOrder["status"],
  payment_status?: StoreOrder["payment_status"]
) {
  inMemoryOrderStatusOverrides.set(orderId, { status, payment_status });
  try {
    const obj: Record<string, { status: StoreOrder["status"]; payment_status?: StoreOrder["payment_status"] }> = {};
    for (const [k, v] of inMemoryOrderStatusOverrides.entries()) {
      obj[k] = v;
    }
    const raw = JSON.stringify(obj, null, 2);
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_OVERRIDES_FILE, raw, "utf-8");
    } catch {}
    try {
      const dir = path.dirname(OVERRIDES_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(OVERRIDES_FILE, raw, "utf-8");
    } catch {}
  } catch {}
}

export function getInMemoryOrderStatusOverrides(): Record<string, string> {
  loadOrderStatusOverrides();
  const result: Record<string, string> = {};
  for (const [id, val] of inMemoryOrderStatusOverrides.entries()) {
    result[id] = val.status;
  }
  return result;
}

export const DEFAULT_REVIEWS: StoreReview[] = [
  {
    id: "rev-poplin-1",
    product_id: "tailored-poplin-shirt",
    product_name: "Tailored Poplin Shirt",
    author: "Julian V.",
    location: "Milan, IT",
    rating: 5,
    date: "3 days ago",
    title: "Impeccable collar stance and refined weave",
    comment: "The collar retains its sharp architectural profile with zero buckling. The fabric has an exquisite substantial weight while remaining breathable throughout the day. Finished with refined mother-of-pearl buttons.",
    verified: true,
    sizePurchased: "M",
    fitFeedback: "True to Size",
    helpfulCount: 14,
    is_featured: true,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: "rev-poplin-2",
    product_id: "tailored-poplin-shirt",
    product_name: "Tailored Poplin Shirt",
    author: "Aarav M.",
    location: "Mumbai, IN",
    rating: 5,
    date: "1 week ago",
    title: "Fluid drape, quiet luxury tailoring",
    comment: "Fits impeccably through the shoulders with just enough ease in the torso. Doesn't crease easily and moves with an understated elegance. Easily rivals European luxury fashion houses.",
    verified: true,
    sizePurchased: "L",
    fitFeedback: "True to Size",
    helpfulCount: 9,
    is_featured: true,
    created_at: new Date(Date.now() - 3600000 * 168).toISOString(),
  },
  {
    id: "rev-oxford-1",
    product_id: "charcoal-oxford-overshirt",
    product_name: "Charcoal Oxford Overshirt",
    author: "Marcus K.",
    location: "London, UK",
    rating: 5,
    date: "2 weeks ago",
    title: "Substantial handfeel and immaculate stitching",
    comment: "Very clean French seams and premium cotton density. Sits slightly relaxed in the body as intended by the atelier silhouette. Highly recommended.",
    verified: true,
    sizePurchased: "XL",
    fitFeedback: "True to Size",
    helpfulCount: 12,
    is_featured: true,
    created_at: new Date(Date.now() - 3600000 * 336).toISOString(),
  },
  {
    id: "rev-boxy-1",
    product_id: "oversized-black-tee",
    product_name: "Heavyweight Boxy Tee",
    author: "Dev P.",
    location: "Bengaluru, IN",
    rating: 5,
    date: "4 days ago",
    title: "Dense combed cotton that holds its structure",
    comment: "The 300gsm combed jersey is phenomenal. Heavyweight without stiffness, hangs with an architectural boxy drape. Zero collar buckling after wash.",
    verified: true,
    sizePurchased: "L",
    fitFeedback: "True to Size",
    helpfulCount: 16,
    is_featured: true,
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
  {
    id: "rev-chalk-1",
    product_id: "minimalist-chalk-tee",
    product_name: "Minimalist Chalk Tee",
    author: "Kavya S.",
    location: "New Delhi, IN",
    rating: 5,
    date: "5 days ago",
    title: "Quiet elegance, sculptural drop shoulder",
    comment: "Substantial tactile handfeel without feeling uncomfortably heavy. The drop shoulder is tailored with precision rather than looking sloppy.",
    verified: true,
    sizePurchased: "S",
    fitFeedback: "True to Size",
    helpfulCount: 11,
    is_featured: true,
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
  },
];



export function getInitialData(): StoreData {
  return {
    products: FALLBACK_PRODUCTS,
    categories: FALLBACK_CATEGORIES,
    orders: DEFAULT_ORDERS,
    returns: DEFAULT_RETURNS,
    coupons: DEFAULT_COUPONS,
    settings: DEFAULT_SETTINGS,
    reviews: DEFAULT_REVIEWS,
    stories: DEFAULT_STORIES,
  };
}

let lastDataFileMtime = 0;

export async function readStoreData(forceFresh = false): Promise<StoreData> {
  loadOrderStatusOverrides();

  try {
    const [dbProducts, dbCategories, dbOrders, dbReturns, dbReviews, dbCoupons, dbStories, dbSettings] =
      await Promise.all([
        prisma.product.findMany(),
        prisma.category.findMany(),
        prisma.order.findMany({
          include: { items: true },
          orderBy: { created_at: "desc" },
        }),
        prisma.returnRequest.findMany({
          include: { items: true },
          orderBy: { created_at: "desc" },
        }),
        prisma.review.findMany({
          orderBy: { created_at: "desc" },
        }),
        prisma.coupon.findMany(),
        prisma.story.findMany({
          orderBy: { order_index: "asc" },
        }),
        prisma.storeSetting.findUnique({ where: { id: "default" } }),
      ]);

    if (dbProducts && dbProducts.length > 0) {
      const parsedProducts: Product[] = dbProducts.map((p) => {
        let parsedImages: string[] = [];
        try {
          parsedImages = JSON.parse(p.images);
        } catch {
          parsedImages = [p.image];
        }

        let parsedSizeStock: Record<string, number> = { S: 5, M: 10, L: 10, XL: 5, XXL: 0 };
        try {
          parsedSizeStock = JSON.parse(p.size_stock);
        } catch {}

        let parsedColors: string[] = [p.color || "BLACK"];
        try {
          parsedColors = JSON.parse(p.colors);
        } catch {}

        return {
          id: p.id,
          name: p.name,
          price: p.price,
          description: p.description,
          category_id: p.category_id || undefined,
          category_slug: p.category_slug,
          category_name: p.category_name,
          image: p.image,
          images: parsedImages,
          stock: p.stock,
          size_stock: parsedSizeStock,
          colors: parsedColors,
          color: p.color,
          product_no: p.product_no || undefined,
          material: p.material || undefined,
          fabric: p.fabric || undefined,
          fit: p.fit || undefined,
          is_featured: p.is_featured,
          is_new: p.is_new,
          is_trending: p.is_trending,
          collection_tag: p.collection_tag || undefined,
        };
      });

      const parsedCategories: Category[] = dbCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image || undefined,
        description: c.description || undefined,
      }));

      const parsedOrders: StoreOrder[] = dbOrders.map((o) => {
        const override = inMemoryOrderStatusOverrides.get(o.id);
        return {
          id: o.id,
          created_at: o.created_at.toISOString(),
          customer: {
            fullName: o.customer_name,
            email: o.customer_email,
            phone: o.customer_phone,
            address: o.address,
            city: o.city,
            state: o.state,
            pincode: o.pincode,
          },
          items: o.items.map((it) => ({
            id: it.id,
            product_id: it.product_id || "",
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            size: it.size || undefined,
            color: it.color || undefined,
            image: it.image || undefined,
          })),
          subtotal: o.subtotal,
          shipping: o.shipping,
          discount: o.discount,
          total: o.total,
          status: (override?.status || o.status) as StoreOrder["status"],
          payment_method: o.payment_method,
          payment_status: (override?.payment_status || o.payment_status) as StoreOrder["payment_status"],
          notes: o.notes || undefined,
        };
      });

      const parsedReviews: StoreReview[] = dbReviews.map((r) => ({
        id: r.id,
        product_id: r.product_id,
        product_name: r.product_name || undefined,
        author: r.author,
        location: r.location || undefined,
        rating: r.rating,
        date: r.date,
        title: r.title,
        comment: r.comment,
        verified: r.verified,
        sizePurchased: r.sizePurchased || undefined,
        fitFeedback: (r.fitFeedback as any) || undefined,
        helpfulCount: r.helpfulCount,
        is_featured: r.is_featured,
        created_at: r.created_at.toISOString(),
      }));

      const parsedCoupons: StoreCoupon[] = dbCoupons.map((c) => ({
        code: c.code,
        type: c.type as StoreCoupon["type"],
        value: c.value,
        minOrder: c.minOrder,
        description: c.description,
        active: c.active,
        usage_count: c.usage_count,
      }));

      const initial = getInitialData();

      const parsedReturns: ReturnExchangeRequest[] =
        dbReturns && dbReturns.length > 0
          ? dbReturns.map((ret) => ({
              id: ret.id,
              order_id: ret.order_id,
              created_at: ret.created_at.toISOString(),
              type: ret.type as ReturnExchangeRequest["type"],
              status: ret.status as ReturnExchangeRequest["status"],
              customer: {
                fullName: ret.customer_name,
                email: ret.customer_email,
                phone: ret.customer_phone,
                address: ret.pickup_address || "",
                city: "",
                state: "",
                pincode: "",
              },
              items: ret.items.map((it) => ({
                product_id: it.product_id,
                name: it.name,
                price: it.price,
                quantity: it.quantity,
                size: it.size || undefined,
                color: it.color || undefined,
                image: it.image || undefined,
                exchange_size: it.exchange_size || undefined,
                exchange_color: it.exchange_color || undefined,
                reason: it.reason || undefined,
              })),
              reason_category: ret.reason_category,
              customer_notes: ret.customer_notes || undefined,
              admin_notes: ret.admin_notes || undefined,
              pickup_address: ret.pickup_address || undefined,
              resolved_at: ret.resolved_at?.toISOString() || undefined,
            }))
          : initial.returns;

      const parsedSettings: StoreSettings = dbSettings
        ? {
            announcementText: dbSettings.announcementText,
            storeNotice: dbSettings.storeNotice,
            supportPhone: dbSettings.supportPhone,
            supportEmail: dbSettings.supportEmail,
            adminPasskey: dbSettings.adminPasskey,
            currency: dbSettings.currency,
            smsApiKey: dbSettings.smsApiKey || undefined,
            smsProvider: (dbSettings.smsProvider as any) || undefined,
            emailProvider: (dbSettings.emailProvider as any) || undefined,
            smtpHost: dbSettings.smtpHost || undefined,
            smtpPort: dbSettings.smtpPort || undefined,
            smtpSecure: dbSettings.smtpSecure !== null ? dbSettings.smtpSecure : undefined,
            smtpUser: dbSettings.smtpUser || undefined,
            smtpPass: dbSettings.smtpPass || undefined,
            smtpFrom: dbSettings.smtpFrom || undefined,
            brevoApiKey: dbSettings.brevoApiKey || undefined,
            resendApiKey: dbSettings.resendApiKey || undefined,
          }
        : initial.settings;

      const parsedStories: StoreStory[] =
        dbStories && dbStories.length > 0
          ? dbStories.map((s) => ({
              id: s.id,
              title: s.title,
              caption: s.caption || undefined,
              image: s.image,
              link_url: s.link_url || undefined,
              link_text: s.link_text || "EXPLORE PIECE",
              duration: s.duration || 5,
              active: s.active,
              order_index: s.order_index,
              views_count: s.views_count,
              created_at: s.created_at.toISOString(),
              updated_at: s.updated_at.toISOString(),
            }))
          : initial.stories || DEFAULT_STORIES;

      memoryData = {
        products: parsedProducts,
        categories: parsedCategories,
        orders: parsedOrders,
        returns: parsedReturns,
        coupons: parsedCoupons,
        settings: parsedSettings,
        reviews: parsedReviews,
        stories: parsedStories,
      };

      return memoryData;
    }
  } catch (err) {
    console.warn("Prisma query notice, falling back to disk JSON store:", err);
  }

  let fileMtime = 0;
  try {
    if (fs.existsSync(DATA_FILE)) {
      fileMtime = fs.statSync(DATA_FILE).mtimeMs;
    }
  } catch {}

  const shouldForce = forceFresh || fileMtime > lastDataFileMtime;

  if (memoryData && !shouldForce) {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const diskData = JSON.parse(raw);
        if (diskData?.orders && Array.isArray(diskData.orders)) {
          const diskOrderMap = new Map<string, StoreOrder>(
            diskData.orders.map((o: StoreOrder) => [o.id, o])
          );
          for (const mo of memoryData.orders) {
            if (!diskOrderMap.has(mo.id)) {
              diskOrderMap.set(mo.id, mo);
            }
          }
          memoryData.orders = Array.from(diskOrderMap.values()).sort(
            (a: StoreOrder, b: StoreOrder) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
      }
    } catch {}

    for (const o of memoryData.orders) {
      const override = inMemoryOrderStatusOverrides.get(o.id);
      if (override) {
        o.status = override.status;
        if (override.payment_status) o.payment_status = override.payment_status;
      }
    }
    return memoryData;
  }

  if (fileMtime > 0) {
    lastDataFileMtime = fileMtime;
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

  // Merge products: prioritize fileData (primary persistent DB) over tmpData
  const initialIds = new Set(initial.products.map((p) => p.id));
  const productMap = new Map<string, Product>();

  // 1. First add any custom products found in fileData or tmpData
  const allStored = [
    ...(fileData?.products && Array.isArray(fileData.products) ? fileData.products : []),
    ...(tmpData?.products && Array.isArray(tmpData.products) ? tmpData.products : []),
  ];

  for (const p of allStored) {
    if (p?.id && !initialIds.has(p.id) && !productMap.has(p.id)) {
      productMap.set(p.id, p);
    }
  }

  // 2. Then add initial products (overwritten by any fileData/tmpData updates to stock/price/flags)
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

  // Merge client reviews
  const reviewMap = new Map<string, StoreReview>();
  for (const rev of initial.reviews || []) {
    reviewMap.set(rev.id, rev);
  }
  if (fileData?.reviews && Array.isArray(fileData.reviews)) {
    for (const rev of fileData.reviews) {
      reviewMap.set(rev.id, rev);
    }
  }
  if (tmpData?.reviews && Array.isArray(tmpData.reviews)) {
    for (const rev of tmpData.reviews) {
      reviewMap.set(rev.id, rev);
    }
  }

  // Merge atelier stories
  const storyMap = new Map<string, StoreStory>();
  for (const s of initial.stories || DEFAULT_STORIES) {
    storyMap.set(s.id, s);
  }
  if (fileData?.stories && Array.isArray(fileData.stories)) {
    for (const s of fileData.stories) {
      storyMap.set(s.id, s);
    }
  }
  if (tmpData?.stories && Array.isArray(tmpData.stories)) {
    for (const s of tmpData.stories) {
      storyMap.set(s.id, s);
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
    reviews: Array.from(reviewMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    stories: Array.from(storyMap.values()).sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    ),
  };

  // Ensure any explicit status overrides are applied to memoryData
  for (const o of memoryData.orders) {
    const override = inMemoryOrderStatusOverrides.get(o.id);
    if (override) {
      o.status = override.status;
      if (override.payment_status) o.payment_status = override.payment_status;
    }
  }

  return memoryData;
}

export async function writeStoreData(data: StoreData): Promise<void> {
  memoryData = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write DATA_FILE synchronously:", err);
  }

  try {
    const tmpDir = path.dirname(TMP_FILE);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(TMP_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Memory state is retained in memoryData
  }
}

// ----------------- Product Helpers -----------------

export async function getStoreProducts(forceFresh = true): Promise<Product[]> {
  const data = await readStoreData(forceFresh);
  return data.products;
}

export async function saveStoreProduct(product: Product): Promise<Product> {
  try {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        price: Number(product.price),
        description: product.description || "",
        category_slug: product.category_slug || "shirts",
        category_name: product.category_name || "SHIRTS",
        image: product.image || "/atelier-shirt.jpg",
        images: JSON.stringify(product.images || [product.image || "/atelier-shirt.jpg"]),
        stock: Number(product.stock || 50),
        size_stock: JSON.stringify(product.size_stock || {}),
        colors: JSON.stringify(product.colors || [product.color || "BLACK"]),
        color: product.color || "BLACK",
        product_no: product.product_no || null,
        material: product.material || null,
        fabric: product.fabric || null,
        fit: product.fit || null,
        is_featured: Boolean(product.is_featured),
        is_new: Boolean(product.is_new),
        is_trending: Boolean(product.is_trending),
        collection_tag: product.collection_tag || null,
      },
      create: {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        description: product.description || "",
        category_slug: product.category_slug || "shirts",
        category_name: product.category_name || "SHIRTS",
        image: product.image || "/atelier-shirt.jpg",
        images: JSON.stringify(product.images || [product.image || "/atelier-shirt.jpg"]),
        stock: Number(product.stock || 50),
        size_stock: JSON.stringify(product.size_stock || {}),
        colors: JSON.stringify(product.colors || [product.color || "BLACK"]),
        color: product.color || "BLACK",
        product_no: product.product_no || null,
        material: product.material || null,
        fabric: product.fabric || null,
        fit: product.fit || null,
        is_featured: Boolean(product.is_featured),
        is_new: Boolean(product.is_new),
        is_trending: Boolean(product.is_trending),
        collection_tag: product.collection_tag || null,
      },
    });
  } catch (err) {
    console.warn("Prisma saveStoreProduct notice:", err);
  }

  const data = await readStoreData(true);
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
  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch (err) {
    console.warn("Prisma deleteStoreProduct notice:", err);
  }

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
  try {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        image: category.image || null,
        description: category.description || null,
      },
      create: {
        id: category.id || `cat-${category.slug}`,
        name: category.name,
        slug: category.slug,
        image: category.image || null,
        description: category.description || null,
      },
    });
  } catch (err) {
    console.warn("Prisma saveStoreCategory notice:", err);
  }

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
  try {
    await prisma.category.deleteMany({
      where: {
        OR: [{ id: categoryIdOrSlug }, { slug: categoryIdOrSlug }],
      },
    });
  } catch (err) {
    console.warn("Prisma deleteStoreCategory notice:", err);
  }

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

export async function getStoreOrders(forceFresh = true): Promise<StoreOrder[]> {
  const data = await readStoreData(forceFresh);
  return data.orders.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function addStoreOrder(order: StoreOrder): Promise<StoreOrder> {
  try {
    await prisma.order.upsert({
      where: { id: order.id },
      update: {
        status: order.status,
        payment_status: order.payment_status,
        total: order.total,
      },
      create: {
        id: order.id,
        created_at: new Date(order.created_at || Date.now()),
        customer_name: order.customer.fullName,
        customer_email: order.customer.email,
        customer_phone: order.customer.phone,
        address: order.customer.address,
        city: order.customer.city,
        state: order.customer.state,
        pincode: order.customer.pincode,
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        notes: order.notes || null,
        items: {
          create: (order.items || []).map((it) => ({
            product_id: it.product_id || null,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            size: it.size || null,
            color: it.color || null,
            image: it.image || null,
          })),
        },
      },
    });
  } catch (err) {
    console.warn("Prisma addStoreOrder notice:", err);
  }

  const data = await readStoreData(true);
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
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(payment_status ? { payment_status } : {}),
      },
    });
  } catch (err) {
    console.warn("Prisma updateStoreOrderStatus notice:", err);
  }

  const data = await readStoreData(true);
  let order = data.orders.find((o) => o.id === orderId);

  if (!order) {
    order = {
      id: orderId,
      created_at: fallbackOrder?.created_at || new Date().toISOString(),
      customer: (fallbackOrder?.customer as any) || {
        fullName: "Customer",
        email: "customer@example.com",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      },
      items: (fallbackOrder?.items as any) || [],
      subtotal: fallbackOrder?.subtotal || 0,
      shipping: fallbackOrder?.shipping !== undefined ? fallbackOrder?.shipping : 0,
      discount: fallbackOrder?.discount || 0,
      total: fallbackOrder?.total || 0,
      status,
      payment_method: fallbackOrder?.payment_method || "COD",
      payment_status: payment_status || fallbackOrder?.payment_status || "pending",
    };
    data.orders.unshift(order);
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

  setOrderStatusOverride(orderId, status, payment_status);
  await writeStoreData(data);
  return order;
}

export async function syncStoreOrders(clientOrders: StoreOrder[]): Promise<StoreOrder[]> {
  if (!Array.isArray(clientOrders) || clientOrders.length === 0) {
    return getStoreOrders(true);
  }

  const data = await readStoreData(true);
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

      const statusOverride = inMemoryOrderStatusOverrides.get(co.id)?.status;
      const finalStatus =
        statusOverride ||
        (existing.status && existing.status !== "confirmed" ? existing.status : co.status) ||
        existing.status ||
        co.status ||
        "confirmed";

      existingMap.set(co.id, {
        ...existing,
        ...co,
        items: resolvedItems,
        customer: resolvedCustomer,
        subtotal: co.subtotal > 0 ? co.subtotal : existing.subtotal || 0,
        total: co.total > 0 ? co.total : existing.total || 0,
        status: finalStatus,
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
  const cleanCode = coupon.code.trim().toUpperCase();
  const cleanCoupon: StoreCoupon = {
    ...coupon,
    code: cleanCode,
  };

  try {
    await prisma.coupon.upsert({
      where: { code: cleanCode },
      update: {
        type: cleanCoupon.type,
        value: Number(cleanCoupon.value),
        minOrder: Number(cleanCoupon.minOrder || 0),
        description: cleanCoupon.description,
        active: cleanCoupon.active !== undefined ? Boolean(cleanCoupon.active) : true,
        usage_count: Number(cleanCoupon.usage_count || 0),
      },
      create: {
        code: cleanCode,
        type: cleanCoupon.type,
        value: Number(cleanCoupon.value),
        minOrder: Number(cleanCoupon.minOrder || 0),
        description: cleanCoupon.description,
        active: cleanCoupon.active !== undefined ? Boolean(cleanCoupon.active) : true,
        usage_count: Number(cleanCoupon.usage_count || 0),
      },
    });
  } catch (err) {
    console.warn("Prisma saveStoreCoupon notice:", err);
  }

  const data = await readStoreData();
  const index = data.coupons.findIndex(
    (c) => c.code.toUpperCase() === cleanCode
  );

  if (index >= 0) {
    data.coupons[index] = { ...data.coupons[index], ...cleanCoupon };
  } else {
    data.coupons.push(cleanCoupon);
  }

  await writeStoreData(data);
  return cleanCoupon;
}

export async function deleteStoreCoupon(code: string): Promise<boolean> {
  const clean = code.trim().toUpperCase();
  try {
    await prisma.coupon.deleteMany({
      where: { code: clean },
    });
  } catch (err) {
    console.warn("Prisma deleteStoreCoupon notice:", err);
  }

  const data = await readStoreData();
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
  try {
    await prisma.storeSetting.upsert({
      where: { id: "default" },
      update: {
        ...(settings.announcementText !== undefined && { announcementText: settings.announcementText }),
        ...(settings.storeNotice !== undefined && { storeNotice: settings.storeNotice }),
        ...(settings.supportPhone !== undefined && { supportPhone: settings.supportPhone }),
        ...(settings.supportEmail !== undefined && { supportEmail: settings.supportEmail }),
        ...(settings.adminPasskey !== undefined && { adminPasskey: settings.adminPasskey }),
        ...(settings.currency !== undefined && { currency: settings.currency }),
        ...(settings.smsApiKey !== undefined && { smsApiKey: settings.smsApiKey }),
        ...(settings.smsProvider !== undefined && { smsProvider: settings.smsProvider }),
        ...(settings.emailProvider !== undefined && { emailProvider: settings.emailProvider }),
        ...(settings.smtpHost !== undefined && { smtpHost: settings.smtpHost }),
        ...(settings.smtpPort !== undefined && { smtpPort: settings.smtpPort }),
        ...(settings.smtpSecure !== undefined && { smtpSecure: settings.smtpSecure }),
        ...(settings.smtpUser !== undefined && { smtpUser: settings.smtpUser }),
        ...(settings.smtpPass !== undefined && { smtpPass: settings.smtpPass }),
        ...(settings.smtpFrom !== undefined && { smtpFrom: settings.smtpFrom }),
        ...(settings.brevoApiKey !== undefined && { brevoApiKey: settings.brevoApiKey }),
        ...(settings.resendApiKey !== undefined && { resendApiKey: settings.resendApiKey }),
      },
      create: {
        id: "default",
        announcementText: settings.announcementText || "COMPLIMENTARY SHIPPING ACROSS INDIA • COD AVAILABLE • NEW DROP IS LIVE",
        storeNotice: settings.storeNotice || "All orders placed today are dispatched within 24 hours.",
        supportPhone: settings.supportPhone || "+91 98765 43210",
        supportEmail: settings.supportEmail || "concierge@greeno.in",
        adminPasskey: settings.adminPasskey || "aman2026",
        currency: settings.currency || "INR",
        smsApiKey: settings.smsApiKey || "",
        smsProvider: settings.smsProvider || "2factor",
        emailProvider: settings.emailProvider || "gmail",
        smtpHost: settings.smtpHost || "smtp.gmail.com",
        smtpPort: settings.smtpPort || 465,
        smtpSecure: settings.smtpSecure !== undefined ? settings.smtpSecure : true,
        smtpUser: settings.smtpUser || "vedantshrivastava0407@gmail.com",
        smtpPass: settings.smtpPass || "qqzjjbpozvfvhlhv",
        smtpFrom: settings.smtpFrom || "GreenO Security <vedantshrivastava0407@gmail.com>",
        brevoApiKey: settings.brevoApiKey || "",
        resendApiKey: settings.resendApiKey || "",
      },
    });
  } catch (err) {
    console.warn("Prisma saveStoreSettings notice:", err);
  }

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
  try {
    await prisma.returnRequest.upsert({
      where: { id: returnReq.id },
      update: {
        status: returnReq.status,
        admin_notes: returnReq.admin_notes || null,
        resolved_at: returnReq.resolved_at ? new Date(returnReq.resolved_at) : null,
      },
      create: {
        id: returnReq.id,
        order_id: returnReq.order_id,
        created_at: new Date(returnReq.created_at || Date.now()),
        type: returnReq.type,
        status: returnReq.status,
        reason_category: returnReq.reason_category,
        customer_notes: returnReq.customer_notes || null,
        admin_notes: returnReq.admin_notes || null,
        pickup_address: returnReq.pickup_address || null,
        resolved_at: returnReq.resolved_at ? new Date(returnReq.resolved_at) : null,
        customer_name: returnReq.customer.fullName,
        customer_email: returnReq.customer.email,
        customer_phone: returnReq.customer.phone,
        items: {
          create: returnReq.items.map((it) => ({
            product_id: it.product_id,
            name: it.name,
            price: Number(it.price),
            quantity: Number(it.quantity),
            size: it.size || null,
            color: it.color || null,
            image: it.image || null,
            exchange_size: it.exchange_size || null,
            exchange_color: it.exchange_color || null,
            reason: it.reason || null,
          })),
        },
      },
    });
  } catch (err) {
    console.warn("Prisma addStoreReturn notice:", err);
  }

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
  try {
    await prisma.returnRequest.update({
      where: { id },
      data: {
        status,
        ...(admin_notes !== undefined ? { admin_notes } : {}),
        ...((status === "completed" || status === "rejected") ? { resolved_at: new Date() } : {}),
      },
    });
  } catch (err) {
    console.warn("Prisma updateStoreReturnStatus notice:", err);
  }

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
  try {
    await prisma.returnRequest.delete({ where: { id } });
  } catch (err) {
    console.warn("Prisma deleteStoreReturn notice:", err);
  }

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

// ----------------- Client Reviews Helpers -----------------

export async function getStoreReviews(productId?: string): Promise<StoreReview[]> {
  const data = await readStoreData();
  const reviews = data.reviews || [];
  if (productId) {
    return reviews.filter((r) => r.product_id === productId);
  }
  return reviews;
}

export async function saveStoreReview(review: StoreReview): Promise<StoreReview> {
  const reviewId = review.id || `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const cleanReview: StoreReview = { ...review, id: reviewId };

  try {
    await prisma.review.upsert({
      where: { id: cleanReview.id },
      update: {
        product_id: cleanReview.product_id,
        product_name: cleanReview.product_name || null,
        author: cleanReview.author,
        location: cleanReview.location || null,
        rating: Number(cleanReview.rating),
        date: cleanReview.date || "Just now",
        title: cleanReview.title,
        comment: cleanReview.comment,
        verified: cleanReview.verified !== undefined ? Boolean(cleanReview.verified) : true,
        sizePurchased: cleanReview.sizePurchased || null,
        fitFeedback: cleanReview.fitFeedback || null,
        helpfulCount: Number(cleanReview.helpfulCount || 0),
        is_featured: Boolean(cleanReview.is_featured),
      },
      create: {
        id: cleanReview.id,
        product_id: cleanReview.product_id,
        product_name: cleanReview.product_name || null,
        author: cleanReview.author,
        location: cleanReview.location || null,
        rating: Number(cleanReview.rating),
        date: cleanReview.date || "Just now",
        title: cleanReview.title,
        comment: cleanReview.comment,
        verified: cleanReview.verified !== undefined ? Boolean(cleanReview.verified) : true,
        sizePurchased: cleanReview.sizePurchased || null,
        fitFeedback: cleanReview.fitFeedback || null,
        helpfulCount: Number(cleanReview.helpfulCount || 0),
        is_featured: Boolean(cleanReview.is_featured),
        created_at: new Date(cleanReview.created_at || Date.now()),
      },
    });
  } catch (err) {
    console.warn("Prisma saveStoreReview notice:", err);
  }

  const data = await readStoreData();
  if (!data.reviews) data.reviews = [];
  const existingIdx = data.reviews.findIndex((r) => r.id === cleanReview.id);
  if (existingIdx >= 0) {
    data.reviews[existingIdx] = { ...data.reviews[existingIdx], ...cleanReview };
  } else {
    data.reviews.unshift(cleanReview);
  }
  await writeStoreData(data);
  return cleanReview;
}

export async function updateStoreReview(
  id: string,
  updates: Partial<StoreReview>
): Promise<StoreReview | null> {
  try {
    await prisma.review.update({
      where: { id },
      data: {
        ...(updates.author !== undefined && { author: updates.author }),
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.comment !== undefined && { comment: updates.comment }),
        ...(updates.rating !== undefined && { rating: Number(updates.rating) }),
        ...(updates.is_featured !== undefined && { is_featured: Boolean(updates.is_featured) }),
        ...(updates.verified !== undefined && { verified: Boolean(updates.verified) }),
        ...(updates.helpfulCount !== undefined && { helpfulCount: Number(updates.helpfulCount) }),
        ...(updates.fitFeedback !== undefined && { fitFeedback: updates.fitFeedback }),
        ...(updates.sizePurchased !== undefined && { sizePurchased: updates.sizePurchased }),
      },
    });
  } catch (err) {
    console.warn("Prisma updateStoreReview notice:", err);
  }

  const data = await readStoreData();
  if (!data.reviews) data.reviews = [];
  const review = data.reviews.find((r) => r.id === id);
  if (!review) return null;
  Object.assign(review, updates);
  await writeStoreData(data);
  return review;
}

export async function deleteStoreReview(id: string): Promise<boolean> {
  try {
    await prisma.review.delete({ where: { id } });
  } catch (err) {
    console.warn("Prisma deleteStoreReview notice:", err);
  }

  const data = await readStoreData();
  if (!data.reviews) return false;
  const initialLen = data.reviews.length;
  data.reviews = data.reviews.filter((r) => r.id !== id);
  if (data.reviews.length !== initialLen) {
    await writeStoreData(data);
    return true;
  }
  return false;
}

// ----------------- Story Helpers -----------------

export async function getStoreStories(activeOnly = false): Promise<StoreStory[]> {
  const data = await readStoreData();
  const stories = (data.stories || []).sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );
  if (activeOnly) {
    return stories.filter((s) => s.active);
  }
  return stories;
}

export async function saveStoreStory(
  story: Partial<StoreStory> & { title: string; image: string }
): Promise<StoreStory> {
  const storyId = story.id || `story-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const cleanStory: StoreStory = {
    id: storyId,
    title: story.title.trim(),
    caption: story.caption?.trim() || undefined,
    image: story.image.trim(),
    link_url: story.link_url?.trim() || undefined,
    link_text: story.link_text?.trim() || "EXPLORE PIECE",
    duration: Number(story.duration) || 5,
    active: story.active !== undefined ? Boolean(story.active) : true,
    order_index: Number(story.order_index) || 0,
    views_count: Number(story.views_count) || 0,
    created_at: story.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await prisma.story.upsert({
      where: { id: cleanStory.id },
      update: {
        title: cleanStory.title,
        caption: cleanStory.caption || null,
        image: cleanStory.image,
        link_url: cleanStory.link_url || null,
        link_text: cleanStory.link_text || "EXPLORE PIECE",
        duration: cleanStory.duration,
        active: cleanStory.active,
        order_index: cleanStory.order_index,
      },
      create: {
        id: cleanStory.id,
        title: cleanStory.title,
        caption: cleanStory.caption || null,
        image: cleanStory.image,
        link_url: cleanStory.link_url || null,
        link_text: cleanStory.link_text || "EXPLORE PIECE",
        duration: cleanStory.duration,
        active: cleanStory.active,
        order_index: cleanStory.order_index,
        views_count: cleanStory.views_count || 0,
        created_at: new Date(cleanStory.created_at),
      },
    });
  } catch (err) {
    console.warn("Prisma saveStoreStory notice:", err);
  }

  const data = await readStoreData();
  if (!data.stories) data.stories = [];
  const existingIdx = data.stories.findIndex((s) => s.id === cleanStory.id);
  if (existingIdx >= 0) {
    data.stories[existingIdx] = { ...data.stories[existingIdx], ...cleanStory };
  } else {
    data.stories.push(cleanStory);
  }
  await writeStoreData(data);
  return cleanStory;
}

export async function updateStoreStory(
  id: string,
  updates: Partial<StoreStory>
): Promise<StoreStory | null> {
  try {
    await prisma.story.update({
      where: { id },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.caption !== undefined && { caption: updates.caption }),
        ...(updates.image !== undefined && { image: updates.image }),
        ...(updates.link_url !== undefined && { link_url: updates.link_url }),
        ...(updates.link_text !== undefined && { link_text: updates.link_text }),
        ...(updates.duration !== undefined && { duration: Number(updates.duration) }),
        ...(updates.active !== undefined && { active: Boolean(updates.active) }),
        ...(updates.order_index !== undefined && { order_index: Number(updates.order_index) }),
      },
    });
  } catch (err) {
    console.warn("Prisma updateStoreStory notice:", err);
  }

  const data = await readStoreData();
  if (!data.stories) data.stories = [];
  const story = data.stories.find((s) => s.id === id);
  if (!story) return null;
  Object.assign(story, updates, { updated_at: new Date().toISOString() });
  await writeStoreData(data);
  return story;
}

export async function deleteStoreStory(id: string): Promise<boolean> {
  try {
    await prisma.story.delete({ where: { id } });
  } catch (err) {
    console.warn("Prisma deleteStoreStory notice:", err);
  }

  const data = await readStoreData();
  if (!data.stories) return false;
  const initialLen = data.stories.length;
  data.stories = data.stories.filter((s) => s.id !== id);
  if (data.stories.length !== initialLen) {
    await writeStoreData(data);
    return true;
  }
  return false;
}

export async function incrementStoryViews(id: string): Promise<void> {
  try {
    await prisma.story.update({
      where: { id },
      data: { views_count: { increment: 1 } },
    });
  } catch {}

  const data = await readStoreData();
  if (data.stories) {
    const story = data.stories.find((s) => s.id === id);
    if (story) {
      story.views_count = (story.views_count || 0) + 1;
      await writeStoreData(data);
    }
  }
}

