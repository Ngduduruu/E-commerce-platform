import Stripe from "stripe";

let client: Stripe | undefined;

// Created lazily so the storefront still runs before Stripe keys are configured.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key);
  return client;
}
