import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const migrationName = "20261016000100_full_store_reset";
const mediaBucket = "store-assets";

async function listFiles(
  supabase: SupabaseClient,
  prefix: string,
  paths: string[],
): Promise<void> {
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(mediaBucket).list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error("Unable to list store media; reset stopped safely.");

    for (const entry of data || []) {
      const path = prefix ? prefix + "/" + entry.name : entry.name;
      if (entry.id) paths.push(path);
      else await listFiles(supabase, path, paths);
    }

    if (!data || data.length < 100) break;
    offset += data.length;
  }
}

async function removeStoreMedia(supabase: SupabaseClient): Promise<number> {
  const { data: bucket, error } = await supabase.storage.getBucket(mediaBucket);
  if (error) {
    if (error.statusCode === "404" || /not found/i.test(error.message)) return 0;
    throw new Error("Unable to inspect store media; reset stopped safely.");
  }
  if (!bucket) return 0;

  const paths: string[] = [];
  await listFiles(supabase, "", paths);
  for (let index = 0; index < paths.length; index += 100) {
    const { error: removeError } = await supabase.storage
      .from(mediaBucket)
      .remove(paths.slice(index, index + 100));
    if (removeError) throw new Error("Unable to remove all store media; reset stopped safely.");
  }
  return paths.length;
}

async function main() {
  if (process.env.CONFIRM_FULL_STORE_RESET !== "YES") {
    throw new Error("Set CONFIRM_FULL_STORE_RESET=YES to confirm the permanent store-data wipe. Supabase accounts are preserved.");
  }

  const databaseUrl = process.env.DATABASE_URL || "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!/^postgres(ql)?:\/\//i.test(databaseUrl) || !supabaseUrl || !serviceRoleKey) {
    throw new Error("Postgres and Supabase server credentials are not configured.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const prisma = new PrismaClient();

  try {
    const applied = await prisma.$queryRawUnsafe<Array<{ migration_name: string; finished_at: Date | null }>>(
      'SELECT migration_name, finished_at FROM public."_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL LIMIT 1',
      migrationName,
    );
    if (applied.length === 0) {
      throw new Error("The full-store migration must complete before the account and media reset can run.");
    }

    const deletedMedia = await removeStoreMedia(supabase);
    await prisma.returnItem.deleteMany();
    await prisma.returnRequest.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.address.deleteMany();
    await prisma.review.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.story.deleteMany();
    await prisma.storeSetting.deleteMany();

    process.stdout.write(
      "Full store reset complete. Preserved Supabase accounts and commerce profiles; removed " +
        deletedMedia +
        " stored media file(s).\n",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  process.stderr.write((error instanceof Error ? error.message : "Store reset failed.") + "\n");
  process.exitCode = 1;
});
