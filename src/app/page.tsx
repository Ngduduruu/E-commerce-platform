import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { getProducts } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Products</h1>
      {products.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">No products yet. Run `npm run db:seed`.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/products/${p.slug}`} className="group block">
                <ProductImage name={p.name} imageUrl={p.imageUrl} />
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="font-medium group-hover:underline">{p.name}</span>
                  <span className="text-sm tabular-nums">{formatMoney(p.priceCents, p.currency)}</span>
                </div>
                {p.stock === 0 && <span className="text-xs text-red-600">Sold out</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
