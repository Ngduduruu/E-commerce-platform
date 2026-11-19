# E-commerce

Next.js 16 (App Router, Cache Components) · PostgreSQL via Prisma 7 · Stripe Checkout · Tailwind CSS 4.

## Getting started

```bash
npm install            # also generates the Prisma client
npm run db:start       # local Postgres (Prisma dev server, no Docker needed)
npm run db:migrate     # apply migrations
npm run db:seed        # sample products
npm run dev            # http://localhost:3000
```

Copy `.env.example` to `.env` if you don't have one. The local database URL is already set there.

### Payments (Stripe test mode)

1. Put your test secret key in `.env` as `STRIPE_SECRET_KEY`.
2. Forward webhooks to the app with the [Stripe CLI](https://docs.stripe.com/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Put the `whsec_...` value it prints in `.env` as `STRIPE_WEBHOOK_SECRET`.
3. Pay with card `4242 4242 4242 4242`, any future date and any CVC.

The storefront and cart work without Stripe keys. Checkout shows an error until they're set.

## How it fits together

| Path | Purpose |
| --- | --- |
| `prisma/schema.prisma` | `Product`, `Order`, `OrderItem` models |
| `src/lib/catalog.ts` | Cached product queries (`"use cache"`, tag `products`) |
| `src/lib/cart.ts` | Cart stored in an httpOnly cookie as `{productId, quantity}[]`; prices always come from the DB |
| `src/app/actions.ts` | Server Actions: add/update cart, start checkout |
| `src/app/api/webhooks/stripe/route.ts` | Marks orders paid/cancelled, decrements stock, invalidates the catalog cache |

**Order flow:** checkout creates a `PENDING` order with a price snapshot, then redirects to Stripe Checkout. The webhook (`checkout.session.completed`) sets the order to `PAID` and decrements stock. Because the update only matches `PENDING` orders, a webhook delivered twice is handled once. An expired session sets the order to `CANCELLED`.

**Caching:** product data is cached and shared across requests. Anything that changes products must invalidate the `products` tag: `updateTag` in Server Actions, `revalidateTag` in Route Handlers.

## Scripts

| Script | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / route typegen + `tsc` |
| `npm run db:start` / `db:stop` | Local Postgres |
| `npm run db:migrate` | Create/apply migrations |
| `npm run db:seed` | Seed products |
| `npm run db:studio` | Prisma Studio |

## Deploying

Use any hosted Postgres (Neon, Supabase, Prisma Postgres, RDS). Set `DATABASE_URL`, `APP_URL`, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Run `prisma migrate deploy` before starting, and add a webhook endpoint in the Stripe dashboard pointing to `/api/webhooks/stripe`. The build prerenders the catalog, so the database must be reachable at build time.
