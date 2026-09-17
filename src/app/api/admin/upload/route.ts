import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Support either multiple files under "files" or single/multiple under "file"
    const files = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ].filter((item): item is File => item instanceof File && item.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: "No files uploaded." },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];
    let isFileSystemAvailable = true;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch {
      // Vercel / Serverless read-only filesystem (/var/task)
      isFileSystemAvailable = false;
    }

    for (const file of files) {
      // Validate that file is an image or video
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (isFileSystemAvailable) {
        try {
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const originalExt = path.extname(file.name) || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
          const cleanBase = path
            .basename(file.name, originalExt)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .slice(0, 30);
          
          const fileName = `${cleanBase}-${timestamp}-${randomSuffix}${originalExt}`;
          const filePath = path.join(uploadDir, fileName);

          await fs.writeFile(filePath, buffer);
          uploadedUrls.push(`/uploads/${fileName}`);
          continue;
        } catch {
          // If disk write fails, fall back to base64 below
        }
      }

      // Base64 Data URL fallback for serverless / Vercel
      const mimeType = file.type || (file.name.endsWith(".mp4") ? "video/mp4" : "image/jpeg");
      const base64Str = `data:${mimeType};base64,${buffer.toString("base64")}`;
      uploadedUrls.push(base64Str);
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please upload valid media files (JPG, PNG, WEBP, MP4, WEBM)." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${uploadedUrls.length} file${uploadedUrls.length > 1 ? "s" : ""}.`,
      urls: uploadedUrls,
      url: uploadedUrls[0],
    });
  } catch (error: any) {
    console.error("POST /api/admin/upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload image files." },
      { status: 500 }
    );
  }
}
