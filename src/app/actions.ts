"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCartLines, MAX_QTY, readCart, writeCart } from "@/lib/cart";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

const qtySchema = z.coerce.number().int().min(0).max(MAX_QTY);

export async function addToCart(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const quantity = qtySchema.catch(1).parse(formData.get("quantity"));
  const product = await db.product.findFirst({ where: { id: productId, active: true } });
  if (!product || quantity < 1) return;

  const cart = await readCart();
  const existing = cart.find((e) => e.productId === productId);
  if (existing) existing.quantity = Math.min(existing.quantity + quantity, MAX_QTY, product.stock);
  else cart.push({ productId, quantity: Math.min(quantity, product.stock) });

  await writeCart(cart.filter((e) => e.quantity > 0));
  refresh();
}

export async function updateCartItem(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const parsed = qtySchema.safeParse(formData.get("quantity"));
  if (!parsed.success) return;

  const cart = (await readCart())
    .map((e) => (e.productId === productId ? { ...e, quantity: parsed.data } : e))
    .filter((e) => e.quantity > 0);
  await writeCart(cart);
  refresh();
}

export async function clearCart() {
  await writeCart([]);
  refresh();
}

export type CheckoutState = { error?: string };

// Used with useActionState; the previous state isn't needed.
export async function checkout(): Promise<CheckoutState> {
  const lines = await getCartLines();
  if (lines.length === 0) return { error: "Your cart is empty." };

  const outOfStock = lines.find((l) => l.quantity > l.product.stock);
  if (outOfStock) {
    return { error: `Only ${outOfStock.product.stock} of ${outOfStock.product.name} left in stock.` };
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return { error: "Payments aren't configured yet. Set STRIPE_SECRET_KEY in .env." };
  }

  const currency = lines[0].product.currency;
  const order = await db.order.create({
    data: {
      currency,
      totalCents: lines.reduce((sum, l) => sum + l.lineTotalCents, 0),
      items: {
        create: lines.map((l) => ({
          productId: l.product.id,
          name: l.product.name,
          unitPriceCents: l.product.priceCents,
          quantity: l.quantity,
        })),
      },
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  let sessionUrl: string;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      line_items: lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency,
          unit_amount: l.product.priceCents,
          product_data: {
            name: l.product.name,
            ...(l.product.imageUrl ? { images: [l.product.imageUrl] } : {}),
          },
        },
      })),
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
    });
    if (!session.url) throw new Error("Stripe returned no session URL");
    await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    sessionUrl = session.url;
  } catch (err) {
    console.error("Stripe checkout failed", err);
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    return { error: "Couldn't start checkout. Please try again." };
  }

  // redirect() throws, so it must stay outside the try/catch above.
  redirect(sessionUrl);
}
