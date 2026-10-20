"use server";

import { after } from "next/server";
import { refresh, revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { deleteImage, ImageUploadError, uploadImage, type ImageFolder } from "@/lib/storage";
import {
  idSchema,
  optionGroupsErrorMessage,
  optionGroupsSchema,
  productSchema,
  storeSchema,
  type StoreInput,
} from "@/lib/validations/admin";
import { assertAdmin } from "@/modules/identity/session";
import { dispatchOutbox } from "@/modules/messaging/outbox";
import { cancelOrderByAdmin } from "@/modules/ordering/admin-cancel";
import { canRetryMessage, slugify } from "./domain";
import { syncOptionGroups } from "./product-options";

export type AdminFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  values?: Record<string, string>;
  /**
   * Adónde navegar tras guardar. Lo hace el formulario en el cliente: con `redirect()` dentro de la
   * acción, el botón se quedaba en "Guardando…" si la navegación se colgaba, aunque ya se hubiera guardado.
   */
  redirectTo?: string;
};

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}

function formValues(formData: FormData) {
  const out: Record<string, string> = {};
  for (const [k, v] of formData) if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
}

// ───────────── Pedidos ─────────────

const CANCEL_ERRORS = {
  "not-found": "Este pedido ya no existe.",
  "not-cancellable": "Este pedido ya no se puede cancelar.",
  "changed-meanwhile": "El pedido cambió de estado mientras tanto. Revisa y vuelve a intentar.",
} as const;

export async function cancelOrderAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await assertAdmin();
  const orderId = idSchema.safeParse(formData.get("orderId"));
  if (!orderId.success) return { error: "Pedido inválido." };

  const result = await cancelOrderByAdmin(orderId.data);
  if (result !== "cancelled") return { error: CANCEL_ERRORS[result] };

  after(() => dispatchOutbox({ orderId: orderId.data }));
  refresh();
  return { ok: true };
}

export async function retryMessageAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await assertAdmin();
  const messageId = idSchema.safeParse(formData.get("messageId"));
  if (!messageId.success) return { error: "Mensaje inválido." };

  const msg = await prisma.outboxMessage.findUnique({
    where: { id: messageId.data },
    select: { kind: true, status: true, orderId: true, order: { select: { status: true } } },
  });
  if (!msg || !canRetryMessage(msg.kind, msg.status, msg.order.status)) {
    return { error: "Este mensaje ya no se puede reintentar." };
  }

  // Condicionado a FAILED: si dos admins pulsan a la vez, solo uno lo reencola.
  const { count } = await prisma.outboxMessage.updateMany({
    where: { id: messageId.data, status: "FAILED" },
    data: { status: "PENDING", attempts: 0, nextAttemptAt: new Date(), lastError: null },
  });
  if (count > 0) after(() => dispatchOutbox({ orderId: msg.orderId }));
  refresh();
  return { ok: true };
}

// ───────────── Comercios ─────────────

export async function saveStoreAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await assertAdmin();
  const values = formValues(formData);
  const parsed = storeSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues), values };

  const storeId = formData.get("storeId");
  const editingId = typeof storeId === "string" && storeId ? idSchema.parse(storeId) : null;
  const previous = editingId
    ? await prisma.store.findUnique({ where: { id: editingId }, select: { imageUrl: true } })
    : null;

  const image = await imageFromForm(formData, "stores", previous?.imageUrl ?? null);
  if ("error" in image) return { fieldErrors: { image: image.error }, values };

  if (editingId) {
    // El slug no cambia al editar: es la URL pública del comercio.
    await prisma.store.update({ where: { id: editingId }, data: { ...parsed.data, imageUrl: image.url }, select: { id: true } });
    if (image.replaced) after(() => deleteImage(image.replaced));
    refresh();
    return { ok: true, values };
  }

  const created = await createStoreWithUniqueSlug({ ...parsed.data, imageUrl: image.url });
  revalidatePath("/admin/comercios");
  return { ok: true, redirectTo: `/admin/comercios/${created.id}?nuevo=1` };
}

/**
 * Lee la foto del formulario (`image`, y `removeImage` para quitarla). Sube la nueva si la hay y
 * devuelve la URL que debe quedar guardada, más la anterior para borrarla tras guardar.
 */
async function imageFromForm(
  formData: FormData,
  folder: ImageFolder,
  current: string | null,
): Promise<{ url: string | null; replaced: string | null } | { error: string }> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      return { url: await uploadImage(file, folder), replaced: current };
    } catch (error) {
      if (error instanceof ImageUploadError) return { error: error.message };
      throw error;
    }
  }
  if (formData.get("removeImage") === "on") return { url: null, replaced: current };
  return { url: current, replaced: null };
}

async function createStoreWithUniqueSlug(data: StoreInput & { imageUrl: string | null }) {
  const base = slugify(data.name) || "comercio";
  for (let n = 1; n <= 20; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    try {
      return await prisma.store.create({ data: { ...data, slug }, select: { id: true } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error(`No se encontró un slug libre para "${data.name}"`);
}

export async function toggleStoreActiveAction(formData: FormData) {
  await assertAdmin();
  const id = idSchema.parse(formData.get("storeId"));
  const isActive = formData.get("isActive") === "true";
  await prisma.store.update({ where: { id }, data: { isActive }, select: { id: true } });
  refresh();
}

// ───────────── Productos ─────────────

export async function saveProductAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await assertAdmin();
  const values = formValues(formData);
  const parsed = productSchema.safeParse(values);
  const groups = optionGroupsSchema.safeParse(values.optionGroups);
  if (!parsed.success || !groups.success) {
    const fieldErrors = parsed.success ? {} : fieldErrorsFrom(parsed.error.issues);
    if (!groups.success) fieldErrors.optionGroups = optionGroupsErrorMessage(groups.error.issues[0]!);
    return { fieldErrors, values };
  }
  const { price, ...rest } = parsed.data;
  const data = { ...rest, priceCents: price };

  const productId = formData.get("productId");
  if (typeof productId === "string" && productId) {
    const id = idSchema.parse(productId);
    const previous = await prisma.product.findUnique({ where: { id }, select: { imageUrl: true } });
    if (!previous) return { error: "Este producto ya no existe.", values };
    const image = await imageFromForm(formData, "products", previous.imageUrl);
    if ("error" in image) return { fieldErrors: { image: image.error }, values };

    const product = await prisma.$transaction(async (tx) => {
      const saved = await tx.product.update({ where: { id }, data: { ...data, imageUrl: image.url }, select: { storeId: true } });
      await syncOptionGroups(tx, id, groups.data);
      return saved;
    });
    if (image.replaced) after(() => deleteImage(image.replaced));
    return savedProduct(product.storeId);
  }

  const storeId = idSchema.safeParse(formData.get("storeId"));
  if (!storeId.success) return { error: "Comercio inválido.", values };
  const store = await prisma.store.findUnique({ where: { id: storeId.data }, select: { id: true } });
  if (!store) return { error: "Este comercio ya no existe.", values };
  const image = await imageFromForm(formData, "products", null);
  if ("error" in image) return { fieldErrors: { image: image.error }, values };

  await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({ data: { ...data, imageUrl: image.url, storeId: store.id }, select: { id: true } });
    await syncOptionGroups(tx, created.id, groups.data);
  });
  return savedProduct(store.id);
}

function savedProduct(storeId: string): AdminFormState {
  const storePath = `/admin/comercios/${storeId}`;
  // La lista de productos del comercio debe verse ya con el cambio al volver.
  revalidatePath(storePath);
  return { ok: true, redirectTo: storePath };
}

export async function toggleProductAvailableAction(formData: FormData) {
  await assertAdmin();
  const id = idSchema.parse(formData.get("productId"));
  const isAvailable = formData.get("isAvailable") === "true";
  await prisma.product.update({ where: { id }, data: { isAvailable }, select: { id: true } });
  refresh();
}
