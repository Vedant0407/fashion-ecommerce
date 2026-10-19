import { Product, Category } from "./catalog";
import { prisma } from "@/lib/prisma";
import type { StoreStory } from "./story-constants";


export type { StoreStory };


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
  user_id?: string;
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
  currency: string;
  emailConfigured?: boolean;
  smsConfigured?: boolean;
};

export type StoreReview = {
  id: string;
  product_id: string;
  product_name?: string;
  author: string;
  user_id?: string;
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

const DEFAULT_SETTINGS: StoreSettings = {
  announcementText: "COMPLIMENTARY SHIPPING ACROSS INDIA • COD AVAILABLE • NEW DROP IS LIVE",
  storeNotice: "All orders placed today are dispatched within 24 hours.",
  supportPhone: "+91 98765 43210",
  supportEmail: "concierge@greeno.in",
  currency: "INR",
};

export const DEFAULT_REVIEWS: StoreReview[] = [];
let memoryData: StoreData | null = null;
const inMemoryOrderStatusOverrides = new Map<
  string,
  { status: StoreOrder["status"]; payment_status?: StoreOrder["payment_status"] }
>();
const inMemoryDeletedStoryIds = new Set<string>();

export function loadDeletedStories() {}
export function addDeletedStoryId(id: string) { inMemoryDeletedStoryIds.add(id); }
export function loadOrderStatusOverrides() {}
export function setOrderStatusOverride(
  orderId: string,
  status: StoreOrder["status"],
  payment_status?: StoreOrder["payment_status"]
) {
  inMemoryOrderStatusOverrides.set(orderId, { status, payment_status });
}
export function getInMemoryOrderStatusOverrides(): Record<string, string> {
  return {};
}
export function getInitialData(): StoreData {
  return {
    products: [],
    categories: [],
    orders: [],
    returns: [],
    coupons: [],
    settings: DEFAULT_SETTINGS,
    reviews: [],
    stories: [],
  };
}


export async function readStoreData(_forceFresh = false): Promise<StoreData> {
  const [products, categories, orders, returns, reviews, coupons, stories, settings] = await Promise.all([
    prisma.product.findMany(),
    prisma.category.findMany(),
    prisma.order.findMany({ include: { items: true }, orderBy: { created_at: "desc" } }),
    prisma.returnRequest.findMany({ include: { items: true }, orderBy: { created_at: "desc" } }),
    prisma.review.findMany({ orderBy: { created_at: "desc" } }),
    prisma.coupon.findMany(),
    prisma.story.findMany({ orderBy: { order_index: "asc" } }),
    prisma.storeSetting.findUnique({ where: { id: "default" } }),
  ]);
  const parseJson = <T,>(value: string, fallback: T): T => {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  };
  const data: StoreData = {
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      category_id: product.category_id || undefined,
      category_slug: product.category_slug,
      category_name: product.category_name,
      image: product.image,
      images: parseJson<string[]>(product.images, [product.image]),
      stock: product.stock,
      size_stock: parseJson<Record<string, number>>(product.size_stock, {}),
      colors: parseJson<string[]>(product.colors, [product.color]),
      color: product.color,
      product_no: product.product_no || undefined,
      material: product.material || undefined,
      fabric: product.fabric || undefined,
      fit: product.fit || undefined,
      is_featured: product.is_featured,
      is_new: product.is_new,
      is_trending: product.is_trending,
      collection_tag: product.collection_tag || undefined,
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image || undefined,
      description: category.description || undefined,
    })),
    orders: orders.map((order) => ({
      id: order.id,
      created_at: order.created_at.toISOString(),
      user_id: order.user_id || undefined,
      customer: {
        fullName: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        address: order.address,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
      },
      items: order.items.map((item) => ({
        id: item.id,
        product_id: item.product_id || "",
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || undefined,
        size: item.size || undefined,
        color: item.color || undefined,
      })),
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      status: order.status as StoreOrder["status"],
      payment_method: order.payment_method,
      payment_status: order.payment_status as StoreOrder["payment_status"],
      notes: order.notes || undefined,
    })),
    returns: returns.map((record) => ({
      id: record.id,
      order_id: record.order_id,
      created_at: record.created_at.toISOString(),
      type: record.type as ReturnExchangeRequest["type"],
      status: record.status as ReturnExchangeRequest["status"],
      customer: {
        fullName: record.customer_name,
        email: record.customer_email,
        phone: record.customer_phone,
        address: record.pickup_address || "",
        city: "",
        state: "",
        pincode: "",
      },
      items: record.items.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || undefined,
        color: item.color || undefined,
        image: item.image || undefined,
        exchange_size: item.exchange_size || undefined,
        exchange_color: item.exchange_color || undefined,
        reason: item.reason || undefined,
      })),
      reason_category: record.reason_category,
      customer_notes: record.customer_notes || undefined,
      admin_notes: record.admin_notes || undefined,
      pickup_address: record.pickup_address || undefined,
      resolved_at: record.resolved_at?.toISOString() || undefined,
    })),
    reviews: reviews.map((review) => ({
      id: review.id,
      product_id: review.product_id,
      product_name: review.product_name || undefined,
      author: review.author,
      location: review.location || undefined,
      rating: review.rating,
      date: review.date,
      title: review.title,
      comment: review.comment,
      verified: review.verified,
      sizePurchased: review.sizePurchased || undefined,
      fitFeedback: (review.fitFeedback as StoreReview["fitFeedback"]) || undefined,
      helpfulCount: review.helpfulCount,
      is_featured: review.is_featured,
      created_at: review.created_at.toISOString(),
    })),
    coupons: coupons.map((coupon) => ({
      code: coupon.code,
      type: coupon.type as StoreCoupon["type"],
      value: coupon.value,
      minOrder: coupon.minOrder,
      description: coupon.description,
      active: coupon.active,
      usage_count: coupon.usage_count,
    })),
    settings: settings ? {
      announcementText: settings.announcementText,
      storeNotice: settings.storeNotice,
      supportPhone: settings.supportPhone,
      supportEmail: settings.supportEmail,
      currency: settings.currency,
    } : DEFAULT_SETTINGS,
    stories: stories.map((story) => ({
      id: story.id,
      title: story.title,
      caption: story.caption || undefined,
      image: story.image,
      link_url: story.link_url || undefined,
      link_text: story.link_text || undefined,
      duration: story.duration,
      active: story.active,
      order_index: story.order_index,
      views_count: story.views_count,
      created_at: story.created_at.toISOString(),
      updated_at: story.updated_at.toISOString(),
    })),
  };
  memoryData = data;
  return data;
}
export async function writeStoreData(data: StoreData): Promise<void> {
  // Database mutations are performed by each helper before updating this request-local cache.
  // No filesystem fallback is used; serverless filesystems are not persistent storage.
  memoryData = data;
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
  } catch (err) { throw err; }

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
  } catch (err) { throw err; }

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
  } catch (err) { throw err; }

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
  } catch (err) { throw err; }

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
        ...(order.user_id ? { user_id: order.user_id } : {}),
      },
      create: {
        id: order.id,
        ...(order.user_id ? { user_id: order.user_id } : {}),
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
  } catch (err) { throw err; }

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
  _fallbackOrder?: Partial<StoreOrder>
): Promise<StoreOrder | null> {
  await prisma.order.update({
    where: { id: orderId },
    data: { status, ...(payment_status ? { payment_status } : {}) },
  });
  const data = await readStoreData(true);
  return data.orders.find((order) => order.id === orderId) || null;
}

export async function syncStoreOrders(_clientOrders: StoreOrder[]): Promise<StoreOrder[]> {
  return getStoreOrders(true);
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
  } catch (err) { throw err; }

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
  } catch (err) { throw err; }

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
  const emailConfigured = Boolean(
    (process.env.SMTP_USER && process.env.SMTP_PASS) ||
    process.env.BREVO_API_KEY ||
    process.env.RESEND_API_KEY
  );
  const smsConfigured = Boolean(
    process.env.FAST2SMS_API_KEY ||
    process.env.TWO_FACTOR_API_KEY ||
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
  );
  return { ...data.settings, emailConfigured, smsConfigured };
}

export async function saveStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const safeSettings = {
    ...(settings.announcementText !== undefined && { announcementText: String(settings.announcementText).slice(0, 240) }),
    ...(settings.storeNotice !== undefined && { storeNotice: String(settings.storeNotice).slice(0, 1000) }),
    ...(settings.supportPhone !== undefined && { supportPhone: String(settings.supportPhone).slice(0, 40) }),
    ...(settings.supportEmail !== undefined && { supportEmail: String(settings.supportEmail).slice(0, 254) }),
    ...(settings.currency !== undefined && { currency: String(settings.currency).slice(0, 8) }),
  };
  const saved = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: safeSettings,
    create: {
      id: "default",
      announcementText: safeSettings.announcementText ?? DEFAULT_SETTINGS.announcementText,
      storeNotice: safeSettings.storeNotice ?? DEFAULT_SETTINGS.storeNotice,
      supportPhone: safeSettings.supportPhone ?? DEFAULT_SETTINGS.supportPhone,
      supportEmail: safeSettings.supportEmail ?? DEFAULT_SETTINGS.supportEmail,
      currency: safeSettings.currency ?? DEFAULT_SETTINGS.currency,
    },
  });
  const result: StoreSettings = {
    announcementText: saved.announcementText,
    storeNotice: saved.storeNotice,
    supportPhone: saved.supportPhone,
    supportEmail: saved.supportEmail,
    currency: saved.currency,
  };
  if (memoryData) memoryData.settings = result;
  return result;
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
  } catch (err) { throw err; }

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
  } catch (err) { throw err; }

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
  } catch (err) { throw err; }

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
        ...(cleanReview.user_id ? { user_id: cleanReview.user_id } : {}),
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
        ...(cleanReview.user_id ? { user_id: cleanReview.user_id } : {}),
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
  } catch (err) { throw err; }

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
  } catch (err) { throw err; }

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
  } catch (err) { throw err; }

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
  } catch (err) { throw err; }

  inMemoryDeletedStoryIds.delete(cleanStory.id);

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
  } catch (err) { throw err; }

  const data = await readStoreData();
  if (!data.stories) data.stories = [];
  const story = data.stories.find((s) => s.id === id);
  if (!story) return null;
  Object.assign(story, updates, { updated_at: new Date().toISOString() });
  await writeStoreData(data);
  return story;
}

export async function deleteStoreStory(id: string): Promise<boolean> {
  addDeletedStoryId(id);
  try {
    await prisma.story.delete({ where: { id } });
  } catch (err) { throw err; }

  const data = await readStoreData();
  if (data.stories) {
    data.stories = data.stories.filter((s) => s.id !== id);
  }
  if (memoryData?.stories) {
    memoryData.stories = memoryData.stories.filter((s) => s.id !== id);
  }
  await writeStoreData(data);
  return true;
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
