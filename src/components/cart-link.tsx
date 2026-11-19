import Link from "next/link";
import { getCartCount } from "@/lib/cart";

// Reads the cart cookie, so it renders per request inside a <Suspense> boundary.
export async function CartLink() {
  const count = await getCartCount();
  return (
    <Link href="/cart" className="text-sm hover:underline">
      Cart ({count})
    </Link>
  );
}
