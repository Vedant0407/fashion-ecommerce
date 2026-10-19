import { randomUUID } from "crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const bucketName = "store-assets";
const maxFileBytes = 50 * 1024 * 1024;
const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

function mediaFolder(value: FormDataEntryValue | null): string {
  if (value === "categories" || value === "stories") return value;
  return "products";
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, message: "Persistent media storage is not configured on the server." }, { status: 503 });
    }

    const formData = await request.formData();
    const files = [...formData.getAll("files"), ...formData.getAll("file")]
      .filter((value): value is File => value instanceof File && value.size > 0);
    if (files.length < 1 || files.length > 10) {
      return NextResponse.json({ success: false, message: "Upload between 1 and 10 files at a time." }, { status: 400 });
    }
    for (const file of files) {
      if (!allowedTypes[file.type] || file.size > maxFileBytes) {
        return NextResponse.json({ success: false, message: "Use JPG, PNG, WEBP, GIF, AVIF, MP4, or WEBM files up to 50 MB each." }, { status: 400 });
      }
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket(bucketName);
    if (!bucket && bucketError) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: maxFileBytes,
        allowedMimeTypes: Object.keys(allowedTypes),
      });
      if (createError && !/already exists/i.test(createError.message)) {
        console.error("Could not initialize persistent media storage.");
        return NextResponse.json({ success: false, message: "Could not initialize persistent media storage." }, { status: 503 });
      }
    } else if (bucket && !bucket.public) {
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: maxFileBytes,
        allowedMimeTypes: Object.keys(allowedTypes),
      });
      if (updateError) {
        console.error("Could not configure persistent media storage.");
        return NextResponse.json({ success: false, message: "Could not configure persistent media storage." }, { status: 503 });
      }
    }

    const folder = mediaFolder(formData.get("type"));
    const urls: string[] = [];
    for (const file of files) {
      const objectPath = folder + "/" + randomUUID() + "." + allowedTypes[file.type];
      const { error } = await supabase.storage.from(bucketName).upload(objectPath, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false,
        cacheControl: "31536000",
      });
      if (error) {
        console.error("Persistent media upload failed.");
        return NextResponse.json({ success: false, message: "One or more files could not be saved." }, { status: 503 });
      }
      urls.push(supabase.storage.from(bucketName).getPublicUrl(objectPath).data.publicUrl);
    }

    return NextResponse.json({ success: true, count: urls.length, urls, url: urls[0] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/admin/upload failed.");
    return NextResponse.json({ success: false, message: "Could not save the uploaded media." }, { status: 503 });
  }
}
