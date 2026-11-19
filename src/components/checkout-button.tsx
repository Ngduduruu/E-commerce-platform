"use client";

import { useActionState } from "react";
import { checkout, type CheckoutState } from "@/app/actions";

export function CheckoutButton() {
  const [state, action, pending] = useActionState<CheckoutState>(checkout, {});

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "Redirecting…" : "Checkout"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
