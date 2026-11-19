import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { addToCart } from "@/app/actions";
import { ProductImage } from "@/components/product-image";
import { MAX_QTY } from "@/lib/cart";
import { getProductBySlug } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

async function ProductDetails({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const maxQty = Math.min(product.stock, MAX_QTY);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProductImage name={product.name} imageUrl={product.imageUrl} />
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
        <p className="text-xl tabular-nums">{formatMoney(product.priceCents, product.currency)}</p>
        <p className="text-black/70 dark:text-white/70">{product.description}</p>

        {maxQty > 0 ? (
          <form action={addToCart} className="mt-2 flex items-center gap-3">
            <input type="hidden" name="productId" value={product.id} />
            <label className="sr-only" htmlFor="quantity">
              Quantity
            </label>
            <select
              id="quantity"
              name="quantity"
              defaultValue="1"
              className="rounded-md border border-black/15 bg-background px-3 py-2 dark:border-white/20"
            >
              {Array.from({ length: maxQty }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background"
            >
              Add to cart
            </button>
          </form>
        ) : (
          <p className="text-red-600">Sold out</p>
        )}
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid animate-pulse gap-8 md:grid-cols-2">
      <div className="aspect-square rounded-lg bg-black/5 dark:bg-white/10" />
      <div className="flex flex-col gap-4">
        <div className="h-9 w-2/3 rounded bg-black/5 dark:bg-white/10" />
        <div className="h-6 w-24 rounded bg-black/5 dark:bg-white/10" />
        <div className="h-20 rounded bg-black/5 dark:bg-white/10" />
      </div>
    </div>
  );
}
