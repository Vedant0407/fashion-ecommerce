import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding GreenO Atelier Database...");

  const dataDir = path.join(process.cwd(), "src", "data");
  const storeDataFile = path.join(dataDir, "store-data.json");
  const usersFile = path.join(dataDir, "users.json");

  let storeData: any = {};
  if (fs.existsSync(storeDataFile)) {
    try {
      storeData = JSON.parse(fs.readFileSync(storeDataFile, "utf-8"));
    } catch (e) {
      console.warn("Could not read store-data.json:", e);
    }
  }

  let usersData: any[] = [];
  if (fs.existsSync(usersFile)) {
    try {
      usersData = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
    } catch (e) {
      console.warn("Could not read users.json:", e);
    }
  }

  // 1. Seed Categories
  const categories = storeData.categories || [
    { id: "cat-shirts", name: "SHIRTS", slug: "shirts", description: "Architectural shirting crafted from Italian and Egyptian cottons." },
    { id: "cat-tshirts", name: "T-SHIRTS", slug: "t-shirts", description: "Heavyweight combed cotton luxury tees." },
    { id: "cat-pants", name: "PANTS / TROUSERS", slug: "pants", description: "Structured tailoring and relaxed drape trousers." },
    { id: "cat-hoodies", name: "HOODIES", slug: "hoodies", description: "Heavyweight architectural fleece." },
    { id: "cat-accessories", name: "ACCESSORIES", slug: "accessories", description: "Curated leather goods and essentials." },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        image: cat.image || null,
        description: cat.description || null,
      },
      create: {
        id: cat.id || `cat-${cat.slug}`,
        name: cat.name,
        slug: cat.slug,
        image: cat.image || null,
        description: cat.description || null,
      },
    });
  }
  console.log(`✓ Categories seeded (${categories.length})`);

  // 2. Seed Products
  const products = storeData.products || [
    {
      id: "tailored-poplin-shirt",
      name: "Tailored Poplin Shirt",
      price: 3499,
      description: "Architectural oversized collared shirt in crisp off-white Italian cotton poplin with mother-of-pearl buttons.",
      category_slug: "shirts",
      category_name: "SHIRTS",
      image: "/atelier-shirt.jpg",
      images: ["/atelier-shirt.jpg", "/atelier-shirt-detail.jpg"],
      stock: 22,
      is_featured: true,
      is_new: true,
      is_trending: true,
      color: "OFF-WHITE",
      product_no: "AT-SHT-01",
      material: "100% Egyptian Cotton Poplin",
      fabric: "Crisp 120s Poplin",
      fit: "Oversized Tailored Drape",
    },
    {
      id: "charcoal-oxford-overshirt",
      name: "Charcoal Oxford Overshirt",
      price: 3899,
      description: "Minimalist relaxed collared overshirt crafted from heavyweight Italian structured cotton oxford weave.",
      category_slug: "shirts",
      category_name: "SHIRTS",
      image: "/atelier-oxford-shirt.jpg",
      images: ["/atelier-oxford-shirt.jpg", "/atelier-oxford-detail.jpg"],
      stock: 18,
      is_featured: true,
      is_new: true,
      is_trending: true,
      color: "CHARCOAL",
      product_no: "AT-SHT-02",
      material: "100% Italian Oxford Cotton",
      fabric: "Heavyweight Structured Weave",
      fit: "Relaxed Boxy Silhouette",
    },
    {
      id: "oversized-black-tee",
      name: "Heavyweight Boxy Tee",
      price: 2499,
      description: "Architectural drop-shoulder t-shirt cut from 300gsm dense combed cotton jersey.",
      category_slug: "t-shirts",
      category_name: "T-SHIRTS",
      image: "/atelier-tshirt.jpg",
      images: ["/atelier-tshirt.jpg", "/atelier-tshirt-detail.jpg"],
      stock: 28,
      is_featured: true,
      is_new: true,
      is_trending: true,
      color: "BLACK",
      product_no: "AT-TEE-01",
      material: "100% Combed Heavy Cotton",
      fabric: "300gsm Heavy Jersey",
      fit: "Sculptural Boxy Cut",
    },
    {
      id: "minimalist-chalk-tee",
      name: "Minimalist Chalk Tee",
      price: 2499,
      description: "Clean off-white luxury tee with subtle dropped shoulders and ribbed neckband.",
      category_slug: "t-shirts",
      category_name: "T-SHIRTS",
      image: "/atelier-chalk-tee.jpg",
      images: ["/atelier-chalk-tee.jpg", "/atelier-chalk-detail.jpg"],
      stock: 24,
      is_featured: true,
      is_new: true,
      is_trending: true,
      color: "CHALK",
      product_no: "AT-TEE-02",
      material: "100% Combed Heavy Cotton",
      fabric: "280gsm Compact Jersey",
      fit: "Relaxed Atelier Silhouette",
    },
  ];

  for (const p of products) {
    const matchedCategory = await prisma.category.findUnique({
      where: { slug: p.category_slug || "shirts" },
    });

    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        price: Number(p.price),
        description: p.description || "",
        category_id: matchedCategory?.id || null,
        category_slug: p.category_slug || "shirts",
        category_name: p.category_name || "SHIRTS",
        image: p.image || "/atelier-shirt.jpg",
        images: JSON.stringify(p.images || [p.image || "/atelier-shirt.jpg"]),
        stock: Number(p.stock || 50),
        size_stock: JSON.stringify(p.size_stock || { S: 5, M: 10, L: 10, XL: 5, XXL: 0 }),
        colors: JSON.stringify(p.colors || [p.color || "BLACK"]),
        color: p.color || "BLACK",
        product_no: p.product_no || null,
        material: p.material || null,
        fabric: p.fabric || null,
        fit: p.fit || null,
        is_featured: Boolean(p.is_featured),
        is_new: Boolean(p.is_new),
        is_trending: Boolean(p.is_trending),
        collection_tag: p.collection_tag || null,
      },
      create: {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        description: p.description || "",
        category_id: matchedCategory?.id || null,
        category_slug: p.category_slug || "shirts",
        category_name: p.category_name || "SHIRTS",
        image: p.image || "/atelier-shirt.jpg",
        images: JSON.stringify(p.images || [p.image || "/atelier-shirt.jpg"]),
        stock: Number(p.stock || 50),
        size_stock: JSON.stringify(p.size_stock || { S: 5, M: 10, L: 10, XL: 5, XXL: 0 }),
        colors: JSON.stringify(p.colors || [p.color || "BLACK"]),
        color: p.color || "BLACK",
        product_no: p.product_no || null,
        material: p.material || null,
        fabric: p.fabric || null,
        fit: p.fit || null,
        is_featured: Boolean(p.is_featured),
        is_new: Boolean(p.is_new),
        is_trending: Boolean(p.is_trending),
        collection_tag: p.collection_tag || null,
      },
    });
  }
  console.log(`✓ Products seeded (${products.length})`);

  // 3. Seed Patrons / Users
  const users = usersData.length > 0 ? usersData : [
    {
      id: "usr_owner_vedant",
      name: "Vedant Shrivastava",
      email: "vedantshrivastava0407@gmail.com",
      provider: "email",
      email_verified: true,
      created_at: new Date().toISOString(),
    },
  ];

  for (const u of users) {
    if (!u.email) continue;
    await prisma.user.upsert({
      where: { email: u.email.toLowerCase().trim() },
      update: {
        name: u.name || "Atelier Patron",
        provider: u.provider || "email",
        email_verified: Boolean(u.email_verified),
        passwordHash: u.passwordHash || null,
      },
      create: {
        id: u.id || `usr-${Date.now()}`,
        name: u.name || "Atelier Patron",
        email: u.email.toLowerCase().trim(),
        provider: u.provider || "email",
        email_verified: Boolean(u.email_verified),
        passwordHash: u.passwordHash || null,
        created_at: u.created_at ? new Date(u.created_at) : new Date(),
      },
    });
  }
  console.log(`✓ Patrons seeded (${users.length})`);

  // 4. Seed Orders & Order Items
  const orders = storeData.orders || [];
  for (const o of orders) {
    if (!o.id) continue;
    const cust = o.customer || {};
    const existingOrder = await prisma.order.findUnique({ where: { id: o.id } });
    if (!existingOrder) {
      await prisma.order.create({
        data: {
          id: o.id,
          created_at: o.created_at ? new Date(o.created_at) : new Date(),
          customer_name: cust.fullName || "Patron",
          customer_email: cust.email || "patron@greeno.in",
          customer_phone: cust.phone || "",
          address: cust.address || "",
          city: cust.city || "",
          state: cust.state || "",
          pincode: cust.pincode || "",
          subtotal: Number(o.subtotal || o.total || 0),
          shipping: Number(o.shipping || 0),
          discount: Number(o.discount || 0),
          total: Number(o.total || 0),
          status: o.status || "confirmed",
          payment_method: o.payment_method || "COD",
          payment_status: o.payment_status || "pending",
          notes: o.notes || null,
          items: {
            create: (o.items || []).map((it: any) => ({
              product_id: it.product_id || null,
              name: it.name || "Garment",
              price: Number(it.price || 0),
              quantity: Number(it.quantity || 1),
              size: it.size || "M",
              color: it.color || "BLACK",
              image: it.image || null,
            })),
          },
        },
      });
    }
  }
  console.log(`✓ Orders seeded (${orders.length})`);

  // 5. Seed Reviews
  const reviews = storeData.reviews || [
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
    },
  ];

  for (const rev of reviews) {
    await prisma.review.upsert({
      where: { id: rev.id },
      update: {
        product_id: rev.product_id,
        product_name: rev.product_name,
        author: rev.author,
        location: rev.location || null,
        rating: Number(rev.rating),
        date: rev.date || "Recently",
        title: rev.title || "Atelier Experience",
        comment: rev.comment,
        verified: Boolean(rev.verified),
        sizePurchased: rev.sizePurchased || null,
        fitFeedback: rev.fitFeedback || null,
        helpfulCount: Number(rev.helpfulCount || 0),
        is_featured: Boolean(rev.is_featured),
      },
      create: {
        id: rev.id,
        product_id: rev.product_id,
        product_name: rev.product_name,
        author: rev.author,
        location: rev.location || null,
        rating: Number(rev.rating),
        date: rev.date || "Recently",
        title: rev.title || "Atelier Experience",
        comment: rev.comment,
        verified: Boolean(rev.verified),
        sizePurchased: rev.sizePurchased || null,
        fitFeedback: rev.fitFeedback || null,
        helpfulCount: Number(rev.helpfulCount || 0),
        is_featured: Boolean(rev.is_featured),
      },
    });
  }
  console.log(`✓ Reviews seeded (${reviews.length})`);

  // 6. Seed Coupons
  const coupons = storeData.coupons || [
    { code: "GREENO10", type: "percentage", value: 10, minOrder: 1000, description: "10% off on your entire atelier order", active: true },
    { code: "WELCOME15", type: "percentage", value: 15, minOrder: 1500, description: "15% off welcome discount for first-time patrons", active: true },
    { code: "ATELIER500", type: "fixed", value: 500, minOrder: 2500, description: "₹500 flat off on orders above ₹2,500", active: true },
    { code: "FREESHIP", type: "free_shipping", value: 199, minOrder: 0, description: "Complimentary express courier delivery across India", active: true },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code.toUpperCase() },
      update: {
        type: c.type,
        value: Number(c.value),
        minOrder: Number(c.minOrder || 0),
        description: c.description,
        active: Boolean(c.active),
        usage_count: Number(c.usage_count || 0),
      },
      create: {
        code: c.code.toUpperCase(),
        type: c.type,
        value: Number(c.value),
        minOrder: Number(c.minOrder || 0),
        description: c.description,
        active: Boolean(c.active),
        usage_count: Number(c.usage_count || 0),
      },
    });
  }
  console.log(`✓ Coupons seeded (${coupons.length})`);

  // 7. Seed Settings
  const settings = storeData.settings || {};
  await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {
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
  console.log("✓ Store Settings seeded");

  // 8. Seed Stories
  const stories = [
    {
      id: "story-drop-1",
      title: "DROP 01 // AUTUMN ATELIER",
      caption: "Architectural Italian Poplin shirting engineered with sculptural collar stances.",
      image: "/atelier-shirt.jpg",
      link_url: "/products/tailored-poplin-shirt",
      link_text: "EXPLORE PIECE",
      duration: 5,
      active: true,
      order_index: 0,
      views_count: 142,
    },
    {
      id: "story-heavyweight-tee",
      title: "300GSM COMBED JERSEY",
      caption: "Heavyweight drop-shoulder tee that moves with quiet elegance.",
      image: "/atelier-tshirt.jpg",
      link_url: "/products/oversized-black-tee",
      link_text: "VIEW PIECE",
      duration: 5,
      active: true,
      order_index: 1,
      views_count: 98,
    },
    {
      id: "story-oxford-overshirt",
      title: "STRUCTURED OXFORD WEAVE",
      caption: "Deep charcoal Italian cotton overshirt for layered architectural silhouettes.",
      image: "/atelier-oxford-shirt.jpg",
      link_url: "/products/charcoal-oxford-overshirt",
      link_text: "EXPLORE PIECE",
      duration: 5,
      active: true,
      order_index: 2,
      views_count: 76,
    },
    {
      id: "story-minimalist-chalk",
      title: "MINIMALIST CHALK PALETTE",
      caption: "Crisp luxury drop-shoulder crewneck tailored in Milan.",
      image: "/atelier-white-tee.jpg",
      link_url: "/products/minimalist-chalk-tee",
      link_text: "VIEW SILHOUETTE",
      duration: 5,
      active: true,
      order_index: 3,
      views_count: 54,
    },
  ];

  for (const s of stories) {
    await prisma.story.upsert({
      where: { id: s.id },
      update: {
        title: s.title,
        caption: s.caption,
        image: s.image,
        link_url: s.link_url,
        link_text: s.link_text,
        duration: s.duration,
        active: s.active,
        order_index: s.order_index,
      },
      create: s,
    });
  }
  console.log(`✓ Atelier Stories seeded (${stories.length})`);

  console.log("✨ GreenO Atelier Relational Database Successfully Seeded!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
