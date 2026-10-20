import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { sniffImageType } from "./image-type";

// Fotos de comercios y productos. Con SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY van a Supabase Storage
// (bucket público SUPABASE_STORAGE_BUCKET). Sin credenciales, solo en desarrollo, se guardan en
// public/uploads (como DevLogTransport con WhatsApp); en producción sin credenciales se rechaza.

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export type ImageFolder = "stores" | "products";

const DEV_DIR = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPE = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key, bucket: process.env.SUPABASE_STORAGE_BUCKET || "dfly" };
}

export class ImageUploadError extends Error {}

/** Sube la imagen y devuelve su URL pública. Lanza `ImageUploadError` con un mensaje para el admin. */
export async function uploadImage(file: File, folder: ImageFolder): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) throw new ImageUploadError("La foto pesa más de 4 MB. Usa una más liviana.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniffImageType(bytes);
  if (!ext) throw new ImageUploadError("Sube una foto en JPG, PNG o WebP.");
  const name = `${folder}/${randomUUID()}.${ext}`;

  const supabase = supabaseConfig();
  if (supabase) {
    const client = createClient(supabase.url, supabase.key, { auth: { persistSession: false } });
    const { error } = await client.storage
      .from(supabase.bucket)
      .upload(name, bytes, { contentType: CONTENT_TYPE[ext], cacheControl: "31536000", upsert: false });
    if (error) {
      console.error("[storage] Supabase rechazó la subida", error);
      throw new ImageUploadError("No pudimos subir la foto. Inténtalo de nuevo.");
    }
    return client.storage.from(supabase.bucket).getPublicUrl(name).data.publicUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new ImageUploadError("La subida de fotos no está configurada (faltan las credenciales de Supabase).");
  }
  await mkdir(path.join(DEV_DIR, folder), { recursive: true });
  await writeFile(path.join(DEV_DIR, name), bytes);
  console.log(`[storage:dev] ${name} guardada en public/uploads`);
  return `/uploads/${name}`;
}

/** Borra una foto que ya no se usa. Si falla, solo queda un archivo huérfano: no se interrumpe al admin. */
export async function deleteImage(url: string | null) {
  if (!url) return;
  try {
    const supabase = supabaseConfig();
    const publicPrefix = supabase ? `${supabase.url}/storage/v1/object/public/${supabase.bucket}/` : null;
    if (supabase && publicPrefix && url.startsWith(publicPrefix)) {
      const client = createClient(supabase.url, supabase.key, { auth: { persistSession: false } });
      await client.storage.from(supabase.bucket).remove([url.slice(publicPrefix.length)]);
    } else if (/^\/uploads\/(stores|products)\/[\w-]+\.(jpg|png|webp)$/.test(url)) {
      await unlink(path.join(process.cwd(), "public", url));
    }
  } catch (error) {
    console.error("[storage] No se pudo borrar la foto anterior", error);
  }
}
