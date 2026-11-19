import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { updateCartItem } from "@/app/actions";
import { CheckoutButton } from "@/components/checkout-button";
import { ProductImage } from "@/components/product-image";
import { getCartLines, MAX_QTY } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <Suspense fallback={<p className="text-black/60 dark:text-white/60">Loading cart…</p>}>
      <CartContents />
    </Suspense>
  );
}

// Reads the cart cookie, so it renders per request.
async function CartContents() {
  const lines = await getCartLines();

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Your cart is empty</h1>
        <Link href="/" className="underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  const currency = lines[0].product.currency;
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Cart</h1>
      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {lines.map(({ product, quantity, lineTotalCents }) => (
          <li key={product.id} className="flex items-center gap-4 py-4">
            <ProductImage name={product.name} imageUrl={product.imageUrl} className="w-20 shrink-0" />
            <div className="flex-1">
              <Link href={`/products/${product.slug}`} className="font-medium hover:underline">
                {product.name}
              </Link>
              <p className="text-sm text-black/60 tabular-nums dark:text-white/60">
                {formatMoney(product.priceCents, product.currency)} each
              </p>
              {quantity > product.stock && (
                <p className="text-sm text-red-600">Only {product.stock} left</p>
              )}
            </div>
            <form action={updateCartItem} className="flex items-center gap-2">
              <input type="hidden" name="productId" value={product.id} />
              <select
                name="quantity"
                defaultValue={quantity}
                aria-label={`Quantity of ${product.name}`}
                className="rounded-md border border-black/15 bg-background px-2 py-1 dark:border-white/20"
              >
                {Array.from({ length: MAX_QTY + 1 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? "Remove" : i}
                  </option>
                ))}
              </select>
              <button type="submit" className="text-sm underline">
                Update
              </button>
            </form>
            <span className="w-20 text-right tabular-nums">{formatMoney(lineTotalCents, currency)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col items-end gap-4 border-t border-black/10 pt-6 dark:border-white/10">
        <p className="text-lg">
          Subtotal <span className="font-semibold tabular-nums">{formatMoney(subtotal, currency)}</span>
        </p>
        <CheckoutButton />
      </div>
    </div>
  );
}
