import "server-only";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const supportedTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const bucket = "memory-media";
const localUploadDirectory = path.join(process.cwd(), ".local-uploads");
const storageConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
const admin = () => {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY?.replace(/\s/g, "");
  if (!url || !secret) throw new Error("Private photo storage is not configured.");
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
};

export async function saveLocalPhoto(file: File, userId: string) {
  const extension = supportedTypes[file.type];
  if (!extension) throw new Error("Please choose a JPEG, PNG, or WebP image.");
  if (file.size === 0 || file.size > MAX_FILE_SIZE) throw new Error("Photos must be between 1 byte and 25 MB.");
  const filename = `${randomUUID()}.${extension}`;
  if (storageConfigured()) {
    const objectPath = `users/${userId}/uploads/${filename}`;
    const { error } = await admin().storage.from(bucket).upload(objectPath, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (error) throw new Error("Photo upload failed. Please try again.");
    return { photoUrl: `supabase://${bucket}/${objectPath}`, metadata: { originalName: file.name, mimeType: file.type, size: file.size } };
  }
  await mkdir(localUploadDirectory, { recursive: true });
  await writeFile(path.join(localUploadDirectory, filename), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
  return { photoUrl: `/uploads/${filename}`, metadata: { originalName: file.name, mimeType: file.type, size: file.size } };
}

export async function removeLocalPhoto(photoUrl: string) {
  if (photoUrl.startsWith(`supabase://${bucket}/`)) {
    await admin().storage.from(bucket).remove([photoUrl.slice(`supabase://${bucket}/`.length)]);
    return;
  }
  if (!photoUrl.startsWith("/uploads/")) return;
  const filename = path.basename(photoUrl);
  await unlink(path.join(localUploadDirectory, filename)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}

export function getLocalUploadPath(filename: string) {
  return path.join(localUploadDirectory, filename);
}

export async function createPrivatePhotoUrl(photoUrl: string) {
  if (!photoUrl.startsWith(`supabase://${bucket}/`)) return photoUrl;
  const { data, error } = await admin().storage.from(bucket).createSignedUrl(photoUrl.slice(`supabase://${bucket}/`.length), 60);
  if (error || !data?.signedUrl) throw new Error("Photo is temporarily unavailable.");
  return data.signedUrl;
}
