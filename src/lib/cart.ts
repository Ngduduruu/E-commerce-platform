import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";

// The cookie only stores product ids and quantities. Names and prices are
// always read from the database, so a tampered cookie can't change prices.
const CART_COOKIE = "cart";
export const MAX_QTY = 10;

const cartSchema = z.array(
  z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(MAX_QTY),
  }),
);

export type CartEntry = z.infer<typeof cartSchema>[number];

export async function readCart(): Promise<CartEntry[]> {
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = cartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/** Only callable from Server Actions or Route Handlers. */
export async function writeCart(entries: CartEntry[]) {
  const store = await cookies();
  if (entries.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, JSON.stringify(entries), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getCartCount() {
  return (await readCart()).reduce((n, e) => n + e.quantity, 0);
}

/** Cart entries joined with current product data; drops inactive/missing products. */
export async function getCartLines() {
  const entries = await readCart();
  if (entries.length === 0) return [];
  const products = await db.product.findMany({
    where: { id: { in: entries.map((e) => e.productId) }, active: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return entries.flatMap((e) => {
    const product = byId.get(e.productId);
    return product
      ? [{ product, quantity: e.quantity, lineTotalCents: product.priceCents * e.quantity }]
      : [];
  });
}
