import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClearCart } from "@/components/clear-cart";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Order confirmed" };

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <Suspense fallback={<p className="text-black/60 dark:text-white/60">Loading your order…</p>}>
      <OrderSummary searchParams={searchParams} />
    </Suspense>
  );
}

async function OrderSummary({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const sessionId = (await searchParams).session_id;
  const order =
    typeof sessionId === "string"
      ? await db.order.findUnique({ where: { stripeSessionId: sessionId }, include: { items: true } })
      : null;

  if (!order) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Order not found</h1>
        <Link href="/" className="underline">
          Back to the store
        </Link>
      </div>
    );
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <ClearCart />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thanks for your order!</h1>
        <p className="mt-1 text-black/60 dark:text-white/60">
          {order.status === "PAID"
            ? "Payment received."
            : "We're confirming your payment. This page will show it once Stripe notifies us."}
          {order.email && ` A receipt will be sent to ${order.email}.`}
        </p>
      </div>
      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between py-2">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="tabular-nums">
              {formatMoney(item.unitPriceCents * item.quantity, order.currency)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-right font-semibold tabular-nums">
        Total {formatMoney(order.totalCents, order.currency)}
      </p>
      <Link href="/" className="underline">
        Continue shopping
      </Link>
    </div>
  );
}
