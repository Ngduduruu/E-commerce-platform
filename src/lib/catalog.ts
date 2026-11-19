import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

// Catalog reads are cached and shared across requests. Anything that changes
// products (stock changes in the Stripe webhook, future admin edits) must call
// revalidateTag(PRODUCTS_TAG, ...) or updateTag(PRODUCTS_TAG).
export const PRODUCTS_TAG = "products";

export async function getProducts() {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");
  return db.product.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");
  return db.product.findFirst({ where: { slug, active: true } });
}
