import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function isAllowedFile(file: File): boolean {
  return file.type === "application/pdf" || file.type.startsWith("image/");
}

function safeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 180) || "document";
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const documentType = formData.get("documentType");

  if (!(file instanceof File)) {
    return Response.json({ error: "File is required" }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "File must be 20 MB or smaller" }, { status: 400 });
  }
  if (!isAllowedFile(file)) {
    return Response.json({ error: "Upload a PDF or image file" }, { status: 400 });
  }
  if (typeof documentType !== "string" || documentType.trim().length === 0) {
    return Response.json({ error: "Document type is required" }, { status: 400 });
  }

  const pathname = [
    "documents",
    userId,
    documentType.replace(/[^a-zA-Z0-9_-]+/g, "-"),
    `${crypto.randomUUID()}-${safeFilename(file.name)}`,
  ].join("/");

  const blob = await put(pathname, file, { access: "private" });

  return Response.json({
    url: blob.url,
    pathname: blob.pathname,
    originalFilename: file.name,
    contentType: file.type || null,
    size: file.size,
  });
}
