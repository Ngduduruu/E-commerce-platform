import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { PRODUCTS_TAG } from "@/lib/catalog";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return new Response("Webhook not configured", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Signature verification needs the exact raw body.
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (err) {
    console.error("Invalid Stripe webhook signature", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.payment_status === "paid") await markPaid(session);
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const orderId = event.data.object.metadata?.orderId;
      if (orderId) {
        await db.order.updateMany({
          where: { id: orderId, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
      }
      break;
    }
  }

  return Response.json({ received: true });
}

async function markPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  await db.$transaction(async (tx) => {
    // Conditional update makes this idempotent: Stripe may deliver an event more than once.
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "PAID", email: session.customer_details?.email ?? null },
    });
    if (count === 0) return;

    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });

  // Stock changed: drop cached catalog data so "Sold out" and quantity limits are accurate.
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
}
